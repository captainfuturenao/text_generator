import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { templates, generations } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { templateId, inputs } = req.body;

    if (!templateId || !inputs) {
        return res.status(400).json({ message: 'Missing templateId or inputs' });
    }

    try {
        // 1. Get Template
        const template = db.select().from(templates).where(eq(templates.id, templateId)).get();
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // 2. Prepare Prompt
        let prompt = template.promptBase;
        for (const [key, value] of Object.entries(inputs)) {
            prompt += `\n${key}: ${value}`;
        }

        let outputText = "";
        let usedProvider = ""; // For logging/debug if needed

        // 3. Try Groq first (Free, Fast)
        const groqKey = process.env.GROQ_API_KEY;
        // console.log("API Debug: GROQ_KEY present?", !!groqKey); // Debug log

        if (groqKey) {
            try {
                const groq = new Groq({ apiKey: groqKey });
                const completion = await groq.chat.completions.create({
                    messages: [{ role: "user", content: prompt }],
                    model: "llama-3.3-70b-versatile",
                });
                outputText = completion.choices[0]?.message?.content || "";
                usedProvider = "groq";
            } catch (e) {
                console.error("Groq Error:", e);
                // Continue to Gemini fallback
            }
        }

        // 4. Fallback to Gemini if Groq failed or key missing
        if (!outputText) {
            const apiKey = process.env.GEMINI_API_KEY;
            if (apiKey) {
                try {
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    outputText = response.text();
                    usedProvider = "gemini";
                } catch (e) {
                    console.error("Gemini Error:", e);
                    throw e; // Throw to trigger Mock fallback
                }
            } else {
                if (!groqKey) throw new Error("No API Keys configured");
            }
        }

        // 5. Save to History
        const newId = crypto.randomUUID();
        const newGeneration = {
            id: newId,
            templateId,
            inputJson: JSON.stringify(inputs),
            outputText,
            status: 'success',
            createdAt: new Date(),
        };

        db.insert(generations).values(newGeneration).run();

        return res.status(200).json({ output: outputText, historyId: newId });
    } catch (error: any) {
        console.error("Generation Error:", error);

        // Fallback for demo/dev purposes if API is blocked
        console.log("Switching to MOCK response due to API failure.");
        const mockOutput = `[MOCK GENERATION]\n\nこれはAI生成のシミュレーションです。\nAPI呼び出しに失敗したため、ダミーテキストを表示しています。\n(API Error: ${error.message})`;

        // Save Mock to History
        const newId = crypto.randomUUID();
        const newGeneration = {
            id: newId,
            templateId,
            inputJson: JSON.stringify(inputs),
            outputText: mockOutput,
            status: 'error_fallback',
            createdAt: new Date(),
        };

        db.insert(generations).values(newGeneration).run();

        return res.status(200).json({
            output: mockOutput,
            historyId: newId,
            details: "API fail, fell back to mock"
        });
    }
}
