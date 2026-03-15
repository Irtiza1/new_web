const puppeteer = require('puppeteer');
const fs = require('fs');

async function runSQA4() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        console.log("Navigating to Admin Navigation...");
        await page.goto('http://localhost:3000/admin/navigation', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'admin_navigation.png' });

        console.log("Navigating to Admin Customers...");
        await page.goto('http://localhost:3000/admin/customers', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'admin_customers.png' });

        console.log("Navigating to Admin Shipping...");
        await page.goto('http://localhost:3000/admin/shipping', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'admin_shipping.png' });

    } catch (e) {
        console.error("Error during SQA4:", e);
    } finally {
        await browser.close();
        console.log("SQA4 Script Finished.");
    }
}

runSQA4();
