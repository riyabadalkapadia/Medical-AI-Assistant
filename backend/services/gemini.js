// gemini.js
// Google Gemini API integration
const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Use the latest available model from ListModels: models/gemini-2.5-pro
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT =
  "You are a medical clinic scheduling assistant. You cannot provide medical advice. If asked medical questions, respond that you cannot provide medical advice but can help schedule an appointment with a doctor.";

async function sendToGemini(messages) {
  // Gemini API expects 'user' and 'model' roles only, and system prompt as first user message
  // Compose the conversation with system prompt as first user message
  const geminiMessages = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  ];

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: geminiMessages,
      },
    );
    // Gemini response format
    const aiMessage =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, something went wrong.";
    return aiMessage;
  } catch (err) {
    console.error("Gemini API error:", err?.response?.data || err);
    return "I cannot access AI responses right now, but I can still book your appointment. Please say: book appointment.";
  }
}

module.exports = { sendToGemini };
