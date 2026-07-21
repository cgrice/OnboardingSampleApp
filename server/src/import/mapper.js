/**
 * Mapper — the generic transform engine.
 *
 * Takes parsed CSV rows plus an adapter config and produces normalized records
 * against a shared model. Adapter-agnostic AND entity-agnostic: all
 * customer-specific knowledge lives in the adapter, and the target model is
 * supplied as a factory, so the same engine handles every customer and every
 * entity (Client, Contact, …).
 */

const { createClient } = require('../models/client');
const { createContact } = require('../models/contact');

/**
 * Parses a date string in a known format into ISO YYYY-MM-DD.
 * Returns null if it can't be parsed cleanly.
 * @param {string} value
 * @param {string} format - 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY'
 * @returns {string|null}
 */
function parseDate(value, format) {
  if (!value) return null;
  const parts = value.split(/[/\-]/).map((p) => p.trim());
  if (parts.length !== 3) return null;

  let year, month, day;
  switch (format) {
    case 'MM/DD/YYYY':
      [month, day, year] = parts;
      break;
    case 'DD-MM-YYYY':
      [day, month, year] = parts;
      break;
    case 'YYYY-MM-DD':
      [year, month, day] = parts;
      break;
    default:
      return null;
  }

  if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month) || !/^\d{1,2}$/.test(day)) {
    return null;
  }
  const mm = month.padStart(2, '0');
  const dd = day.padStart(2, '0');
  if (Number(mm) < 1 || Number(mm) > 12 || Number(dd) < 1 || Number(dd) > 31) {
    return null;
  }
  return `${year}-${mm}-${dd}`;
}

/**
 * Parses a numeric string, tolerating currency symbols, commas and spaces.
 * Returns null if it can't be parsed.
 * @param {string} value
 * @returns {number|null}
 */
function parseNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const cleaned = String(value).replace(/[^0-9.\-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const num = Number(cleaned);
  return Number.isNaN(num) ? null : num;
}

/**
 * Maps parsed CSV rows into normalized records using an adapter and a model
 * factory. The factory (createClient, createContact, …) decides which shared
 * model the rows are normalized into; everything else is adapter-driven.
 *
 * @param {Array<Object<string,string>>} rows - output of parseCsv
 * @param {object} adapter - a customer adapter config
 * @param {(data: object) => object} createRecord - shared-model factory
 * @returns {{ records: object[], summary: object }}
 */
function mapRecords(rows, adapter, createRecord) {
  const { columnMap, valueMaps = {}, typeHints = {}, dateFormat } = adapter;

  // Which source columns do we recognize? Everything else is "unmapped".
  const knownColumns = new Set(Object.keys(columnMap));
  const seenUnmappedColumns = new Set();
  let unmappedValues = 0;
  let unparseableCount = 0;

  const records = rows.map((row) => {
    const normalized = {};

    for (const [sourceCol, rawValue] of Object.entries(row)) {
      if (!knownColumns.has(sourceCol)) {
        if (rawValue !== '') seenUnmappedColumns.add(sourceCol);
        continue;
      }

      const targetField = columnMap[sourceCol];
      let value = rawValue;

      // 1. Value/picklist mapping
      if (valueMaps[targetField]) {
        const map = valueMaps[targetField];
        if (value in map) {
          value = map[value];
        } else if (value !== '') {
          unmappedValues++;
          // pass through raw value
        }
      }

      // 2. Type coercion
      const hint = typeHints[targetField];
      if (hint === 'date') {
        const iso = parseDate(value, dateFormat);
        if (iso === null) {
          if (value !== '') unparseableCount++;
        } else {
          value = iso;
        }
      } else if (hint === 'number') {
        const num = parseNumber(value);
        if (num === null) {
          if (value !== '') unparseableCount++;
        } else {
          value = num;
        }
      }

      normalized[targetField] = value;
    }

    return createRecord(normalized);
  });

  return {
    records,
    summary: {
      totalRows: rows.length,
      mapped: records.length,
      unmappedColumns: [...seenUnmappedColumns],
      unmappedValues,
      unparseableValues: unparseableCount
    }
  };
}

/**
 * Maps parsed CSV rows into normalized Client records using an adapter.
 * @param {Array<Object<string,string>>} rows
 * @param {object} adapter
 * @returns {{ records: object[], summary: object }}
 */
function mapClients(rows, adapter) {
  return mapRecords(rows, adapter, createClient);
}

/**
 * Maps parsed CSV rows into normalized Contact records using an adapter.
 * @param {Array<Object<string,string>>} rows
 * @param {object} adapter
 * @returns {{ records: object[], summary: object }}
 */
function mapContacts(rows, adapter) {
  return mapRecords(rows, adapter, createContact);
}

module.exports = { mapRecords, mapClients, mapContacts, parseDate, parseNumber };
