const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function runStorefrontSQA() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    try {
        const routes = [
            { path: '/', name: 'storefront_home_sqa' },
            { path: '/shop', name: 'storefront_shop_sqa' },
            { path: '/shipping', name: 'storefront_shipping_sqa' },
            { path: '/our-story', name: 'storefront_story_sqa' },
            { path: '/contact', name: 'storefront_contact_sqa' },
            { path: '/bespoke', name: 'storefront_bespoke_sqa' }
        ];

        for (const route of routes) {
            console.log(`Navigating to ${route.path}...`);
            await page.goto(`http://localhost:3000${route.path}`, { waitUntil: 'networkidle0' });
            await wait(2000); // allow fonts and animations
            await page.screenshot({ path: `${route.name}.png`, fullPage: true });
            console.log(`Captured ${route.name}.png`);
        }

    } catch (e) {
        console.error("SQA Error:", e);
    } finally {
        await browser.close();
        console.log("SQA Finished.");
    }
}

runStorefrontSQA();
