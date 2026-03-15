const puppeteer = require('puppeteer');
const fs = require('fs');

async function runSQA3() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        console.log("Navigating to Admin Orders...");
        await page.goto('http://localhost:3000/admin/orders', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'admin_orders_new.png' });
        console.log("Admin Orders Screenshot captured.");

        console.log("Navigating to Admin Reviews...");
        await page.goto('http://localhost:3000/admin/reviews', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'admin_reviews_new.png' });

        console.log("Navigating to Storefront Shop...");
        await page.goto('http://localhost:3000/shop', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'storefront_shop_new.png', fullPage: true });

    } catch (e) {
        console.error("Error during SQA3:", e);
    } finally {
        await browser.close();
        console.log("SQA3 Script Finished.");
    }
}

runSQA3();
