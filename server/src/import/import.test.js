const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { parseCsv, parseLine } = require('./csvParser');
const { mapClients, parseDate, parseNumber } = require('./mapper');
const customerA = require('./adapters/customerA');
const { getAdapter, listAdapters } = require('./adapters');

describe('csvParser', () => {
  it('parses headers into keyed row objects', () => {
    const rows = parseCsv('a,b,c\n1,2,3');
    assert.deepStrictEqual(rows, [{ a: '1', b: '2', c: '3' }]);
  });

  it('handles quoted fields containing commas', () => {
    const rows = parseCsv('name,note\n"Smith, LLC","hello, world"');
    assert.strictEqual(rows[0].name, 'Smith, LLC');
    assert.strictEqual(rows[0].note, 'hello, world');
  });

  it('handles escaped quotes', () => {
    assert.deepStrictEqual(parseLine('"say ""hi""",ok'), ['say "hi"', 'ok']);
  });

  it('tolerates CRLF and blank lines', () => {
    const rows = parseCsv('a,b\r\n1,2\r\n\r\n3,4\r\n');
    assert.strictEqual(rows.length, 2);
    assert.deepStrictEqual(rows[1], { a: '3', b: '4' });
  });

  it('returns [] for empty or header-only input', () => {
    assert.deepStrictEqual(parseCsv(''), []);
    assert.deepStrictEqual(parseCsv('a,b,c'), []);
  });
});

describe('mapper helpers', () => {
  it('parseDate normalizes MM/DD/YYYY to ISO', () => {
    assert.strictEqual(parseDate('01/15/2023', 'MM/DD/YYYY'), '2023-01-15');
  });

  it('parseDate normalizes DD-MM-YYYY and YYYY-MM-DD', () => {
    assert.strictEqual(parseDate('15-01-2024', 'DD-MM-YYYY'), '2024-01-15');
    assert.strictEqual(parseDate('2024-01-15', 'YYYY-MM-DD'), '2024-01-15');
  });

  it('parseDate returns null for garbage', () => {
    assert.strictEqual(parseDate('not-a-date', 'MM/DD/YYYY'), null);
    assert.strictEqual(parseDate('13/40/2024', 'MM/DD/YYYY'), null);
  });

  it('parseNumber strips currency/commas', () => {
    assert.strictEqual(parseNumber('2,500,000.00'), 2500000);
    assert.strictEqual(parseNumber('$1,200.50'), 1200.5);
    assert.strictEqual(parseNumber('abc'), null);
  });
});

describe('mapClients (Customer A adapter)', () => {
  it('renames columns, maps values, coerces types', () => {
    const rows = parseCsv(
      'Client ID,Client Name,Business Type,Status,Date Onboarded,Tax ID,Annual Revenue,Industry,Payment Terms,Primary Contact\n' +
        'C001,Riverside Manufacturing LLC,Corporation,Active,01/15/2023,12-3456789,2500000.00,Manufacturing,Net 30,John Smith'
    );
    const { records, summary } = mapClients(rows, customerA);
    const c = records[0];

    assert.strictEqual(c.id, 'C001');
    assert.strictEqual(c.name, 'Riverside Manufacturing LLC');
    assert.strictEqual(c.entityType, 'corporation');
    assert.strictEqual(c.status, 'active');
    assert.strictEqual(c.onboardedDate, '2023-01-15');
    assert.strictEqual(c.annualRevenue, 2500000);
    assert.strictEqual(c.primaryContact, 'John Smith');
    assert.strictEqual(summary.totalRows, 1);
    assert.strictEqual(summary.unmappedValues, 0);
  });

  it('passes unknown picklist values through and counts them', () => {
    const rows = parseCsv(
      'Client ID,Status\nC001,Frozen'
    );
    const { records, summary } = mapClients(rows, customerA);
    assert.strictEqual(records[0].status, 'Frozen');
    assert.strictEqual(summary.unmappedValues, 1);
  });

  it('reports unmapped source columns', () => {
    const rows = parseCsv('Client ID,Mystery Column\nC001,xyz');
    const { summary } = mapClients(rows, customerA);
    assert.deepStrictEqual(summary.unmappedColumns, ['Mystery Column']);
  });

  it('maps the real sample-data clients.csv end to end', () => {
    const csvPath = path.join(
      __dirname,
      '../../../sample-data/CustomerA_ABCAccounting/clients.csv'
    );
    const csv = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCsv(csv);
    const { records, summary } = mapClients(rows, customerA);

    assert.ok(records.length >= 10, 'expected at least 10 client records');
    assert.strictEqual(summary.mapped, records.length);
    // Every record must have an id and a canonical status.
    for (const r of records) {
      assert.ok(r.id, 'record has id');
      assert.ok(['active', 'inactive', 'pending'].includes(r.status), `status ${r.status} is canonical`);
    }
    // No unmapped columns in the known-good fixture.
    assert.deepStrictEqual(summary.unmappedColumns, []);
  });
});

describe('adapter registry', () => {
  it('looks up customerA and lists adapters', () => {
    assert.strictEqual(getAdapter('customerA').key, 'customerA');
    assert.strictEqual(getAdapter('nope'), undefined);
    assert.ok(listAdapters().some((a) => a.key === 'customerA'));
  });
});
