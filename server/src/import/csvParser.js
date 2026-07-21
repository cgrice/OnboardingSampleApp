/**
 * Minimal CSV Parser
 *
 * One job: turn CSV text into an array of header-keyed row objects.
 * No mapping/normalization logic lives here.
 *
 * Handles: quoted fields, commas inside quotes, escaped quotes (""),
 * and CRLF or LF line endings. Not a full RFC-4180 implementation, but
 * robust enough for the sample accounting exports.
 */

/**
 * Parses a single CSV line into an array of field strings.
 * @param {string} line
 * @returns {string[]}
 */
function parseLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"'; // escaped quote
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields.map((f) => f.trim());
}

/**
 * Parses CSV text into row objects keyed by the header row.
 * @param {string} text - raw CSV content
 * @returns {Array<Object<string,string>>}
 */
function parseCsv(text) {
  if (!text || !text.trim()) return [];

  const lines = text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '');

  if (lines.length < 2) return []; // header only or empty

  const headers = parseLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i] !== undefined ? values[i] : '';
    });
    return row;
  });
}

module.exports = { parseCsv, parseLine };
