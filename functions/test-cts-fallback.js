const { JobServiceClient } = require('@google-cloud/talent');
async function run() {
  const client = new JobServiceClient({ fallback: true });
  try {
    await client.searchJobs({ parent: "projects/jastalk-firebase/tenants/careervivid-default-tenant", jobQuery: { query: "test" } });
    console.log("Success");
  } catch (err) {
    console.error("Error code:", err.code, "Message:", err.message);
  }
}
run();
