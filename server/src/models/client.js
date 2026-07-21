/**
 * Shared Client Model
 *
 * The target data model that every customer's data is normalized INTO.
 * Adapters (see server/src/import/adapters) map each customer's own columns
 * and picklist values onto these canonical fields and values.
 */

/**
 * Canonical picklist values. Adapters map customer-specific values onto these.
 */
const CLIENT_STATUS = ['active', 'inactive', 'pending'];

const ENTITY_TYPE = [
  'corporation',
  's_corporation',
  'llc',
  'partnership',
  'sole_proprietor',
  'non_profit'
];

/**
 * @typedef {Object} Client
 * @property {string} id
 * @property {string} name
 * @property {string} entityType     - one of ENTITY_TYPE (or raw value if unmapped)
 * @property {string} status         - one of CLIENT_STATUS (or raw value if unmapped)
 * @property {string} onboardedDate  - ISO date YYYY-MM-DD (or raw value if unparseable)
 * @property {string} taxId
 * @property {number|string} annualRevenue - number (or raw value if unparseable)
 * @property {string} industry
 * @property {string} paymentTerms
 * @property {string} primaryContact
 */

/**
 * The ordered list of fields in the shared Client model.
 * Drives both the factory and the UI table columns.
 */
const CLIENT_FIELDS = [
  'id',
  'name',
  'entityType',
  'status',
  'onboardedDate',
  'taxId',
  'annualRevenue',
  'industry',
  'paymentTerms',
  'primaryContact'
];

/**
 * Creates a normalized Client, filling any missing field with ''.
 * @param {Partial<Client>} data
 * @returns {Client}
 */
function createClient(data = {}) {
  const client = {};
  for (const field of CLIENT_FIELDS) {
    client[field] = data[field] !== undefined ? data[field] : '';
  }
  return client;
}

module.exports = {
  CLIENT_STATUS,
  ENTITY_TYPE,
  CLIENT_FIELDS,
  createClient
};
