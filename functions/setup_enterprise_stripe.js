const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const CATALOG_VERSION = '2026-06-06';

async function findOrCreateEnterprisePrice(productId) {
  const existingPrices = await stripe.prices.list({ product: productId, limit: 100 });
  const existingPrice = existingPrices.data.find((price) =>
    price.active &&
    price.unit_amount === 1200 &&
    price.currency === 'usd' &&
    price.recurring?.interval === 'month' &&
    price.metadata?.catalog_version === CATALOG_VERSION &&
    price.metadata?.plan === 'enterprise' &&
    price.metadata?.minimum_seats === '2'
  );

  if (existingPrice) {
    console.log(`Reusing existing Enterprise Seat Monthly - 2026 Catalog: ${existingPrice.id}`);
    return existingPrice;
  }

  return stripe.prices.create({
    product: productId,
    unit_amount: 1200, // $12.00
    currency: 'usd',
    recurring: { interval: 'month' },
    nickname: 'Enterprise Seat Monthly - 2026 Catalog',
    metadata: { plan: 'enterprise', interval: 'month', credits_per_seat: '1500', minimum_seats: '2', catalog_version: CATALOG_VERSION },
  });
}

async function archiveOldRecurringPrices(productId, keepPriceIds) {
  const existingPrices = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  for (const price of existingPrices.data) {
    if (price.type === 'recurring' && !keepPriceIds.includes(price.id)) {
      console.log(`Archiving old recurring price ${price.id}`);
      await stripe.prices.update(price.id, { active: false });
    }
  }
}

async function setupEnterprise() {
  console.log("Searching for Live Enterprise product for CareerVivid...");
  let enterpriseProduct;

  const products = await stripe.products.list({ active: true, limit: 100 });
  
  const existingEnterprise = products.data.find(p => p.name.toLowerCase() === 'enterprise');
  if (existingEnterprise) {
      console.log('Found existing Enterprise product: ' + existingEnterprise.id);
      enterpriseProduct = await stripe.products.update(existingEnterprise.id, {
        description: '1,500 pooled AI Credits / seat / mo, 2-seat minimum',
        metadata: { plan: 'enterprise', credits_per_seat: '1500', minimum_seats: '2', catalog_version: CATALOG_VERSION },
      });
  } else {
      console.log('Creating new Enterprise product...');
      enterpriseProduct = await stripe.products.create({
        name: 'Enterprise',
        description: '1,500 pooled AI Credits / seat / mo, 2-seat minimum',
        metadata: { plan: 'enterprise', credits_per_seat: '1500', minimum_seats: '2', catalog_version: CATALOG_VERSION },
      });
  }

  console.log("\nCreating or reusing $12.00 per seat recurring price...");
  const entPrice = await findOrCreateEnterprisePrice(enterpriseProduct.id);
  await stripe.products.update(enterpriseProduct.id, { default_price: entPrice.id });
  await archiveOldRecurringPrices(enterpriseProduct.id, [entPrice.id]);

  console.log('\n✅ SUCCESS! Here is your LIVE Enterprise Price ID:');
  console.log('----------------------------------------------------');
  console.log(`STRIPE_PRICE_ENTERPRISE_MONTHLY=${entPrice.id}`);
  console.log('----------------------------------------------------');
  console.log('\nCopy this ID to me, and I will update your codebase!');
}

setupEnterprise().catch(console.error);
