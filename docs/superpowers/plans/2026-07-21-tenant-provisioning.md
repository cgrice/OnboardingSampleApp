# Tenant Provisioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-click "Set up tenant" action that provisions the example customer's tenant via the API (tenant `pending → active`, Tenant Setup step completed, progress recalculated).

**Architecture:** A pure, unit-testable `provisionTenant(customerId)` function in the in-memory store holds all logic. A thin `POST /api/tenants/:customerId/provision` endpoint wraps it. The frontend's placeholder Tenant Setup tab becomes a real component that reads the customer's tenant status and triggers provisioning.

**Tech Stack:** Express.js (backend), React 18 + Vite (frontend), Node built-in test runner (`node --test`) for unit tests, Playwright for e2e.

## Global Constraints

- Storage is in-memory only — no database, no persistence beyond the running process.
- No new npm dependencies (unit tests use `node --test`; no supertest).
- Backend runs on port 3001; Vite dev server on 5173 proxies `/api` to the backend.
- The seeded example customer is `cust_001` (Acme Corporation) with tenant `tenant_001` (status `pending`).
- The Tenant Setup onboarding step is identified by `name === 'Tenant Setup'`.

---

### Task 1: `provisionTenant` store function + unit tests

**Files:**
- Modify: `server/src/data/store.js` (add `provisionTenant`, export it)
- Test: `server/src/data/store.test.js` (create)

**Interfaces:**
- Consumes: existing `store.js` internals — the module-level `store` object (`store.tenants`, `store.onboardingStates`) and `calculateProgress` from `../models`.
- Produces: `provisionTenant(customerId: string): Tenant | null` — sets the tenant's `status` to `'active'`, marks the customer's `Tenant Setup` step `completed`, recalculates `progressPercent`, and returns the updated tenant. Returns `null` if no tenant exists for `customerId`. Idempotent.

- [ ] **Step 1: Write the failing tests**

Create `server/src/data/store.test.js`:

```javascript
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
```

Note: tests share the seeded singleton store and run in file order; each asserts a state that holds after one or more provisions of `cust_001`, so ordering is safe.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npm test`
Expected: FAIL — `store.provisionTenant is not a function`.

- [ ] **Step 3: Implement `provisionTenant`**

In `server/src/data/store.js`, add the function (before `module.exports`). Note `calculateProgress` must be imported — update the existing top `require` from `../models`:

```javascript
const { createCustomer, createTenant, createDefaultOnboardingSteps, calculateProgress } = require('../models');
```

```javascript
function provisionTenant(customerId) {
  const tenant = store.tenants.find(t => t.customerId === customerId);
  if (!tenant) {
    return null;
  }

  tenant.status = 'active';

  const state = store.onboardingStates.find(s => s.customerId === customerId);
  if (state) {
    const step = state.steps.find(s => s.name === 'Tenant Setup');
    if (step) {
      step.status = 'completed';
    }
    state.progressPercent = calculateProgress(state.steps);
  }

  return tenant;
}
```

Add `provisionTenant` to the `module.exports` object.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && npm test`
Expected: PASS — all `provisionTenant` tests plus the existing model tests pass.

- [ ] **Step 5: Commit**

```bash
git add server/src/data/store.js server/src/data/store.test.js
git commit -m "feat: add provisionTenant store function"
```

---

### Task 2: `POST /api/tenants/:customerId/provision` endpoint

**Files:**
- Modify: `server/src/index.js` (add the route near the other `/api/tenants` route)

**Interfaces:**
- Consumes: `store.provisionTenant(customerId)` from Task 1.
- Produces: `POST /api/tenants/:customerId/provision` → `200` with the updated tenant JSON, or `404 { error: 'Tenant not found' }`.

- [ ] **Step 1: Add the endpoint**

In `server/src/index.js`, add after the existing `GET /api/tenants/:customerId` route (around line 66):

```javascript
// Provision a tenant (pending -> active, marks Tenant Setup step complete)
app.post('/api/tenants/:customerId/provision', (req, res) => {
  const tenant = store.provisionTenant(req.params.customerId);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  res.json(tenant);
});
```

- [ ] **Step 2: Verify manually**

Run the server: `cd server && npm start` (in a separate shell), then:

```bash
curl -s -X POST http://localhost:3001/api/tenants/cust_001/provision
```

