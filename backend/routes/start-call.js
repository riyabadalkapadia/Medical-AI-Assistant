const express = require("express");
const router = express.Router();
const vapi = require("../services/vapi");

// POST /start-call
router.post("/", async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ error: "Missing phone number" });
  }
  try {
    const apiResponse = await vapi.startVapiCall(phoneNumber);
    res.json(apiResponse);
  } catch (err) {
    res
      .status(500)
      .json({
        error: "Failed to start call",
        details: err?.response?.data || err.message,
      });
  }
});

module.exports = router;
