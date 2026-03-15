const puppeteer = require('puppeteer');
const fs = require('fs');

async function runSQA() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        console.log("Navigating to Admin Panel...");
        await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'admin_dashboard.png' });
        console.log("Admin Dashboard Screenshot captured.");

        console.log("Navigating to Admin Products...");
        await page.goto('http://localhost:3000/admin/products', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'admin_products.png' });
        console.log("Admin Products Screenshot captured.");

        console.log("Navigating to Admin Customers...");
        await page.goto('http://localhost:3000/admin/customers', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'admin_customers.png' });
        console.log("Admin Customers Screenshot captured.");

        console.log("Navigating to Admin Orders...");
        await page.goto('http://localhost:3000/admin/orders', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'admin_orders.png' });
        console.log("Admin Orders Screenshot captured.");

        console.log("Navigating to Storefront Shop...");
        await page.goto('http://localhost:3000/shop', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'storefront_shop.png', fullPage: true });
        console.log("Storefront Shop Screenshot captured.");

    } catch (e) {
        console.error("Error during SQA:", e);
    } finally {
        await browser.close();
        console.log("SQA Script Finished.");
    }
}

runSQA();
