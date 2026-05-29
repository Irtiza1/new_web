import { update } from './lib/services/settingsService';

async function main() {
    await update({ facebook_page_name: 'Luxe Leather Co.' });
    console.log('Settings updated successfully');
}

main().catch(console.error);
