# API Reference

Base URL: `/api`. All responses are JSON of the shape `{ success: boolean, data?, message?,
details? }`. Authenticated routes require `Authorization: Bearer <JWT>`.

## Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register a retailer or vendor (creates `User` + profile row) |
| POST | `/auth/login` | — | Returns `{ token, user }` |
| GET | `/auth/me` | any | Current user + role profile |

## Reference data

| Method | Path | Auth |
|---|---|---|
| GET | `/regions` | any |
| GET | `/categories` | any |

## Products & suppliers

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/products` | any | List products (optional `categoryId`) |
| GET | `/products/:id` | any | Product detail |
| GET | `/products/search?q=&categoryId=&requestedQty=` | any | Search with a quick supply snapshot per result; logs `SearchHistory` for retailers |
| GET | `/products/:id/suppliers?requestedQty=&maxDistance=&maxPrice=&deliveryOnly=` | retailer | Ranked suppliers with full match-score breakdown |

## Vendor inventory

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/inventory` | vendor | The vendor's own inventory |
| POST | `/inventory` | vendor | Create a product + inventory row |
| PUT | `/inventory/:id` | vendor (owner) | Update quantity/price/MOQ/freshness/expiry/delivery/active |
| DELETE | `/inventory/:id` | vendor (owner) | Soft-deactivate (does not delete the row) |
| POST | `/inventory/import` | vendor | Multipart CSV upload (`file` field) |
| GET | `/inventory/sync?since=<ISO timestamp>` | retailer | Polling feed of changes from connected vendors |

## Requirements (demand requests)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/requirements` | retailer | Raise a requirement for an unavailable product |
| GET | `/requirements` | retailer/vendor | Retailer: own requirements. Vendor: all pending requirements (platform-wide, to surface stocking opportunities) |
| GET | `/requirements/:id` | any | Detail |
| PUT | `/requirements/:id/respond` | vendor | `{ response: AVAILABLE | CAN_STOCK | NOT_AVAILABLE, notes? }` |
| GET | `/requirements/aggregate/:productId` | any | `{ retailersRequesting, totalRequestedQty, nearbyStock, demandScore, demandClassification }`. The score is the same Demand Intelligence Score used everywhere else |

Creating a requirement may also trigger a `DEMAND_ALERT` notification to vendors (see
docs/architecture.md).

## Orders

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/orders` | retailer | `{ inventoryId, quantity }`; validates MOQ and available stock |
| GET | `/orders` | retailer/vendor | Own orders |
| GET | `/orders/:id` | any (owner) | Detail + status history |
| PUT | `/orders/:id/status` | retailer/vendor | Retailer may only `CANCEL`; vendor drives the rest of the lifecycle |

Order status lifecycle: `PENDING → ACCEPTED → PROCESSING → READY → OUT_FOR_DELIVERY →
COMPLETED`, with `REJECTED`/`CANCELLED` as terminal branches. Enforced server-side in
`services/orderWorkflowService.js`.

## Demand intelligence

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/demand/top-products?limit=&regionId=` | any | Ranked by live-computed Demand Intelligence Score |
| GET | `/demand/product/:id?regionId=` | any | Full breakdown for one product |
| GET | `/demand/regional` | any | Top products per region |
| GET | `/recommendations` | vendor | Stocking recommendations for the vendor's region |

## Notifications

| Method | Path | Auth |
|---|---|---|
| GET | `/notifications` | any |
| GET | `/notifications/unread-count` | any |
| PUT | `/notifications/:id/read` | any (owner) |
| PUT | `/notifications/read-all` | any |

## Connections

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/connections` | retailer/vendor | Connected vendors (retailer) or retailers (vendor) |
| POST | `/connections` | retailer | `{ vendorId }` — explicit connect |

## Dashboards

| Method | Path | Auth |
|---|---|---|
| GET | `/dashboard/retailer` | retailer |
| GET | `/dashboard/vendor` | vendor |

## Admin

All routes below require `authorize('admin')`.

| Method | Path | Description |
|---|---|---|
| GET | `/admin/users?role=` | List users |
| PUT | `/admin/users/:id/status` | `{ isActive }` |
| GET | `/admin/vendors` | List vendors |
| PUT | `/admin/vendors/:id/verify` | `{ verified }` |
| GET | `/admin/vendors/:id/performance` | Order/fulfillment stats |
| GET | `/admin/vendors/:id/products` | Vendor's inventory |
| GET | `/admin/retailers` | List retailers |
| PUT | `/admin/retailers/:id/verify` | `{ verified }` |
| GET | `/admin/retailers/:id/activity` | Search/requirement/order counts |
| GET / POST | `/admin/categories` | List / create |
| GET | `/admin/products` | Full catalog |
| GET | `/admin/orders?status=` | All orders |
| GET | `/admin/requirements?status=` | All requirements |
| GET | `/admin/analytics/demand` | Most searched/requested/ordered/unavailable, supply gaps |
| GET | `/admin/audit-logs` | Audit trail |
| GET | `/admin/settings` | Read-only live scoring config (match weights, demand weights/cap/thresholds, sync and alert settings) |

## Error responses

Non-2xx responses are `{ success: false, message, details? }`. Common codes: `400` validation,
`401` missing/invalid token, `403` wrong role or not the resource owner, `404` not found, `409`
conflict (duplicate email, duplicate inventory listing), `500` unexpected (message is generic in
production).
