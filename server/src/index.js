const express = require('express');
const cors = require('cors');
const store = require('./data/store');
const { createCustomer, createTenant, createDefaultOnboardingSteps } = require('./models');
const { parseCsv } = require('./import/csvParser');
const { mapClients } = require('./import/mapper');
const { getAdapter, listAdapters } = require('./import/adapters');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
// Accept raw CSV uploads as text/csv (client posts file contents directly).
app.use(express.text({ type: ['text/csv', 'text/plain'], limit: '5mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all customers
app.get('/api/customers', (req, res) => {
  res.json(store.getCustomers());
});

// Get customer by ID
app.get('/api/customers/:id', (req, res) => {
  const customer = store.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  res.json(customer);
});

// Create a new customer (and start their onboarding)
app.post('/api/customers', (req, res) => {
  const { name, industry, region, contactEmail } = req.body || {};

  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }

  const customer = createCustomer({
    name: name.trim(),
    industry,
    region,
    contactEmail
  });
  store.addCustomer(customer);

  // Every customer gets a tenant so it can be provisioned from the Tenant Setup tab.
  store.addTenant(createTenant({ customerId: customer.id }));

  store.addOnboardingState({
    customerId: customer.id,
    steps: createDefaultOnboardingSteps(),
    progressPercent: 0
  });

  res.status(201).json(customer);
});

// Get onboarding state for a customer
app.get('/api/customers/:id/onboarding', (req, res) => {
  const state = store.getOnboardingState(req.params.id);
  if (!state) {
    return res.status(404).json({ error: 'Onboarding state not found' });
  }
  res.json(state);
});

// Get all onboarding states (dashboard view)
app.get('/api/onboarding', (req, res) => {
  const states = store.getAllOnboardingStates();
  const customers = store.getCustomers();
  
  // Join customer info with onboarding state
  const dashboard = states.map(state => {
    const customer = customers.find(c => c.id === state.customerId);
    return {
      ...state,
      customerName: customer?.name || 'Unknown',
      customerIndustry: customer?.industry || '',
      customerRegion: customer?.region || ''
    };
  });
  
  res.json(dashboard);
});

// Get tenant by customer ID
app.get('/api/tenants/:customerId', (req, res) => {
  const tenant = store.getTenantByCustomerId(req.params.customerId);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  res.json(tenant);
});

// List available import adapters (for the UI customer dropdown)
app.get('/api/import/adapters', (req, res) => {
  res.json(listAdapters());
});

// Import & map a Clients CSV.
// Body: raw CSV text. Query: ?customer=<adapterKey>
app.post('/api/import/clients', (req, res) => {
  const customerKey = req.query.customer;
  const adapter = getAdapter(customerKey);

  if (!adapter) {
    return res.status(400).json({
      error: `Unknown customer '${customerKey}'. Known: ${listAdapters()
        .map((a) => a.key)
        .join(', ')}`
    });
  }

  const csvText = typeof req.body === 'string' ? req.body : '';
  if (!csvText.trim()) {
    return res.status(400).json({ error: 'Empty CSV body' });
  }

  const rows = parseCsv(csvText);
  const { records, summary } = mapClients(rows, adapter);

  res.json({ customer: adapter.label, records, summary });
});

// Provision a tenant (pending -> active, marks Tenant Setup step complete)
app.post('/api/tenants/:customerId/provision', (req, res) => {
  const tenant = store.provisionTenant(req.params.customerId);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  res.json(tenant);
});

// Start server (only when run directly, so tests can import the app)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Onboarding API server running at http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
