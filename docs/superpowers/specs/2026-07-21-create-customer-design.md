# Create a New Customer to Onboard — Design

**Date:** 2026-07-21
**Status:** Approved

## Goal

Give the CS team the ability to create a new customer directly from the app.
The new customer must appear in the onboarding queue immediately, at 0% progress
with the four default onboarding steps.

## User-facing behaviour

- The Dashboard shows a **"+ New Customer"** button.
- Clicking it reveals an inline form with fields: **Name (required)**, Industry,
  Region, Contact Email (all optional).
- On **Save**, the customer and their onboarding state are created, the form
  closes, and the new customer's card appears in the queue at 0%.
- On **Cancel**, the form closes without changes.
- If the request fails (e.g. empty name), an inline error message is shown and
  the form stays open.

## Backend

### New endpoint: `POST /api/customers`

- **Request body:** `{ name, industry?, region?, contactEmail? }`
- **Validation:** `name` must be present and non-empty (after trimming).
  Otherwise respond `400 { error: 'Name is required' }`.
- **On success:**
  1. Build a `Customer` via `createCustomer(...)` (model supplies default
     `id` = `cust_${Date.now()}` and `createdAt`).
  2. `store.addCustomer(customer)`.
  3. Create an onboarding state
     `{ customerId, steps: createDefaultOnboardingSteps(), progressPercent: 0 }`
     via `store.addOnboardingState(...)`.
  4. Respond `201` with the created customer.

No changes to the domain models or the store are required — `addCustomer` and
`addOnboardingState` already exist.

### Testability refactor

To unit-test the endpoint (including validation), `server/src/index.js` will
export the configured Express `app`, and only call `app.listen(...)` when run
directly (`if (require.main === module)`). This keeps the run behaviour
identical while allowing tests to import the app.

## Frontend (`client/src/App.jsx`)

- `DashboardTab` gains local state for form visibility, field values, submitting,
  and error.
- A `+ New Customer` button toggles the inline form.
- Save issues `POST /api/customers`; on success it re-fetches `/api/onboarding`
  so the new card renders, then resets and closes the form. The re-fetch is
  lifted to a reusable function in `App` (or passed down as a callback) so the
  new customer appears without a full page reload.
- Minimal styling reusing existing CSS class conventions in `index.css`.

## Testing

- **Unit (server, `node --test` + `supertest`):**
  - `POST /api/customers` with a name creates a customer and returns 201.
  - After creation, an onboarding state exists for that customer at 0%.
  - `POST /api/customers` with empty/missing name returns 400.
  - `supertest` is added as a server dev dependency.
- **E2E (Playwright):**
  - Click "+ New Customer", enter a name, Save, and assert a new customer card
    with that name appears in the queue.

## Out of scope (YAGNI)

- Tenant creation.
- Email format or other field validation beyond required-name.
- Editing or deleting customers.
- Any persistence beyond the existing in-memory store.
