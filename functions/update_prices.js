const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'YOUR_STRIPE_SECRET_KEY_HERE');

async function updatePrices() {
  try {
    console.log("Fetching existing products...");
    const oldProPrice = await stripe.prices.retrieve('price_1SXF15EqIOIAAUV01eD0To1q');
    const oldMaxPrice = await stripe.prices.retrieve('price_1SXF1PEqIOIAAUV0p4gG4mH7');

    console.log("Creating new $9.00 Pro Price...");
    const newProPrice = await stripe.prices.create({
      unit_amount: 900, // $9.00
      currency: 'usd',
      recurring: { interval: 'month' },
      product: oldProPrice.product,
    });

    console.log("Creating new $29.00 Pro Max Price...");
    const newMaxPrice = await stripe.prices.create({
      unit_amount: 2900, // $29.00
      currency: 'usd',
      recurring: { interval: 'month' },
      product: oldMaxPrice.product,
    });

    console.log('\n✅ SUCCESS! Here are your new Price IDs:');
    console.log('----------------------------------------------------');
    console.log(`Pro ($9/mo):      ${newProPrice.id}`);
    console.log(`Pro Max ($29/mo): ${newMaxPrice.id}`);
    console.log('----------------------------------------------------');
    console.log('\nJust copy those IDs to me, and I will update your code!');
    
  } catch (error) {
    console.error("Error updating prices. Did you set YOUR_STRIPE_SECRET_KEY_HERE?");
    console.error(error.message);
  }
}

updatePrices();
