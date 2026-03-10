# Plan: Add Polar Organization Billing (Per-Seat)

## Context
The project has Polar SDK installed but the backend plugin is entirely commented out. The billing model is **per-seat**: organizations are charged based on how many members they have. Since this is an offline-first app, subscription state must be cached in the org's `metadata` JSON column (no migration needed) and updated via Polar webhooks and member change events.

**Key design decisions:**
- Polar customer = user (org admin who checks out). `createCustomerOnSignUp: true`.
- `referenceId` on checkout = org ID. This links the subscription to the org.
- `quantity` on checkout = initial member count (usually 1 at checkout time).
- Org metadata stores: `{ polarSubscriptionStatus, polarSubscriptionId, polarSeatCount }`.
- When org membership changes (member added/removed), update the Polar subscription quantity via the SDK.

---

## Prerequisites (Manual — Polar Dashboard)

Before writing any code:

1. **Create account** at https://polar.sh
2. **Create a Polar organization** (your SaaS product's org in Polar)
3. **Create a per-seat product**:
   - Billing type: Recurring (monthly or annual)
   - Pricing: **Per unit** (e.g. $10/seat/month)
   - Note the **Product ID** (format: `prod_xxxxxxxxxx`)
4. **Create an API access token**: Settings → Developers → Access Tokens → New Token
5. **Create a webhook endpoint**: Settings → Webhooks → Add Endpoint
   - URL: `https://<your-public-server>/api/auth/polar/webhooks`
   - For local dev: use `ngrok http 3000` to get a public URL
   - Events: `subscription.created`, `subscription.active`, `subscription.updated`, `subscription.canceled`, `subscription.revoked`, `subscription.uncanceled`
   - Copy the **Webhook Secret**

---

## Implementation Steps

### Step 1 — Environment variables

**File**: `packages/env/src/server.ts`
- Uncomment `POLAR_ACCESS_TOKEN: z.string().min(1)`
- Uncomment `POLAR_SUCCESS_URL: z.url()`
- Add `POLAR_WEBHOOK_SECRET: z.string().min(1)`

**File**: `apps/server/.env` + `apps/server/.env.example`
```
POLAR_ACCESS_TOKEN=pat_...
POLAR_SUCCESS_URL=http://localhost:3001/success?checkout_id={CHECKOUT_ID}
POLAR_WEBHOOK_SECRET=wh_sec_...
```

---

### Step 2 — Polar client

**File**: `packages/auth/src/lib/payments.ts`
- Uncomment `import { env } from "@pengana/env/server"`
- Uncomment `accessToken: env.POLAR_ACCESS_TOKEN`

---

### Step 3 — Enable Polar plugin with webhook handlers

**File**: `packages/auth/src/index.ts`

Imports to uncomment/add:
```typescript
import { checkout, polar, portal, webhooks } from "@polar-sh/better-auth";
import { polarClient } from "./lib/payments";
```

Replace commented-out polar plugin with:
```typescript
polar({
  client: polarClient,
  createCustomerOnSignUp: true,
  use: [
    checkout({
      products: [{ productId: "prod_xxxxxxxxxx", slug: "pro" }],
      successUrl: env.POLAR_SUCCESS_URL,
      authenticatedUsersOnly: true,
    }),
    portal(),
    webhooks({
      secret: env.POLAR_WEBHOOK_SECRET,
      onSubscriptionActive: async (payload) => {
        const orgId = payload.data.referenceId;
        if (!orgId) return;
        await db.update(orgTable).set({
          metadata: sql`jsonb_set(
            coalesce(metadata, '{}'),
            '{polarSubscriptionStatus,polarSubscriptionId,polarSeatCount}',
            ...
          )`,
        }).where(eq(orgTable.id, orgId));
        // Update: polarSubscriptionStatus = "active", polarSubscriptionId = payload.data.id
        //         polarSeatCount = payload.data.quantity
      },
      onSubscriptionCanceled: async (payload) => {
        const orgId = payload.data.referenceId;
        if (!orgId) return;
        // Update org metadata: polarSubscriptionStatus = "canceled"
      },
      onSubscriptionRevoked: async (payload) => {
        const orgId = payload.data.referenceId;
        if (!orgId) return;
        // Update org metadata: polarSubscriptionStatus = "revoked"
      },
      onSubscriptionUpdated: async (payload) => {
        const orgId = payload.data.referenceId;
        if (!orgId) return;
        // Update org metadata: polarSeatCount = payload.data.quantity
      },
    }),
  ],
}),
```

For the Drizzle updates, use multiple `jsonb_set` calls or update the full metadata object by fetching the current value first, merging, then writing back. The org table is in `packages/db/src/schema/auth.ts`.

---

### Step 4 — Sync seat count on member changes

Member count must stay in sync with the Polar subscription quantity.

**Where to hook:**

#### A) Member added (invitation accepted)
The `afterAcceptInvitation` hook already exists in `packages/auth/src/index.ts`. Add to it:
```typescript
afterAcceptInvitation: async (data) => {
  // existing notification logic...
  // Get org's polarSubscriptionId from metadata
  // Count current members: SELECT COUNT(*) FROM member WHERE organizationId = orgId
  // Call: polarClient.subscriptions.update({ id: subscriptionId, subscriptionUpdate: { quantity: newCount } })
}
```

#### B) Member removed
Better-auth's org plugin does not expose an `afterRemoveMember` hook. Instead, create a custom ORPC procedure in `packages/api/src/routers/` (e.g., `billing.ts`) that:
1. Calls `auth.api.removeMember(...)` via better-auth's server API
2. Then updates the Polar subscription quantity

**New file**: `packages/api/src/routers/billing.ts`
- Procedure: `removeOrgMember` (protectedProcedure, owner/admin only)
- Fetches current member count after removal
- Calls `polarClient.subscriptions.update({ id: subscriptionId, quantity: newCount })`

Expose this in `packages/api/src/routers/index.ts` as `appRouter.billing.*`.

---

### Step 5 — Frontend: checkout with org ID and seat count

**File**: `apps/web/src/routes/index.tsx`

Change checkout to pass org ID as referenceId and initial quantity:
```typescript
// Get activeOrg from useActiveOrg() or route context
const memberCount = activeOrg.members?.length ?? 1;
authClient.checkout({
  slug: "pro",
  referenceId: activeOrg.id,
  // quantity is not directly in CheckoutParams — instead set via Polar product's default or a custom field
})
```

**Note on quantity at checkout**: The Polar checkout itself doesn't expose a `quantity` param in `CheckoutParams`. Instead, quantity can be:
- Set to 1 at checkout (upgrade later as members are added), OR
- Pre-created server-side with quantity via `polarClient.checkouts.create(...)` and redirect to the returned URL

Simplest approach: start at quantity=1, update automatically as members are added/removed via webhooks and the `afterAcceptInvitation` hook.

Update `hasProSubscription` check:
```typescript
// Read from org metadata (cached, works offline)
const hasProSubscription = activeOrg?.metadata?.polarSubscriptionStatus === "active"
```

Remove or stop using `authClient.customer.state()` for subscription status if you're reading from org metadata.

---

### Step 6 — Expose active org with metadata on dashboard route

**File**: `apps/web/src/routes/index.tsx`

Add active org to route context (if not already present):
```typescript
beforeLoad: async () => {
  const { session } = await requireAuthAndOrg();
  // activeOrg comes from useActiveOrg() hook — metadata.polarSubscriptionStatus will be there
  return { session };
}
```

Use `useActiveOrg()` from `@pengana/org-client` inside the component to get the org (including metadata) reactively.

---

## Files to Modify

| File | Change |
|------|--------|
| `packages/env/src/server.ts` | Uncomment + add Polar env vars |
| `apps/server/.env` + `.env.example` | Add Polar env values |
| `packages/auth/src/lib/payments.ts` | Uncomment access token |
| `packages/auth/src/index.ts` | Enable polar plugin + webhook handlers + afterAcceptInvitation seat sync |
| `packages/api/src/routers/billing.ts` | New file: `removeOrgMember` procedure that syncs Polar seat count |
| `packages/api/src/routers/index.ts` | Add billing router to appRouter |
| `apps/web/src/routes/index.tsx` | Pass referenceId on checkout, read subscription status from org metadata |

---

## Verification

1. Boot server → no env validation errors
2. Sign up → Polar customer created in sandbox dashboard
3. Create org, complete checkout → Polar subscription with `referenceId=orgId` created
4. Webhook fires `subscription.active` → org metadata updated with status/id/seatCount
5. Invite + accept another member → `afterAcceptInvitation` fires → Polar subscription quantity bumped to 2
6. Remove member via new `billing.removeOrgMember` procedure → quantity decremented
7. Cancel subscription in Polar dashboard → webhook fires → org metadata updated → app shows "Free"

**Local webhooks**: Run `ngrok http 3000`, update Polar webhook URL, use Polar's "Replay" to re-send events during development.
