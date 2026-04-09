const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function checkProducts() {
    const products = await stripe.products.list({ active: true, limit: 10 });
    console.log("=== Active Products ===");
    for (const p of products.data) {
        console.log(`- ${p.name} (ID: ${p.id})`);
        const prices = await stripe.prices.list({ product: p.id, active: true });
        for (const pr of prices.data) {
            console.log(`  -> Price: $${pr.unit_amount / 100} / ${pr.recurring?.interval} (ID: ${pr.id})`);
        }
    }
}
checkProducts();
