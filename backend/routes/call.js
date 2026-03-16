// call.js
const express = require("express");
const router = express.Router();
const voiceService = require("../services/voice");

// POST /call - initiates voice call
router.post("/", (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber)
    return res.status(400).json({ error: "Missing phone number" });
  voiceService.startVoiceCall(phoneNumber);
  res.json({ success: true, message: "Voice call initiated." });
});

module.exports = router;
