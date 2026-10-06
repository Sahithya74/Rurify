# Architecture

## Overview

Rurify is a conventional three-tier web app: a React SPA, a stateless Express REST API, and a
relational database accessed through Sequelize. The interesting parts are the two scoring
engines (supplier matching and demand intelligence) and the inventory-sync mechanism, all of
which are deliberately simple, transparent, and computed from real data rather than hard-coded
or dressed up as AI.

## Data model

Core entities and relationships (see `server/models/` for the Sequelize definitions and
`database/schema.sql` for the MySQL DDL mirror):

- **User** (`retailer` / `vendor` / `admin`) — 1:1 with **Retailer** or **Vendor**
- **Region** — groups retailers and vendors geographically (used for regional demand)
- **Category** → **Product** (name + variety + unit; vendor-creatable)
- **Inventory** — one row per (product, vendor): quantity, price, MOQ, freshness, delivery,
  active flag. Unique on `(productId, vendorId)`.
- **InventoryUpdateLog** — a diff per changed field, written on every inventory create/update;
  this is what the retailer-side polling feed reads.
- **RetailerVendorConnection** — created automatically the first time a retailer orders from a
  vendor (or explicitly via `POST /api/connections`).
- **SearchHistory**, **DemandRequest** (+ **VendorResponse**) — the raw signals the demand
  engine reads. A `DemandRequest` is a retailer's explicit "I need N of this" ask; it is
  distinct from a search, which is just a lookup.
- **Order** (+ **OrderStatusHistory**) — full status lifecycle.
- **Notification** — in-app notifications (stock/price updates, new orders, requirement
  responses, status changes).
- **StockingRecommendation** — the model exists for future caching of computed recommendations,
  but the MVP computes recommendations live on every request rather than persisting them, to
  guarantee they can never drift from the real data.
- **AuditLog** — written on every sensitive action (auth, inventory writes, order status
  changes, requirement responses, admin verification actions).

A few tables from the original "suggested 25+ tables" list were deliberately merged rather than
kept separate, per the project's own "avoid unnecessary duplication / don't over-engineer the
MVP" guidance: address fields live inline on `Retailer`/`Vendor` instead of a separate
`addresses` table, and delivery availability is a boolean field on `Inventory` instead of a
separate `delivery_options` table.

## Supplier matching (`server/services/matchingService.js`)

For a given product and a retailer's location, every active inventory row is scored 0–100 on
seven sub-scores, each normalized independently, then combined with fixed weights:

| Sub-score | Weight | How it's computed |
|---|---|---|
| Distance | 0.25 | `clamp(100 - distanceKm * 2)` (haversine distance) |
| Price | 0.20 | `clamp(100 * cheapestPrice / thisPrice)` |
| Availability | 0.15 | 100 if stock ≥ requested qty, else proportional |
| MOQ fit | 0.10 | 100 if requested qty ≥ MOQ, else proportional |
| Freshness | 0.10 | FRESH=100, GOOD=75, AVERAGE=50 |
| Delivery | 0.10 | 100 if delivery available, else 50 |
| Vendor reliability | 0.10 | the vendor's seeded/maintained reliability score |

The weighted sum is the `matchScore`. Both the score and its full breakdown are returned by
`GET /api/products/:id/suppliers`, so the UI can show *why* one supplier outranks another.

## Demand Intelligence Score (`server/services/demandService.js`)

Explicitly rule-based, explicitly **not** machine learning — labeled "Demand Intelligence
Score" everywhere in the UI and API, never "AI".

```
activity = 1×searches + 3×requirementRequests + 2×orderAttempts + 2×completedOrders
gapBonus = 20 if (searches>0 or requests>0) and nearbyStock==0
         = 10 if nearbyStock>0 and totalRequestedQty>nearbyStock
         = 0 otherwise
raw      = activity / regionShare + gapBonus
score    = round(min(100, raw / 150 * 100))
```

Classification: 0–30 `LOW` · 31–60 `MEDIUM` · 61–80 `HIGH` · 81–100 `VERY_HIGH`.

**Regional scoring.** `regionShare` is 1 for the platform-wide score. When scoring one region
(vendor recommendations, the regional map), it is that region's share of all retailers. A
region with 4 of 20 retailers has its activity divided by 0.2. Without this, a small region
could never score above LOW however intense its demand was, because the 0–100 scale is
calibrated for platform-wide totals. Ties at the 100 cap are broken by the uncapped raw score.

