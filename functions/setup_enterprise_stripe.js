const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function setupEnterprise() {
  console.log("Searching for Live Enterprise product for CareerVivid...");
  let enterpriseProduct;

  const products = await stripe.products.list({ active: true, limit: 100 });
  
  const existingEnterprise = products.data.find(p => p.name.toLowerCase() === 'enterprise');
  if (existingEnterprise) {
      console.log('Found existing Enterprise product: ' + existingEnterprise.id);
      enterpriseProduct = await stripe.products.update(existingEnterprise.id, {
        description: '1,500 pooled AI Credits / seat / mo',
        metadata: { plan: 'enterprise', credits_per_seat: '1500', catalog_version: '2026-06-06' },
      });
  } else {
      console.log('Creating new Enterprise product...');
      enterpriseProduct = await stripe.products.create({
        name: 'Enterprise',
        description: '1,500 pooled AI Credits / seat / mo',
        metadata: { plan: 'enterprise', credits_per_seat: '1500', catalog_version: '2026-06-06' },
      });
  }

  console.log("\nCreating new $12.00 per seat recurring price...");
  const entPrice = await stripe.prices.create({
    product: enterpriseProduct.id,
    unit_amount: 1200, // $12.00
    currency: 'usd',
    recurring: { interval: 'month' },
    nickname: 'Enterprise Seat Monthly - 2026 Catalog',
    metadata: { plan: 'enterprise', interval: 'month', credits_per_seat: '1500', catalog_version: '2026-06-06' },
  });

  console.log('\n✅ SUCCESS! Here is your LIVE Enterprise Price ID:');
  console.log('----------------------------------------------------');
  console.log(`STRIPE_PRICE_ENTERPRISE_MONTHLY=${entPrice.id}`);
  console.log('----------------------------------------------------');
  console.log('\nCopy this ID to me, and I will update your codebase!');
}

setupEnterprise().catch(console.error);
