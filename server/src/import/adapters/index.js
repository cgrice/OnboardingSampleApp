/**
 * Adapter Registry
 *
 * The extension point for onboarding new customers. Add a new adapter module
 * and register it here; the importer looks adapters up by key. Client and
 * Contact adapters live in separate registries so the same customer key can
 * exist for both entities.
 */

const customerA = require('./customerA');
const customerAContacts = require('./contacts/customerA');

const adapters = {
  [customerA.key]: customerA
  // Future: [customerB.key]: customerB, [customerC.key]: customerC
};

const contactAdapters = {
  [customerAContacts.key]: customerAContacts
  // Future: [customerB.key]: customerBContacts, ...
};

/**
 * @param {string} key
 * @returns {object|undefined} the client adapter, or undefined if unknown
 */
function getAdapter(key) {
  return adapters[key];
}

/**
 * @param {string} key
 * @returns {object|undefined} the contact adapter, or undefined if unknown
 */
function getContactAdapter(key) {
  return contactAdapters[key];
}

/**
 * Lightweight list of a registry for populating UI dropdowns.
 * @param {Object<string, object>} registry
 * @returns {Array<{key: string, label: string, entity: string}>}
 */
function listRegistry(registry) {
  return Object.values(registry).map(({ key, label, entity }) => ({
    key,
    label,
    entity
  }));
}

/**
 * Lightweight list of client adapters for populating UI dropdowns.
 * @returns {Array<{key: string, label: string, entity: string}>}
 */
function listAdapters() {
  return listRegistry(adapters);
}

/**
 * Lightweight list of contact adapters for populating UI dropdowns.
 * @returns {Array<{key: string, label: string, entity: string}>}
 */
function listContactAdapters() {
  return listRegistry(contactAdapters);
}

module.exports = {
  getAdapter,
  listAdapters,
  getContactAdapter,
  listContactAdapters,
  adapters,
  contactAdapters
};
