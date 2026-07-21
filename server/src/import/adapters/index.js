/**
 * Adapter Registry
 *
 * The extension point for onboarding new customers. Add a new adapter module
 * and register it here; the importer looks adapters up by key.
 */

const customerA = require('./customerA');

const adapters = {
  [customerA.key]: customerA
  // Future: [customerB.key]: customerB, [customerC.key]: customerC
};

/**
 * @param {string} key
 * @returns {object|undefined} the adapter, or undefined if unknown
 */
function getAdapter(key) {
  return adapters[key];
}

/**
 * Lightweight list for populating UI dropdowns.
 * @returns {Array<{key: string, label: string, entity: string}>}
 */
function listAdapters() {
  return Object.values(adapters).map(({ key, label, entity }) => ({
    key,
    label,
    entity
  }));
}

module.exports = { getAdapter, listAdapters, adapters };
