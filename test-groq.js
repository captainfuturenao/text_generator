
const Groq = require("groq-sdk");
require("dotenv").config({ path: '.env.local' });

async function testGroq() {
    const apiKey = process.env.GROQ_API_KEY;
    console.log("Checking GROQ_API_KEY...");
    if (!apiKey) {
        console.error("  ❌ GROQ_API_KEY is NOT set in environment.");
        return;
    }
    console.log("  ✅ GROQ_API_KEY found:", apiKey.slice(0, 5) + "...");

    const groq = new Groq({ apiKey });
    try {
        console.log("Creating chat completion...");
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: "Hello, this is a test." }],
            model: "llama-3.3-70b-versatile",
        });
        console.log("  ✅ Success! Response:", completion.choices[0]?.message?.content);
    } catch (e) {
        console.error("  ❌ Groq API Error:", e.message);
    }
}

testGroq();
