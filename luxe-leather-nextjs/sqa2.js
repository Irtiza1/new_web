const puppeteer = require('puppeteer');
const fs = require('fs');

async function runSQA2() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        console.log("Navigating to Admin Categories...");
        await page.goto('http://localhost:3000/admin/categories', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'admin_categories.png' });

        console.log("Navigating to Admin Nav Items...");
        await page.goto('http://localhost:3000/admin/nav-items', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'admin_nav_items.png' });

        console.log("Navigating to Admin Reviews...");
        await page.goto('http://localhost:3000/admin/reviews', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'admin_reviews.png' });

        console.log("Navigating to Admin Shipping...");
        await page.goto('http://localhost:3000/admin/shipping', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'admin_shipping.png' });

        console.log("Navigating to Admin CMS...");
        await page.goto('http://localhost:3000/admin/cms', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'admin_cms.png' });

    } catch (e) {
        console.error("Error during SQA2:", e);
    } finally {
        await browser.close();
        console.log("SQA2 Script Finished.");
    }
}

runSQA2();
