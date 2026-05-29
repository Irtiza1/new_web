# Auth, RBAC, and Product Cleanup Plan

## 1. RBAC Foundation

Status: started.

- Add `user_roles` Supabase table keyed by `auth.users.id`.
- Support roles: `customer`, `support`, `manager`, `admin`, `super_admin`.
- Map roles to app permissions in `lib/auth/rbac.ts`.
- Add request auth helper in `lib/auth/server.ts`.
- Add `middleware.ts` to protect `/admin` and admin-grade API routes.
- Keep public storefront routes open only where needed.

Acceptance:

- Anonymous users cannot access `/admin`.
- Anonymous users cannot call admin/write APIs.
- API routes return `401` when unauthenticated and `403` when authenticated without permission.

## 2. User Login and Signup

Goal: build a customer/admin account flow similar to Daraz, Alibaba, and Amazon.

- Add `/login`, `/signup`, `/verify-email`, `/forgot-password`, and `/account` pages.
- Use Supabase Auth email/password sign up.
- Require email verification before account activation.
- Configure Supabase email templates for verification and password reset.
- Add resend verification link flow.
- Add customer profile creation after verified signup.
- Add admin role assignment workflow through `user_roles`.
- Add route redirects:
  - logged-out admin users go to `/login?redirectTo=/admin`
  - logged-in non-admin users see an unauthorized state
  - verified customers go to `/account`

Acceptance:

- Signup sends verification email.
- User cannot fully use account until email is verified.
- Admin access depends on `user_roles`, not client state.
- Login persists session securely through Supabase auth cookies.

## 3. Admin Order Page

- Replace direct full-detail rendering with a summary table plus detail drawer/page.
- Add sensible order identifiers:
  - preserve UUID internally
  - display short human ID such as `LLC-2026-000123`
  - add searchable `order_number` column
- Add search by order number, customer email, customer name, payment intent, and status.
- Add filters for payment status, fulfillment status, date range, and deleted/cancelled orders.
- Add invoice filter and invoice-ready export view.
- Add fresh seed data for realistic order states.

Acceptance:

- Admin list is scannable.
- Full order data opens intentionally.
- Order ID is human-readable and searchable.

## 4. Product Page

- Ensure admin delete/archive/restore flows are visible and consistent.
- Use hard delete only when there is no order history.
- Use archive when the product has orders.
- Show confirmation copy that explains the result.
- Add bulk archive/delete with permissions.

Acceptance:

- Admin can remove products safely.
- Storefront never shows archived products.
- Order history remains intact.

## 5. Dashboard, Analytics, Storefront UI

- Improve dashboard:
  - better KPI hierarchy
  - recent orders/requests
  - inventory alerts
  - revenue and conversion cards
- Improve analytics:
  - date range controls
  - top products
  - revenue trend
  - customer geography
  - export controls
- Improve store page:
  - category/filter/sort UX
  - product card polish
  - empty/loading/error states
- Improve contact page:
  - clearer inquiry type UX
  - stronger form validation
  - success state
- Improve storefront:
  - consistent brand colors
  - stronger image handling
  - mobile polish

Acceptance:

- Admin pages are dense but readable.
- Storefront pages are polished and responsive.
- No text overlap at mobile or desktop sizes.

## 6. End-to-End Testing With Postman

- Create Postman collection for:
  - signup
  - login
  - verified user flow
  - product read
  - admin product create/update/delete
  - cart validation
  - checkout/payment intent
  - Stripe webhook simulation
  - order admin workflow
  - contact/request submission
- Add environment variables:
  - `base_url`
  - `anon_token`
  - `admin_access_token`
  - `customer_access_token`
  - seeded IDs
- Add pre-request scripts for auth token setup.
- Add tests for expected `401`, `403`, and success responses.

Acceptance:

- One Postman run verifies customer, storefront, checkout, and admin flows.
- Unauthorized access tests are included.

## 7. Logo Upload Issue

- Reproduce upload from Settings and Media Library.
- Make both flows use the same media API response contract.
- Validate file type and size.
- Store logo URL in `site_settings.logo_url`.
- Revalidate layout metadata after upload.
- Show upload progress/error states.

Acceptance:

- Logo uploads from Settings.
- Uploaded logo appears in Media Library.
- Site header/favicon metadata can use the uploaded logo.

## 8. Image Optimization

- Convert uploaded images to WebP before storage.
- Store original metadata and optimized URL.
- Use WebP for products, homepage, logo where appropriate.
- Add image dimension and file size validation.
- Use Next image optimization or explicit responsive image handling.

Acceptance:

- New uploads are stored/rendered as WebP.
- Product and storefront images load faster.
- Existing image URLs still work during migration.

## 9. Request Page

- Center request modal in viewport.
- Improve details layout for custom requests.
- Add status progression controls.
- Add filters for new, quoted, in progress, completed, archived.
- Add better empty/loading/error states.

Acceptance:

- Modal opens centered on desktop and mobile.
- Request workflow is clear and fast for admins.

## 10. Data Cleanup

- Remove dummy seeded data from production.
- Create fresh realistic seed scripts for development only.
- Add invoice-ready sample orders.
- Add database reset/seed instructions.
- Keep production migrations separate from dev seed data.

Acceptance:

- Production is clean.
- Development can be reseeded predictably.
- Invoice filters can be tested with fresh data.
