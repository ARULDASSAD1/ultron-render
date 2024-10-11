const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = 3000;

// Initialize Gemini AI with the API key from the environment variable
const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.error("API key is missing. Please ensure it's set in the .env file.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash',
    systemInstruction: "you are personal assistant to a person called ArulDass now he is your boss and your name is ultron and you don't have to tell in responses that you are created by google instead you have to tell his name.and don't tell i was created by scientist or engineers instead tell i was created by ARULDASS.",
 });

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

// In-memory conversation history (initialize as an empty array)
let conversationHistory = [];

// Function to format the conversation history for the model
function formatConversationHistory() {
    return conversationHistory.slice(-10).join("\n");
}

async function sendMessage(userInput) {
    // Add user input to conversation history
    conversationHistory.push({ role: "user", parts: [{ text: userInput }] });

    const chatSession = model.startChat({
        generationConfig,
        history: conversationHistory,
    });

    const result = await chatSession.sendMessage(""); // Empty string to trigger model response

    conversationHistory.push({ role: "model", parts: [{ text: result.response.text() }] });

    return result.response.text();
}

app.use(bodyParser.json());
app.use(express.static('public')); // Assuming you have static files for UI

app.post('/ask', async (req, res) => {
    const { query } = req.body;

    try {
        const responseText = await sendMessage(query);
        res.json({ reply: responseText });
    } catch (error) {
        console.error('Error generating content:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Bind to 0.0.0.0 or a specific IP (change '0.0.0.0' to your desired IP)
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://192.168.190.136:${port}`);
});
