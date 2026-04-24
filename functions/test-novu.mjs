import { Novu } from '@novu/api';

const novu = new Novu({
  secretKey: 'a2dcd8d25123257f43964f4c268fbb83' // From your screenshot
});

async function testNovu() {
  console.log('Sending test event to Novu...');
  try {
    const result = await novu.trigger({
      workflowId: 'onboarding-demo-workflow',
      to: '69e909bfeb59b447fe065949', // The fallback subscriberId we used
      payload: {
        message: 'Hello from CareerVivid! This is a test notification.'
      }
    });
    console.log('Success! Check your sidebar bell icon.', result);
  } catch (error) {
    console.error('Error triggering Novu:', error);
  }
}

testNovu();