Expected: JSON tenant with `"status":"active"`. And:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3001/api/tenants/nope/provision
```

Expected: `404`. Stop the server afterward.

- [ ] **Step 3: Commit**

```bash
git add server/src/index.js
git commit -m "feat: add tenant provision endpoint"
```

---

### Task 3: Tenant Setup tab UI

**Files:**
- Modify: `client/src/App.jsx` (replace the Tenant Setup placeholder with `TenantSetupTab`)

**Interfaces:**
- Consumes: `GET /api/customers`, `GET /api/tenants/:customerId`, `POST /api/tenants/:customerId/provision`.
- Produces: a `TenantSetupTab` React component rendered when `activeTab === 'tenant-setup'`.

- [ ] **Step 1: Add the `TenantSetupTab` component**

In `client/src/App.jsx`, add this component (e.g. after `DashboardTab`):

```jsx
function TenantSetupTab() {
  const [customer, setCustomer] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(customers => {
        const first = customers[0];
        setCustomer(first);
        if (!first) { setLoading(false); return; }
        return fetch(`/api/tenants/${first.id}`)
          .then(res => (res.ok ? res.json() : null))
          .then(t => { setTenant(t); setLoading(false); });
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const handleProvision = () => {
    setProvisioning(true);
    setError(null);
    fetch(`/api/tenants/${customer.id}/provision`, { method: 'POST' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(updated => { setTenant(updated); setProvisioning(false); })
      .catch(err => { setError(err.message); setProvisioning(false); });
  };

  if (loading) return <div className="placeholder"><p>Loading...</p></div>;
  if (!customer) return <div className="placeholder"><p>No customer found</p></div>;

  const isActive = tenant?.status === 'active';

  return (
    <div className="placeholder">
      <h2>Tenant Setup</h2>
      <p>Customer: <strong>{customer.name}</strong></p>
      <p>Tenant status: <strong className="tenant-status">{tenant ? tenant.status : 'no tenant'}</strong></p>
      <button
        className="tab"
        onClick={handleProvision}
        disabled={provisioning || isActive || !tenant}
        style={{ marginTop: '16px' }}
      >
        {isActive ? 'Tenant active' : provisioning ? 'Setting up...' : 'Set up tenant'}
      </button>
      {error && <p style={{ color: '#dc2626', marginTop: '12px' }}>⚠️ {error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Render it in place of the placeholder**

In `App`, replace the `tenant-setup` placeholder block:

```jsx
        {activeTab === 'tenant-setup' && (
          <PlaceholderTab title="Tenant Setup" description="Provision and configure customer tenant" />
        )}
```

with:

```jsx
        {activeTab === 'tenant-setup' && (
          <TenantSetupTab />
        )}
```

- [ ] **Step 3: Verify manually**

Run `npm start` from the repo root. Open http://localhost:5173, click the **Tenant Setup** tab. Expected: shows "Customer: Acme Corporation" and "Tenant status: pending". Click **Set up tenant** → status changes to `active`, button becomes disabled and reads "Tenant active".

- [ ] **Step 4: Commit**

```bash
git add client/src/App.jsx
git commit -m "feat: add Tenant Setup tab with provisioning button"
```

---

### Task 4: E2E test for the provisioning flow

**Files:**
- Test: `tests/e2e/tenant-setup.spec.js` (create)

**Interfaces:**
- Consumes: the running app (Playwright `webServer` runs `npm start`), the Tenant Setup tab and its button from Task 3.

**Note on state:** The in-memory store persists for the life of the server process, and Playwright reuses one server. To stay order-independent, this test asserts the terminal state (`active` after clicking) and tolerates a tenant that is already active from a prior run.

- [ ] **Step 1: Write the e2e test**

Create `tests/e2e/tenant-setup.spec.js`:

```javascript
// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Tenant Setup', () => {
  test('provisions the tenant to active', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Tenant Setup' }).click();

    // Tab shows the example customer
    await expect(page.locator('.placeholder h2')).toContainText('Tenant Setup');
    await expect(page.getByText('Acme Corporation')).toBeVisible();

    const setupButton = page.getByRole('button', { name: 'Set up tenant' });

    // If not already provisioned by a prior run, click to provision.
    if (await setupButton.isVisible()) {
      await setupButton.click();
    }

    // Terminal state: status is active and the action button is disabled.
    await expect(page.locator('.tenant-status')).toHaveText('active');
    await expect(page.getByRole('button', { name: 'Tenant active' })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run the e2e test to verify it passes**

Run: `npx playwright test tenant-setup`
Expected: PASS (Playwright auto-starts the app via `webServer`).

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/tenant-setup.spec.js
git commit -m "test: add e2e test for tenant provisioning flow"
```

---

## Self-Review

**Spec coverage:**
- `provisionTenant` logic (active, step completed, progress, 404/null, idempotent) → Task 1. ✓
- `POST /api/tenants/:customerId/provision` endpoint (200 + 404) → Task 2. ✓
- Tenant Setup tab: shows customer + status, button disabled in-flight/when active, error message → Task 3. ✓
- Unit tests → Task 1; e2e test → Task 4. ✓
- Out-of-scope items (data mapping, new tenants, provisioning delay) — none introduced. ✓

**Placeholder scan:** No TBD/TODO; all code shown in full. ✓

**Type consistency:** `provisionTenant(customerId)` returns `Tenant | null` and is used consistently in Task 2; endpoint path `POST /api/tenants/:customerId/provision` matches between Tasks 2, 3, 4; `.tenant-status` selector defined in Task 3 and used in Task 4; button label "Set up tenant"/"Tenant active" consistent across Tasks 3 and 4. ✓
