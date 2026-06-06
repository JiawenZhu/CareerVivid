const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const CATALOG_VERSION = '2026-06-06';

async function findOrCreatePrice(productId, priceConfig) {
  const existingPrices = await stripe.prices.list({ product: productId, limit: 100 });
  const existingPrice = existingPrices.data.find((price) =>
    price.active &&
    price.unit_amount === priceConfig.unit_amount &&
    price.currency === priceConfig.currency &&
    price.recurring?.interval === priceConfig.recurring.interval &&
    price.metadata?.catalog_version === CATALOG_VERSION &&
    price.metadata?.plan === priceConfig.metadata.plan
  );

  if (existingPrice) {
    console.log(`Reusing existing ${priceConfig.nickname}: ${existingPrice.id}`);
    return existingPrice;
  }

  return stripe.prices.create(priceConfig);
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

async function setupStripe() {
  console.log("Searching for Live products for CareerVivid...");
  let proProduct, maxProduct;

  const products = await stripe.products.list({ active: true, limit: 100 });
  
  const existingPro = products.data.find(p => p.name.toLowerCase() === 'pro');
  if (existingPro) {
      console.log('Found existing Pro product: ' + existingPro.id);
      proProduct = await stripe.products.update(existingPro.id, {
        description: '1,000 AI Credits / mo',
        metadata: { plan: 'pro', credits_per_cycle: '1000', catalog_version: CATALOG_VERSION },
      });
  } else {
      console.log('Creating new Pro product...');
      proProduct = await stripe.products.create({
        name: 'Pro',
        description: '1,000 AI Credits / mo',
        metadata: { plan: 'pro', credits_per_cycle: '1000', catalog_version: CATALOG_VERSION },
      });
  }

  const existingMax = products.data.find(p => p.name.toLowerCase() === 'pro max' || p.name.toLowerCase() === 'max');
  if (existingMax) {
      console.log('Found existing Pro Max product: ' + existingMax.id);
      maxProduct = await stripe.products.update(existingMax.id, {
        description: '4,500 AI Credits / mo',
        metadata: { plan: 'max', credits_per_cycle: '4500', catalog_version: CATALOG_VERSION },
      });
  } else {
      console.log('Creating new Pro Max product...');
      maxProduct = await stripe.products.create({
        name: 'Pro Max',
        description: '4,500 AI Credits / mo',
        metadata: { plan: 'max', credits_per_cycle: '4500', catalog_version: CATALOG_VERSION },
      });
  }

  // Create Prices
  console.log("\nCreating or reusing Pro and Max monthly/annual recurring prices...");
  const proPrice = await findOrCreatePrice(proProduct.id, {
    product: proProduct.id,
    unit_amount: 1200, // $12.00
    currency: 'usd',
    recurring: { interval: 'month' },
    nickname: 'Pro Monthly - 2026 Catalog',
    metadata: { plan: 'pro', interval: 'month', credits_per_cycle: '1000', catalog_version: CATALOG_VERSION },
  });

  const proAnnualPrice = await findOrCreatePrice(proProduct.id, {
    product: proProduct.id,
    unit_amount: 12000, // $120.00
    currency: 'usd',
    recurring: { interval: 'year' },
    nickname: 'Pro Annual - 2026 Catalog',
    metadata: { plan: 'pro', interval: 'year', credits_per_cycle: '1000', catalog_version: CATALOG_VERSION },
  });

  const maxPrice = await findOrCreatePrice(maxProduct.id, {
    product: maxProduct.id,
    unit_amount: 3500, // $35.00
    currency: 'usd',
    recurring: { interval: 'month' },
    nickname: 'Max Monthly - 2026 Catalog',
    metadata: { plan: 'max', interval: 'month', credits_per_cycle: '4500', catalog_version: CATALOG_VERSION },
  });

  const maxAnnualPrice = await findOrCreatePrice(maxProduct.id, {
    product: maxProduct.id,
    unit_amount: 37200, // $372.00
    currency: 'usd',
    recurring: { interval: 'year' },
    nickname: 'Max Annual - 2026 Catalog',
    metadata: { plan: 'max', interval: 'year', credits_per_cycle: '4500', catalog_version: CATALOG_VERSION },
  });

  await stripe.products.update(proProduct.id, { default_price: proPrice.id });
  await stripe.products.update(maxProduct.id, { default_price: maxPrice.id });
  await archiveOldRecurringPrices(proProduct.id, [proPrice.id, proAnnualPrice.id]);
  await archiveOldRecurringPrices(maxProduct.id, [maxPrice.id, maxAnnualPrice.id]);
  
  console.log('\n✅ SUCCESS! Here are your LIVE Price IDs:');
  console.log('----------------------------------------------------');
  console.log(`STRIPE_PRICE_PRO_MONTHLY=${proPrice.id}`);
  console.log(`STRIPE_PRICE_PRO_ANNUAL=${proAnnualPrice.id}`);
  console.log(`STRIPE_PRICE_MAX_MONTHLY=${maxPrice.id}`);
  console.log(`STRIPE_PRICE_MAX_ANNUAL=${maxAnnualPrice.id}`);
  console.log('----------------------------------------------------');
}

setupStripe().catch(console.error);
