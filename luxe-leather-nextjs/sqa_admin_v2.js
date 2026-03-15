const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const outDir = '/Users/muhammadirtiza/.gemini/antigravity/brain/b19f89dc-bae7-44ac-a868-64945a98118b';
const baseUrl = 'http://localhost:3000/admin';

const pages = [
    { name: 'dashboard', url: '' },
    { name: 'analytics', url: '/analytics' },
    { name: 'products', url: '/products' },
    { name: 'orders', url: '/orders' },
    { name: 'coupons', url: '/coupons' },
    { name: 'categories', url: '/categories' },
    { name: 'customers', url: '/customers' },
    { name: 'requests', url: '/requests' },
    { name: 'reviews', url: '/reviews' },
    { name: 'cms', url: '/cms' },
    { name: 'navigation', url: '/navigation' },
    { name: 'shipping', url: '/shipping' },
    { name: 'settings', url: '/settings' }
];

async function runSQA() {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    for (const p of pages) {
        const fullUrl = `${baseUrl}${p.url}`;
        console.log(`Navigating to ${fullUrl}...`);
        try {
            await page.goto(fullUrl, { waitUntil: 'networkidle0', timeout: 30000 });
            // wait a bit for any react rendering
            await new Promise(resolve => setTimeout(resolve, 2000));
            const screenshotPath = path.join(outDir, `admin_${p.name}_sqa2.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`Captured ${screenshotPath}`);
        } catch (e) {
            console.log(`Failed to capture ${p.name}: ${e.message}`);
        }
    }

    await browser.close();
    console.log('Admin SQA Finished.');
}

runSQA();
