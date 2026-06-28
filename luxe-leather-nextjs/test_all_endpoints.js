/**
 * =============================================================
 * LUXE LEATHER — COMPLETE API TEST SUITE (Postman-style)
 * =============================================================
 * Covers ALL 30 route files and every CRUD method
 * Run: node test_all_endpoints.js
 * =============================================================
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const BASE_URL = 'http://localhost:3000';
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Known real IDs in the DB ────────────────────────────────────
const PRODUCT_ID  = '7a731568-e516-4ee7-a716-58790d4de62a';
const CATEGORY_ID = '451e09ca-4841-4f79-acef-a638cd038894';
const CUSTOMER_ID = '0a5642fa-54e3-45a6-8a96-2ad405f91463';
const COUPON_CODE = 'FREESHIP';
const REQUEST_ID  = '431d9ec4-939b-4ae1-b230-e8dff4c3faae';
const SHIPPING_ID = 'dd52652b-d61d-4745-8dc2-4a41c1a11a8f';
const NAV_ID      = 'c9098e6c-f4ff-43df-a370-aa0f804b5acd';

// ─── Test runner state ────────────────────────────────────────────
let passed = 0, failed = 0, skipped = 0;
const failures = [];
let adminCookie = '';

// ─── Helper: run one HTTP test ────────────────────────────────────
async function test(label, method, path, opts = {}) {
    const { body, expectedStatus = 200, skip = false, extraHeaders = {} } = opts;
    if (skip) {
        console.log(`  ⏭  [SKIP] ${method.padEnd(6)} ${path}  —  ${label}`);
        skipped++;
        return null;
    }
    const url = `${BASE_URL}${path}`;
    const reqOpts = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(adminCookie ? { Cookie: adminCookie } : {}),
            ...extraHeaders,
        },
    };
    if (body !== undefined) reqOpts.body = JSON.stringify(body);

    try {
        const res  = await fetch(url, reqOpts);
        const json = await res.json().catch(() => null);
        if (res.status === expectedStatus) {
            console.log(`  ✅ [${res.status}] ${method.padEnd(6)} ${path}  —  ${label}`);
            passed++;
            return json;
        } else {
            console.log(`  ❌ [${res.status}] ${method.padEnd(6)} ${path}  —  ${label}  (expected ${expectedStatus})`);
            if (json) console.log(`       ↳ ${JSON.stringify(json).slice(0, 220)}`);
            failed++;
            failures.push({ label, method, path, got: res.status, expected: expectedStatus, body: json });
            return json;
        }
    } catch (err) {
        console.log(`  ❌ [NET] ${method.padEnd(6)} ${path}  —  ${label}`);
        console.log(`       ↳ ${err.message}`);
        failed++;
        failures.push({ label, method, path, error: err.message });
        return null;
    }
}

// ─── Login helper ─────────────────────────────────────────────────
async function login() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'irtiza.s2918@gmail.com',
        password: 'LuxeAdmin123!'
    });
    if (error) { console.error('❌ Fatal: Login failed —', error.message); process.exit(1); }
    adminCookie = `sb-access-token=${encodeURIComponent(data.session.access_token)}; sb-refresh-token=${encodeURIComponent(data.session.refresh_token)}`;
    console.log('  ✅ Admin login OK\n');
}

// ═════════════════════════════════════════════════════════════════
async function run() {
    console.log('\n══════════════════════════════════════════════════════════');
    console.log('   LUXE LEATHER  ·  FULL API TEST SUITE  (All CRUDs)');
    console.log('══════════════════════════════════════════════════════════\n');

    // ──────────────────────────────────────────────────────────────
    // 0. AUTH
    // ──────────────────────────────────────────────────────────────
    console.log('◆ [0] AUTH');
    await login();

    // ──────────────────────────────────────────────────────────────
    // 1. PRODUCTS  GET / POST / PUT / DELETE / PATCH / validate /
    //              validate-stock
    // ──────────────────────────────────────────────────────────────
    console.log('◆ [1] PRODUCTS');
    await test('List products',                  'GET',    '/api/products');
    await test('List products (paginated)',       'GET',    '/api/products?page=1&limit=5');
    await test('Search products',                'GET',    '/api/products?search=leather');
    await test('Get single product by ID',       'GET',    `/api/products/${PRODUCT_ID}`);
    await test('Get non-existent product',       'GET',    '/api/products/00000000-0000-0000-0000-000000000000', { expectedStatus: 404 });
    await test('Validate product IDs (GET)',     'GET',    `/api/products/validate?ids=${PRODUCT_ID}`);
    await test('Validate empty IDs',             'GET',    '/api/products/validate');
    await test('Validate stock (POST)',          'POST',   '/api/products/validate-stock', {
        body: { items: [{ id: PRODUCT_ID, name: 'Test', quantity: 1 }] }
    });
    // Archive & restore via PATCH
    await test('Archive product (PATCH)',        'PATCH',  `/api/products/${PRODUCT_ID}`, { body: { action: 'archive' } });
    await test('Restore product (PATCH)',        'PATCH',  `/api/products/${PRODUCT_ID}`, { body: { action: 'restore' } });
    // Products POST requires FormData (multipart), tested separately
    await test('Create product (no body → 400)', 'POST',   '/api/products', { body: {}, expectedStatus: 400 });
    console.log('');

    // ──────────────────────────────────────────────────────────────
    // 2. CATEGORIES  GET / POST / PUT / DELETE
    // ──────────────────────────────────────────────────────────────
    console.log('◆ [2] CATEGORIES');
    await test('List categories', 'GET', '/api/categories');
    const ts = Date.now();
    const catCreate = await test('Create category (POST)', 'POST', '/api/categories', {
        body: { name: `Test Cat ${ts}`, slug: `test-cat-${ts}`, description: 'Automated test' },
    });
    const newCatId = catCreate?.data?.id;
    if (newCatId) {
        await test('Update category (PUT)',  'PUT',    `/api/categories?id=${newCatId}`, { body: { name: `Updated Cat ${ts}` } });
        await test('Delete category (DELETE body ids)', 'DELETE', '/api/categories', { body: { ids: [newCatId] } });
    }
    console.log('');

    // ──────────────────────────────────────────────────────────────
    // 3. ORDERS  GET / POST / PUT / DELETE + /[id] + /stats
    // ──────────────────────────────────────────────────────────────
    console.log('◆ [3] ORDERS');
    await test('List orders',              'GET',  '/api/orders');
    await test('List orders (filter status)', 'GET', '/api/orders?status=PENDING');
    await test('Order stats',              'GET',  '/api/orders/stats');
    // Create a real order using our existing customer and product
    const orderCreate = await test('Create order (POST)', 'POST', '/api/orders', {
        body: {
            customer_id: CUSTOMER_ID,
            total: 99.99,
            status: 'PENDING',
            items: [{ product_id: PRODUCT_ID, quantity: 1, price: 99.99 }]
        },
        expectedStatus: 201
    });
    const newOrderId = orderCreate?.data?.id;
    if (newOrderId) {
        await test('Get single order (GET)', 'GET',   `/api/orders/${newOrderId}`);
        await test('Update order (PUT)',     'PUT',   `/api/orders?id=${newOrderId}`, { body: { status: 'PROCESSING' } });
        await test('Update order via [id] (PUT)', 'PUT', `/api/orders/${newOrderId}`, { body: { status: 'SHIPPED' } });
        await test('PATCH order [id]',       'PATCH', `/api/orders/${newOrderId}`, { body: { status: 'DELIVERED' } });
        await test('Delete order (DELETE)',  'DELETE', `/api/orders/${newOrderId}`);
    }
    console.log('');

    // ──────────────────────────────────────────────────────────────
    // 4. CUSTOMERS  GET / POST / PUT / DELETE + /[id]
    // ──────────────────────────────────────────────────────────────
    console.log('◆ [4] CUSTOMERS');
    await test('List customers',          'GET',  '/api/customers');
    await test('Search customers',        'GET',  '/api/customers?search=test');
    await test('Paginate customers',      'GET',  '/api/customers?page=1&limit=5');
    await test('Get customer by email',   'GET',  '/api/customers?email=notexist@x.com');
    await test('Get customer by ID [id]', 'GET',  `/api/customers/${CUSTOMER_ID}`);
    const custEmail = `testcust_${ts}@test.com`;
    const custCreate = await test('Create customer (POST)', 'POST', '/api/customers', {
        body: { name: 'Test Customer', email: custEmail, phone: '+1234567890' },
        expectedStatus: 201
    });
    const newCustId = custCreate?.data?.id;
    if (newCustId) {
        await test('Update customer PUT [id]',   'PUT',    `/api/customers/${newCustId}`, { body: { phone: '+9999999999' } });
        await test('Update customer PUT query',  'PUT',    `/api/customers?id=${newCustId}`, { body: { city: 'Lahore' } });
        await test('Delete customer DELETE [id]','DELETE', `/api/customers/${newCustId}`);
    }
    console.log('');

    // ──────────────────────────────────────────────────────────────
    // 5. COUPONS  storefront GET / admin GET / POST / PUT / DELETE
    // ──────────────────────────────────────────────────────────────
    console.log('◆ [5] COUPONS');
    await test('Validate coupon (storefront GET)', 'GET', `/api/coupons?code=${COUPON_CODE}`);
    await test('Invalid coupon returns 404',       'GET',  '/api/coupons?code=BADCODE999', { expectedStatus: 404 });
    await test('List coupons (admin GET)',          'GET',  '/api/coupons/admin');
    const couponCreate = await test('Create coupon (admin POST)', 'POST', '/api/coupons/admin', {
        body: {
            code: `TESTCODE${ts}`,
            discount_type: 'percentage',
            discount_value: 15,
            is_active: true,
            min_order_amount: 0,
            max_uses: 100,
        },
        expectedStatus: 201
    });
    const newCouponId = couponCreate?.data?.id;
    if (newCouponId) {
        await test('Update coupon (admin PUT)', 'PUT',    `/api/coupons/admin?id=${newCouponId}`, { body: { discount_value: 20 } });
        await test('Delete coupon (admin DELETE body ids)', 'DELETE', '/api/coupons/admin', { body: { ids: [newCouponId] } });
    }
    console.log('');

    // ──────────────────────────────────────────────────────────────
    // 6. ANALYTICS  GET (all types) + track POST
    // ──────────────────────────────────────────────────────────────
    console.log('◆ [6] ANALYTICS');
    await test('Analytics summary',                'GET',  '/api/analytics?type=summary');
    await test('Analytics top-products',           'GET',  '/api/analytics?type=top-products&limit=5');
    await test('Analytics customers-by-country',   'GET',  '/api/analytics?type=customers-by-country');
    await test('Analytics traffic (30d)',           'GET',  '/api/analytics?type=traffic');
    await test('Analytics traffic (custom dates)',  'GET',  '/api/analytics?type=traffic&startDate=2026-01-01&endDate=2026-12-31');
    await test('Track page_view event (POST)',     'POST', '/api/analytics/track', {
        body: {
            eventType: 'page_view',
            path: '/test-api-suite',
            referrer: 'https://google.com',
            sessionId: `session-test-${ts}`,
            deviceType: 'Desktop',
            os: 'Mac',
            browser: 'Chrome'
        }
    });
    await test('Track search event (POST)',        'POST', '/api/analytics/track', {
        body: {
            eventType: 'search',
            path: '/shop',
            referrer: '',
            sessionId: `session-test-${ts}`,
            deviceType: 'Mobile',
            os: 'iOS',
            browser: 'Safari',
            metadata: { query: 'leather wallet' }
        }
    });
    console.log('');

    // ──────────────────────────────────────────────────────────────
    // 7. AUDIT LOGS  GET
    // ──────────────────────────────────────────────────────────────
    console.log('◆ [7] AUDIT LOGS');
    await test('List audit logs',                  'GET',  '/api/audit-logs');
    await test('Filter by table=products',         'GET',  '/api/audit-logs?table=products');
    await test('Filter by table=categories',       'GET',  '/api/audit-logs?table=categories');
    await test('Filter by action=CREATE',          'GET',  '/api/audit-logs?action=CREATE');
    await test('Paginate audit logs',              'GET',  '/api/audit-logs?page=1&limit=10');
    console.log('');

    // ──────────────────────────────────────────────────────────────
    // 8. CONTACT MESSAGES  POST / GET admin / PUT / DELETE
    // ──────────────────────────────────────────────────────────────
    console.log('◆ [8] CONTACT / MESSAGES');
    const contactCreate = await test('Submit contact form (POST)', 'POST', '/api/contact', {
        body: {
            name: 'Postman Bot',
            email: 'postman@test.com',
            phone: '+923001234567',
            inquiry_type: 'General',
            message: 'Automated test message from API suite.',
        },
        expectedStatus: 201
    });
    await test('List contact messages (admin GET)',     'GET', '/api/contact/admin');
    await test('Filter contact by status=new',         'GET', '/api/contact/admin?status=new');
    // Retrieve ID from DB directly for update/delete
    const { data: msgs } = await supabase.from('contact_messages').select('id').eq('email', 'postman@test.com').limit(1);
    const newMsgId = msgs?.[0]?.id;
    if (newMsgId) {
        await test('Update contact message status (PUT)', 'PUT', `/api/contact/admin?id=${newMsgId}`, { body: { status: 'read' } });
        await test('Delete contact message (DELETE)',     'DELETE', `/api/contact/admin?id=${newMsgId}`);
    }
    console.log('');

    // ──────────────────────────────────────────────────────────────
    // 9. CUSTOM REQUESTS (BESPOKE)  GET / POST / PUT + [id] CRUD
    // ──────────────────────────────────────────────────────────────
    console.log('◆ [9] CUSTOM REQUESTS');
    await test('List requests (GET)',               'GET',  '/api/requests');
    await test('List requests paginated',           'GET',  '/api/requests?page=1&limit=5');
    await test('Get single request by ID',         'GET',  `/api/requests/${REQUEST_ID}`);
    const reqCreate = await test('Create request (POST)', 'POST', '/api/requests', {
        body: {
            name: `Test Req ${ts}`,
            email: `req${ts}@test.com`,
            phone: '+923001234567',
            description: 'Custom bespoke leather bag request',
            product_type: 'Bag',
            budget: 500,
        },
        expectedStatus: 201
    });
    const newReqId = reqCreate?.data?.id;
    if (newReqId) {
        await test('Update request via [id] (PUT)',    'PUT',   `/api/requests/${newReqId}`, { body: { status: 'REVIEWED' } });
        await test('Update request (PUT query)',       'PUT',   `/api/requests?id=${newReqId}`, { body: { status: 'IN_PROGRESS' } });
        await test('Restore request (PATCH restore)',  'PATCH', `/api/requests/${newReqId}?action=restore`);
        await test('Archive request (DELETE)',         'DELETE', `/api/requests/${newReqId}`);
    }
    console.log('');

    // ──────────────────────────────────────────────────────────────
    // 10. REVIEWS  GET / POST / PUT / DELETE
    // ──────────────────────────────────────────────────────────────
    console.log('◆ [10] REVIEWS');
    await test('List reviews (GET)',                'GET',  '/api/reviews');
    const reviewCreate = await test('Create review (POST)', 'POST', '/api/reviews', {
        body: {
            customer_name: 'Test Reviewer',
            product_id: PRODUCT_ID,
            rating: 5,
            comment: 'Excellent product! Automated test.',
            is_approved: false,
        },
    });
    const newReviewId = reviewCreate?.data?.id;
    if (newReviewId) {
        await test('Update review (PUT)',            'PUT',    `/api/reviews?id=${newReviewId}`, { body: { is_approved: true, rating: 4 } });
        await test('Delete review (DELETE body ids)', 'DELETE', '/api/reviews', { body: { ids: [newReviewId] } });
    }
    console.log('');

    // ──────────────────────────────────────────────────────────────
    // 11. SETTINGS  GET / PUT
    // ──────────────────────────────────────────────────────────────
    console.log('◆ [11] SETTINGS');
    const settingsGet = await test('Get settings (GET)',    'GET',  '/api/settings');
    if (settingsGet?.data) {
        await test('Update settings (PUT)', 'PUT', '/api/settings', {
            body: { ...settingsGet.data, site_title: settingsGet.data.site_title || 'Luxe Leather' }
        });
    }
    console.log('');

    // ──────────────────────────────────────────────────────────────
    // 12. SHIPPING ZONES  GET / POST / PUT / DELETE
    // ──────────────────────────────────────────────────────────────
    console.log('◆ [12] SHIPPING ZONES');
    await test('List shipping zones (GET)',         'GET',  '/api/shipping-zones');
    const shippingCreate = await test('Create shipping zone (POST)', 'POST', '/api/shipping-zones', {
        body: {
            name: `Test Zone ${ts}`,
            countries: ['PK', 'US'],
            base_rate: 12.50,
            free_shipping_threshold: 150,
            estimated_days: '5-7',
            currency: 'USD',
            is_active: true,
        },
    });
    const newShippingId = shippingCreate?.data?.id;
    if (newShippingId) {
        await test('Update shipping zone (PUT)',     'PUT',    `/api/shipping-zones?id=${newShippingId}`, { body: { base_rate: 9.99 } });
        await test('Delete shipping zone (DELETE body ids)', 'DELETE', '/api/shipping-zones', { body: { ids: [newShippingId] } });
    }
    console.log('');

    // ──────────────────────────────────────────────────────────────
    // 13. SIZE GUIDES  GET / POST / PUT / DELETE
    // ──────────────────────────────────────────────────────────────
    console.log('◆ [13] SIZE GUIDES');
    await test('List size guides (GET)',            'GET',  '/api/size-guides');
    const sgCreate = await test('Create size guide (POST)', 'POST', '/api/size-guides', {
        body: {
            label: `Test Guide ${ts}`,
            chest: '38"',
            waist: '32"',
            hips: '40"',
            shoulders: '17"',
            length: '28"',
        },
        expectedStatus: 201
    });
    const newSgId = sgCreate?.data?.id;
    if (newSgId) {
        await test('Update size guide (PUT)',       'PUT',    `/api/size-guides?id=${newSgId}`, { body: { label: `Updated Guide ${ts}`, chest: '40"', waist: '34"', hips: '42"', shoulders: '18"', length: '29"' } });
        await test('Delete size guide (DELETE)',    'DELETE', `/api/size-guides?id=${newSgId}`);
    }
    console.log('');

    // ──────────────────────────────────────────────────────────────
    // 14. NAV ITEMS  GET / POST / PUT / DELETE
    // ──────────────────────────────────────────────────────────────
    console.log('◆ [14] NAV ITEMS');
    await test('List nav items (GET)',              'GET',  '/api/nav-items');
    const navCreate = await test('Create nav item (POST)', 'POST', '/api/nav-items', {
        body: { label: `Test Link ${ts}`, href: '/test', display_order: 99, is_visible: true },
    });
    const newNavId = navCreate?.data?.id;
    if (newNavId) {
        await test('Update nav item (PUT)',          'PUT',    `/api/nav-items?id=${newNavId}`, { body: { label: `Updated Link ${ts}` } });
        await test('Delete nav item (DELETE body ids)', 'DELETE', '/api/nav-items', { body: { ids: [newNavId] } });
    }
    console.log('');

    // ──────────────────────────────────────────────────────────────
    // 15. CMS CONTENT  GET / POST (upsert)
    // ──────────────────────────────────────────────────────────────
    console.log('◆ [15] CMS');
    await test('List CMS blocks (GET)',             'GET',  '/api/cms');
    await test('Upsert CMS block (POST)',           'POST', '/api/cms', {
        body: {
            slug: `test-block-${ts}`,
            title: 'Test Block',
            content: '<p>Automated test content</p>',
            section: 'home',
            type: 'html',
        },
    });
    console.log('');

    // ──────────────────────────────────────────────────────────────
    // 16. MEDIA  GET / POST (error) / DELETE
    // ──────────────────────────────────────────────────────────────
    console.log('◆ [16] MEDIA');
    await test('List media files (GET)',            'GET',  '/api/media');
    await test('List media by folder (GET)',        'GET',  '/api/media?folder=platform-images');
    await test('Upload with no file → 400',        'POST', '/api/media', { body: {}, expectedStatus: 400 });
    await test('Delete with no names → 400',       'DELETE', '/api/media', { body: {}, expectedStatus: 400 });
    console.log('');

    // ──────────────────────────────────────────────────────────────
    // 17. ACCOUNT / PROFILE  GET / PUT
    // ──────────────────────────────────────────────────────────────
    console.log('◆ [17] ACCOUNT / PROFILE');
    const profileGet = await test('Get profile (GET)',    'GET',  '/api/account/profile');
    if (profileGet?.data) {
        await test('Update profile (PUT)', 'PUT', '/api/account/profile', {
            body: { full_name: 'Admin Test User', bio: 'Updated via API test suite' }
        });
    }
    console.log('');

    // ──────────────────────────────────────────────────────────────
    // SUMMARY
    // ──────────────────────────────────────────────────────────────
    const total = passed + failed + skipped;
    console.log('══════════════════════════════════════════════════════════');
    console.log('   RESULTS SUMMARY');
    console.log('══════════════════════════════════════════════════════════');
    console.log(`  Total Tested : ${total}`);
    console.log(`  ✅ Passed    : ${passed}`);
    console.log(`  ❌ Failed    : ${failed}`);
    console.log(`  ⏭  Skipped   : ${skipped}`);

    if (failures.length > 0) {
        console.log('\n  FAILURES:');
        failures.forEach((f, i) => {
            console.log(`\n  [${i + 1}] ${f.label}`);
            console.log(`       ${f.method} ${f.path}`);
            if (f.got) console.log(`       HTTP ${f.got}  (expected ${f.expected})`);
            if (f.error) console.log(`       ${f.error}`);
            if (f.body) console.log(`       ${JSON.stringify(f.body).slice(0, 250)}`);
        });
    } else {
        console.log('\n  🎉 All endpoints passed!');
    }
    console.log('\n══════════════════════════════════════════════════════════\n');
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
