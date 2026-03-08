import { getTopProducts } from '../lib/services/analyticsService';

async function test() {
    try {
        const data = await getTopProducts(5);
        console.log("Top Products Data:", data);
    } catch (err) {
        console.error("EXCEPTION:", err);
    }
}

test();
