/**
 * Customer A — ABC Accounting (Client entity adapter)
 *
 * Title Case columns, MM/DD/YYYY dates.
 *
 * This is a pure declarative config. To onboard another customer, copy this
 * file, change the maps, and register it in ./index.js — no other code changes.
 * See ../mapper.js for how each field below is interpreted.
 */

module.exports = {
  key: 'customerA',
  label: 'Customer A — ABC Accounting',
  entity: 'client',
  dateFormat: 'MM/DD/YYYY',

  // Source CSV column name -> shared Client field name.
  // Columns not listed here are ignored (reported as unmappedColumns).
  columnMap: {
    'Client ID': 'id',
    'Client Name': 'name',
    'Business Type': 'entityType',
    'Status': 'status',
    'Date Onboarded': 'onboardedDate',
    'Tax ID': 'taxId',
    'Annual Revenue': 'annualRevenue',
    'Industry': 'industry',
    'Payment Terms': 'paymentTerms',
    'Primary Contact': 'primaryContact'
  },

  // Picklist normalization: shared field -> { sourceValue: canonicalValue }.
  // Values not found here pass through as-is (reported as unmappedValues).
  valueMaps: {
    status: {
      Active: 'active',
      Inactive: 'inactive',
      Pending: 'pending'
    },
    entityType: {
      Corporation: 'corporation',
      'S-Corporation': 's_corporation',
      LLC: 'llc',
      Partnership: 'partnership',
      'Sole Proprietorship': 'sole_proprietor',
      'Non-Profit': 'non_profit'
    }
  },

  // Fields needing type coercion beyond a plain string copy.
  typeHints: {
    annualRevenue: 'number',
    onboardedDate: 'date'
  }
};
