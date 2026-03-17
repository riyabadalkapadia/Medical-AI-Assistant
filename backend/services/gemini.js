// gemini.js
// Google Gemini API integration
const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Use the latest available model from ListModels: models/gemini-2.5-pro
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT =
  "You are a medical clinic scheduling assistant. You cannot provide medical advice. If asked medical questions, respond that you cannot provide medical advice but can help schedule an appointment with a doctor. Keep responses plain text only, without markdown symbols like *. Never use placeholders such as [Next Tuesday's Date]; always use a real calendar date.";

function getUpcomingTuesdayDate() {
  const now = new Date();
  const day = now.getDay(); // Sunday=0 ... Tuesday=2
  let daysUntilTuesday = (2 - day + 7) % 7;

  // If today is Tuesday, keep today's date.
  if (day === 2) {
    daysUntilTuesday = 0;
  }

  const tuesday = new Date(now);
  tuesday.setDate(now.getDate() + daysUntilTuesday);

  return tuesday.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function cleanAIText(text) {
  const tuesdayDate = getUpcomingTuesdayDate();

  return String(text || "")
    // Remove markdown emphasis markers like **text** or *text*
    .replaceAll("*", "")
    // Replace Tuesday placeholders with real date
    .replaceAll(/\[\s*next\s+tuesday'?s\s+date\s*\]/gi, tuesdayDate)
    .replaceAll(/\[\s*tuesday\s+date\s*\]/gi, tuesdayDate)
    .replaceAll(/\s{2,}/g, " ")
    .trim();
}

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
      {
        timeout: 12000,
      },
    );
    // Gemini response format
    const aiMessage =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, something went wrong.";
    return cleanAIText(aiMessage);
  } catch (err) {
    console.error("Gemini API error:", err?.response?.data || err);
    return "I cannot access AI responses right now, but I can still book your appointment. Please say: book appointment.";
  }
}

module.exports = { sendToGemini };
