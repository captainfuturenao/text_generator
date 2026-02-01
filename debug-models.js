
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config({ path: '.env.local' });

async function checkModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Checking models with API Key ending in:", apiKey ? apiKey.slice(-4) : "NONE");

    const genAI = new GoogleGenerativeAI(apiKey);

    // List of candidate models
    const candidates = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro",
        "gemini-1.0-pro"
    ];

    for (const modelName of candidates) {
        console.log(`\n--- Testing ${modelName} ---`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            // Just try to catch init errors or gen errors
            const result = await model.generateContent("Test.");
            console.log(`SUCCESS: ${modelName} works! Response: ${result.response.text()}`);
        } catch (e) {
            console.log(`ERROR for ${modelName}:`);
            console.log(`Status: ${e.status || 'N/A'}`);
            console.log(`Message: ${e.message}`);

            if (e.message.includes("User location is not supported")) {
                console.log(">> DIAGNOSIS: Region Blocked (Needs Billing)");
            } else if (e.message.includes("404")) {
                console.log(">> DIAGNOSIS: Model Not Found");
            }
        }
    }
}

checkModels();
