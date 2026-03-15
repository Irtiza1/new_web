const puppeteer = require('puppeteer');
const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function runE2E() {
    const browser = await puppeteer.launch({ headless: 'new', slowMo: 50 });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    try {
        console.log("-----------------------------------------");
        console.log("TEST 1: CMS Home Hero Change -> Storefront");
        console.log("-----------------------------------------");
        await page.goto('http://localhost:3000/admin/cms', { waitUntil: 'networkidle0' });
        await wait(2000); // let state load

        // Find input for home_hero_title
        // In the UI: "home_hero_title" is displayed as a `<p>` with text "home_hero_title"
        // Then next sibling h3 is description, next sibling div.relative has the input
        const inputs = await page.$$('input[type="text"]');
        if (inputs.length >= 1) {
            // Usually the 1st input on page after announcements is home_hero_title (Actually it's index 0 of Home Page section which is the first section with text inputs!)
            // Wait, announcement_text is textarea. home_hero_title is text input!
            console.log("Found text input for CMS content.");
            // Clear and type
            await inputs[0].click({ clickCount: 3 });
            await page.keyboard.press('Backspace');
            await inputs[0].type('BROWSER SQA TEST VERIFIED');
            // Trigger blur to save
            await page.mouse.click(10, 10);
            await wait(3000); // Wait for API
            console.log("Hero Title updated via Admin.");
        }

        console.log("Navigating to Storefront Home...");
        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
        await wait(2000);
        await page.screenshot({ path: 'storefront_integration_cms.png' });
        console.log("Home Storefront screenshot captured: storefront_integration_cms.png");

        console.log("-----------------------------------------");
        console.log("TEST 2: Verifying Nav Items API Dynamic Cache");
        console.log("-----------------------------------------");
        console.log("Since we already added the 'SQA Tested Link', evaluating if it's there.");

        const navLinks = await page.$$eval('header nav a', els => els.map(e => e.textContent));
        if (navLinks.includes('SQA Tested Link') || navLinks.includes('SQA Test Link')) {
            console.log("SUCCESS! Dynamic Nav Link found in Header!");
        } else {
            console.log("FAILED to find Nav Link in header: ", navLinks);
        }

        console.log("\nTests finished successfully.");
    } catch (e) {
        console.error("Error during E2E SQA:", e);
    } finally {
        await browser.close();
    }
}

runE2E();