All inputs are plain counts/sums read live from `SearchHistory`, `DemandRequest`, `Order`,
and `Inventory`, with nothing cached or hand-tuned per product. They are fetched for the
whole catalog in five `GROUP BY` queries (`computeDemandForProducts`), not per product, so
cost doesn't grow with the catalog. The weights and cap are the only "magic numbers"; they're
defined once and shown read-only on the admin Settings page.

**Stocking recommendations** (`recommendationService.js`) are then derived purely from a
product's demand score + its current nearby active stock:

- `HIGH_PRIORITY`: demand is HIGH/VERY_HIGH and nearby stock is zero
- `CONSIDER_INCREASING`: demand is HIGH/VERY_HIGH (or MEDIUM) and stock is below requested qty
- otherwise no recommendation is returned at all

The `reason` string is generated from the actual numbers (search count, requirement count,
requested quantity, nearby stock) — never a static template with no data behind it.

**Demand alerts** (`demandAlertService.js`). Each new requirement re-scores its product. If
demand is HIGH/VERY_HIGH and nearby stock is below the total requested quantity, every
vendor gets an in-app `DEMAND_ALERT` naming the retailer count, requested quantity, current
supply, and score. To avoid spam, it fires at most once per product per 24 hours. Email, SMS,
and WhatsApp delivery would hang off `notificationService.notifyMany`; only in-app delivery
exists today.

## Automatic inventory synchronization

This is a polling-based MVP implementation of Section 5 of the spec, chosen because it needs no
extra infrastructure and is trivial to reason about and test:

1. Every vendor inventory create/update goes through `inventorySyncService.logInventoryChange`,
   which diffs the changed fields, writes an `InventoryUpdateLog` row per field, and sends an
   in-app `Notification` to every retailer connected to that vendor.
2. The retailer's dashboard (`usePolling` hook, `client/src/hooks/usePolling.js`) calls
   `GET /api/inventory/sync?since=<timestamp>` every ~10 seconds and surfaces new log entries
   as toasts, without a manual refresh.

**Why this will survive a move to real-time:** no controller or UI component calls
`logInventoryChange` and then separately "pushes" anything — the notification and the log row
are the only side effects. Swapping the polling loop for a Socket.IO emit on the same two writes
(and removing `usePolling` in favor of a socket listener) would require no changes to
`matchingService`, `demandService`, or any controller.

## CSV import (Level 2 of the inventory integration spec)

`csvImportService.js` parses with `csv-parse`, validates required columns
(`productName, category, unit, quantity, price, moq`) up front, then validates each row
individually (numeric fields, valid freshness enum, in-file duplicate detection by
name+variety), upserting one `Inventory` row per valid line and collecting a per-row error list.
The response is a summary (`{ totalRows, success, failed }`) plus the full error list — nothing
is silently dropped.

Level 3 (vendor ERP/API integration) is intentionally **not** implemented — the `Inventory`
model and `inventorySyncService` are the seam a future ERP webhook/pull job would write through,
reusing the exact same change-logging and notification path as the manual and CSV paths.

## Security

- Passwords: bcrypt (10 rounds), never stored or logged in plaintext.
- Auth: JWT (`server/utils/jwt.js`), role embedded in the payload, verified + re-fetched from
  the DB on every request (`middleware/auth.js`) so a deactivated account is rejected
  immediately even with a still-valid token.
- Authorization: `authorize(...roles)` middleware on every route that needs it; controllers
  additionally check row ownership (e.g. a vendor can only update inventory rows whose
  `vendorId` matches their own vendor profile).
- Input validation: `express-validator` schemas in `server/validators/` on every mutating route.
- Rate limiting: stricter limits on `/api/auth/*`, a general limiter on the rest of `/api`.
- File upload: CSV-only mimetype/extension check, 2MB cap, in-memory (never written to disk
  unvalidated).
- Error handling: the centralized error handler (`middleware/errorHandler.js`) hides stack
  traces and internal messages in production, always returning a safe, user-facing message.
- Audit logging: every sensitive write (auth events, inventory changes, order status
  transitions, requirement responses, admin verification/activation actions) is recorded in
  `audit_logs`.
