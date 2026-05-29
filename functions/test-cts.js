const { JobServiceClient } = require('@google-cloud/talent');
async function run() {
  const client = new JobServiceClient();
  try {
    await client.searchJobs({ parent: "projects/jastalk-firebase/tenants/careervivid-default-tenant", jobQuery: { query: "test" } });
    console.log("Success");
  } catch (err) {
    console.error("Error:", err.message);
  }
}
run();
