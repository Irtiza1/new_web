const puppeteer = require('puppeteer');
const fs = require('fs');

async function runSQA5() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        console.log("Navigating to Admin Dashboard...");
        await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'admin_dashboard_fixed.png' });

    } catch (e) {
        console.error("Error during SQA5:", e);
    } finally {
        await browser.close();
        console.log("SQA5 Script Finished.");
    }
}

runSQA5();
