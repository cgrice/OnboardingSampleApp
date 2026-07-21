const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('./index');

describe('POST /api/customers', () => {
  it('creates a customer and returns 201', async () => {
    const res = await request(app)
      .post('/api/customers')
      .send({ name: 'Globex Ltd', industry: 'Tech', region: 'EMEA' });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.name, 'Globex Ltd');
    assert.ok(res.body.id.startsWith('cust_'));
  });

  it('starts onboarding at 0% for the new customer', async () => {
    const created = await request(app)
      .post('/api/customers')
      .send({ name: 'Initech' });

    const onboarding = await request(app)
      .get(`/api/customers/${created.body.id}/onboarding`);

    assert.strictEqual(onboarding.status, 200);
    assert.strictEqual(onboarding.body.progressPercent, 0);
    assert.strictEqual(onboarding.body.steps.length, 4);
  });

  it('makes the new customer appear in the dashboard queue', async () => {
    const created = await request(app)
      .post('/api/customers')
      .send({ name: 'Umbrella Corp' });

    const dashboard = await request(app).get('/api/onboarding');
    const entry = dashboard.body.find(d => d.customerId === created.body.id);

    assert.ok(entry, 'new customer should be in the dashboard queue');
    assert.strictEqual(entry.customerName, 'Umbrella Corp');
  });

  it('rejects a missing name with 400', async () => {
    const res = await request(app).post('/api/customers').send({});
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error);
  });

  it('rejects an empty/whitespace name with 400', async () => {
    const res = await request(app)
      .post('/api/customers')
      .send({ name: '   ' });
    assert.strictEqual(res.status, 400);
  });
});
