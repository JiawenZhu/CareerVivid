import { Novu } from '@novu/api';

const novu = new Novu({ secretKey: 'a2dcd8d25123257f43964f4c268fbb83' });

async function createWorkflows() {
    try {
        console.log("Fetching workflow groups...");
        const groups = await novu.workflowGroups.list();
        const groupId = groups.data.data[0]._id; // Need a group ID to create a workflow

        console.log("Creating Usage Limit Warning workflow...");
        const response1 = await novu.workflows.create({
            name: "Usage Limit Warning",
            workflowGroupId: groupId,
            steps: [
                {
                    name: "in-app-message",
                    template: {
                        type: "in_app",
                        content: "⚠️ You have used 80% of your AI credits ({{creditsRemaining}} remaining). Upgrade to Pro to avoid interruptions."
                    }
                }
            ]
        });
        console.log("Success:", response1);

        console.log("Creating Usage Limit Exceeded workflow...");
        const response2 = await fetch('https://api.novu.co/v1/workflows', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'ApiKey a2dcd8d25123257f43964f4c268fbb83'
            },
            body: JSON.stringify({
                name: "Usage Limit Exceeded",
                identifier: "usage-limit-exceeded",
                description: "Triggered when a user exhausts 100% of their AI credits",
                steps: [
                    {
                        template: {
                            type: "in-app",
                            content: "🛑 You have reached your AI credit limit! Upgrade your plan to continue using the CareerVivid Agent."
                        }
                    }
                ],
                active: true,
                preferenceSettings: {
                  email: true,
                  in_app: true
                }
            })
        });
        
        const data2 = await response2.json();
        console.log("Usage Limit Exceeded:", data2.data ? "Success" : data2);

        console.log("Creating Onboarding Welcome workflow...");
        const response3 = await fetch('https://api.novu.co/v1/workflows', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'ApiKey a2dcd8d25123257f43964f4c268fbb83'
            },
            body: JSON.stringify({
                name: "Onboarding Welcome",
                identifier: "onboarding-welcome",
                description: "Sent immediately after user registration",
                steps: [
                    {
                        template: {
                            type: "in-app",
                            content: "🚀 Welcome to CareerVivid, {{firstName}}! Start by uploading your resume or checking out the community feed."
                        }
                    }
                ],
                active: true,
                preferenceSettings: {
                  email: true,
                  in_app: true
                }
            })
        });
        
        const data3 = await response3.json();
        console.log("Onboarding Welcome:", data3.data ? "Success" : data3);

    } catch (e) {
        console.error("Error:", e);
    }
}

createWorkflows();
