# Data Cleanup, Fresh Seed Data, and Invoice Filters

## Dummy Data Policy

- Keep dummy products, customers, orders, and requests out of production.
- Seed scripts should be development-only and clearly named.
- Do not run seed scripts from public API routes.
- Production data changes should happen only through migrations and admin UI workflows.

## Fresh Development Seed Set

Create a predictable development seed with:

- 8 active products across jackets, bags, wallets, accessories, shoes.
- 2 archived products for delete/archive testing.
- 6 customers across different countries.
- 12 orders:
  - 2 pending
  - 3 processing
  - 3 shipped
  - 3 delivered
  - 1 cancelled
- 5 custom requests:
  - new
  - quoted
  - in_progress
  - completed
  - archived
- 4 coupons:
  - active percentage
  - active fixed
  - expired
  - maxed-out usage

## Invoice Filters

Add invoice-ready filters to the Orders page:

- Date range
- Payment status: paid, unpaid, failed, refunded
- Fulfillment status
- Customer email/name
- Order number
- Minimum/maximum order total

Invoice export fields:

- `order_number`
- internal UUID
- customer name
- customer email
- created date
- status
- payment status
- subtotal
- shipping
- discount
- total
- item count

## Cleanup Checklist

- Remove stale screenshots and throwaway SQA files from production repository or move to a documented QA artifacts folder.
- Keep Postman collections versioned under repo root or `postman/`.
- Keep SQL migrations immutable after they have been run in shared environments.
- Prefer new migrations for schema changes.
