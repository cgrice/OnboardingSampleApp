/**
 * Customer A — ABC Accounting (Contact entity adapter)
 *
 * Title Case columns. Contacts belong to a Client via "Client ID".
 *
 * This is a pure declarative config. To onboard another customer's contacts,
 * copy this file, change the maps, and register it in ../index.js — no other
 * code changes. See ../../mapper.js for how each field below is interpreted.
 */

module.exports = {
  key: 'customerA',
  label: 'Customer A — ABC Accounting',
  entity: 'contact',

  // Source CSV column name -> shared Contact field name.
  // Columns not listed here are ignored (reported as unmappedColumns).
  columnMap: {
    'Contact ID': 'id',
    'Client ID': 'clientId',
    'First Name': 'firstName',
    'Last Name': 'lastName',
    'Email': 'email',
    'Phone': 'phone',
    'Role': 'role',
    'Status': 'status',
    'Preferred Contact Method': 'preferredContactMethod',
    'Department': 'department'
  },

  // Picklist normalization: shared field -> { sourceValue: canonicalValue }.
  // Values not found here pass through as-is (reported as unmappedValues).
  valueMaps: {
    status: {
      Active: 'active',
      Inactive: 'inactive',
      Pending: 'pending'
    },
    preferredContactMethod: {
      Email: 'email',
      Phone: 'phone',
      Mail: 'mail'
    }
  }

  // No typeHints: contacts have no dates or numbers to coerce.
};
