/**
 * Shared Contact Model
 *
 * The target data model that every customer's contact data is normalized INTO.
 * Adapters (see server/src/import/adapters/contacts) map each customer's own
 * columns and picklist values onto these canonical fields and values.
 */

/**
 * Canonical picklist values. Adapters map customer-specific values onto these.
 */
const CONTACT_STATUS = ['active', 'inactive', 'pending'];

const CONTACT_METHOD = ['email', 'phone', 'mail'];

/**
 * @typedef {Object} Contact
 * @property {string} id
 * @property {string} clientId               - id of the Client this contact belongs to
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} phone
 * @property {string} role
 * @property {string} status                 - one of CONTACT_STATUS (or raw value if unmapped)
 * @property {string} preferredContactMethod - one of CONTACT_METHOD (or raw value if unmapped)
 * @property {string} department
 */

/**
 * The ordered list of fields in the shared Contact model.
 * Drives both the factory and the UI table columns.
 */
const CONTACT_FIELDS = [
  'id',
  'clientId',
  'firstName',
  'lastName',
  'email',
  'phone',
  'role',
  'status',
  'preferredContactMethod',
  'department'
];

/**
 * Creates a normalized Contact, filling any missing field with ''.
 * @param {Partial<Contact>} data
 * @returns {Contact}
 */
function createContact(data = {}) {
  const contact = {};
  for (const field of CONTACT_FIELDS) {
    contact[field] = data[field] !== undefined ? data[field] : '';
  }
  return contact;
}

module.exports = {
  CONTACT_STATUS,
  CONTACT_METHOD,
  CONTACT_FIELDS,
  createContact
};
