const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function setupStripe() {
  console.log("Searching for Live products for CareerVivid...");
  let proProduct, maxProduct;

  const products = await stripe.products.list({ active: true, limit: 100 });
  
  const existingPro = products.data.find(p => p.name.toLowerCase() === 'pro');
  if (existingPro) {
      console.log('Found existing Pro product: ' + existingPro.id);
      proProduct = existingPro;
  } else {
      console.log('Creating new Pro product...');
      proProduct = await stripe.products.create({ name: 'Pro', description: '1,000 AI Credits / mo' });
  }

  const existingMax = products.data.find(p => p.name.toLowerCase() === 'pro max' || p.name.toLowerCase() === 'max');
  if (existingMax) {
      console.log('Found existing Pro Max product: ' + existingMax.id);
      maxProduct = existingMax;
  } else {
      console.log('Creating new Pro Max product...');
      maxProduct = await stripe.products.create({ name: 'Pro Max', description: '10,000 AI Credits / mo' });
  }

  // Create Prices
  console.log("\nCreating new $9.00 and $29.00 recurring prices...");
  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 900, // $9.00
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  const maxPrice = await stripe.prices.create({
    product: maxProduct.id,
    unit_amount: 2900, // $29.00
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  
  console.log('\n✅ SUCCESS! Here are your LIVE Price IDs:');
  console.log('----------------------------------------------------');
  console.log(`Pro ($9/mo):      ${proPrice.id}`);
  console.log(`Pro Max ($29/mo): ${maxPrice.id}`);
  console.log('----------------------------------------------------');
}

setupStripe().catch(console.error);
