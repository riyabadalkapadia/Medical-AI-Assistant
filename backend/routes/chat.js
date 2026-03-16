// chat.js
const express = require("express");
const router = express.Router();
const gemini = require("../services/gemini");

// POST /chat - handles conversation with Gemini API
router.post("/", async (req, res) => {
  const { messages } = req.body; // [{role, content}]
  if (!messages) return res.status(400).json({ error: "Missing messages" });
  const aiResponse = await gemini.sendToGemini(messages);
  res.json({ message: aiResponse });
});

module.exports = router;
