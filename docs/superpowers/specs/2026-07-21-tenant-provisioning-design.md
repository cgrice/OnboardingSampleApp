# Tenant Provisioning Slice — Design

**Date:** 2026-07-21
**Status:** Approved

## Goal

Give the CS team a one-click "Set up tenant" action for the example customer
(Acme Corporation) that provisions their tenant via the API. This is the first
thin vertical slice of the Tenant Setup step — no data mapping or customer-info
editing.

## Behaviour

When a user clicks **Set up tenant** on the Tenant Setup tab:

1. The customer's existing tenant status flips from `pending` to `active`.
2. The **Tenant Setup** onboarding step is marked `completed`.
3. Overall onboarding progress is recalculated.

## Backend

### Store function: `provisionTenant(customerId)`

Added to `server/src/data/store.js`. Holds the logic so it is unit-testable
without HTTP dependencies, matching the existing pure-function test style.

- Find the tenant by `customerId`. If none exists, return `null` (endpoint maps
  this to `404`).
- Set tenant `status: 'active'`.
- Find the customer's onboarding state and mark the **Tenant Setup** step
  (`name === 'Tenant Setup'`) as `completed`.
- Recalculate `progressPercent` using the existing `calculateProgress()` from
  `models`.
- **Idempotent:** re-running against an already-active tenant returns it
  unchanged (step stays completed, progress unchanged).
- Returns the updated tenant object.

### Endpoint: `POST /api/tenants/:customerId/provision`

Added to `server/src/index.js`. Thin wrapper:

- Calls `store.provisionTenant(req.params.customerId)`.
- Returns the updated tenant as JSON on success.
- Returns `404 { error: 'Tenant not found' }` when the store returns `null`.

## Frontend

Replace the placeholder **Tenant Setup** tab with a real `TenantSetupTab`
component in `client/src/App.jsx`:

- On mount, fetch `/api/customers` and use the first customer (Acme), then fetch
  its tenant via `/api/tenants/:customerId`.
- Display the customer name and current tenant status.
- **Set up tenant** button:
  - Disabled while a request is in flight.
  - Disabled once the tenant status is `active`.
  - On click, `POST /api/tenants/:customerId/provision`; on success, update the
    displayed status to `active`.
  - On failure, show an inline error message.

## Data Flow

```
Click "Set up tenant"
  → POST /api/tenants/:customerId/provision
    → store.provisionTenant: tenant → active, step → completed, progress recalculated
  → response (updated tenant)
  → UI shows status "active", button disabled
```

The Dashboard reflects the completed step and updated progress the next time it
loads (in-memory store, single process).

## Testing

- **Unit** (`server/src/data/store.test.js`, run via `node --test`):
  - Provisioning sets the tenant to `active`.
  - The Tenant Setup step becomes `completed` and progress increases.
  - Unknown `customerId` returns `null`.
  - Re-running on an already-active tenant is idempotent.
- **E2E** (`tests/e2e/tenant-setup.spec.js`, Playwright):
  - Open the Tenant Setup tab → click **Set up tenant** → status shows `active`.

## Out of Scope

- Data mapping and customer-info editing.
- Creating brand-new tenants (we provision the existing seeded tenant).
- Simulated provisioning delay / intermediate `provisioning` state.
- Persistence beyond the in-memory store.
