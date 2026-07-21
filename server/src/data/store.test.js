const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const store = require('./store');

describe('provisionTenant', () => {
  it('sets the tenant status to active', () => {
    const tenant = store.provisionTenant('cust_001');
    assert.ok(tenant);
    assert.strictEqual(tenant.status, 'active');
  });

  it('marks the Tenant Setup step completed and bumps progress', () => {
    store.provisionTenant('cust_001');
    const state = store.getOnboardingState('cust_001');
    const step = state.steps.find(s => s.name === 'Tenant Setup');
    assert.strictEqual(step.status, 'completed');
    assert.ok(state.progressPercent > 0);
  });

  it('returns null for an unknown customer', () => {
    assert.strictEqual(store.provisionTenant('does_not_exist'), null);
  });

  it('is idempotent when the tenant is already active', () => {
    store.provisionTenant('cust_001');
    const again = store.provisionTenant('cust_001');
    assert.strictEqual(again.status, 'active');
    const state = store.getOnboardingState('cust_001');
    const completed = state.steps.filter(s => s.status === 'completed').length;
    assert.strictEqual(completed, 1);
  });
});
