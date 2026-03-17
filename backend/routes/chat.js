// chat.js
const express = require("express");
const router = express.Router();
const gemini = require("../services/gemini");
const appointmentFlow = require("../services/appointmentFlow");
const refillFlow = require("../services/refillFlow");
const supportFlow = require("../services/supportFlow");
const emailService = require("../services/email");
const smsService = require("../services/sms");

async function sendFlowReply(res, reply) {
  if (!reply) return false;

  if (typeof reply === "string") {
    res.json({ message: reply });
    return true;
  }

  let emailSendFailed = false;

  if (reply.sendEmail) {
    try {
      await emailService.sendAppointmentEmail(reply.sendEmail.patientEmail, reply.sendEmail.details);
    } catch (error) {
      emailSendFailed = true;
      console.error("Email send failed:", error.message);
    }
  }

  if (reply.sendSms) {
    try {
      await smsService.sendAppointmentSms(
        reply.sendSms.phone,
        "Your appointment is confirmed. Kyron Medical will send updates here.",
      );
    } catch (error) {
      console.error("SMS send failed:", error.message);
    }
  }

  let message = reply.message;
  if (emailSendFailed && typeof message === "string" && message.length > 0) {
    const optimisticText = "Email confirmation has been sent.";
    const failureText = "We could not send your email confirmation right now. Please verify your email address and try again.";
    message = message.includes(optimisticText)
      ? message.replace(optimisticText, failureText)
      : `${message}\n\n${failureText}`;
  }

  res.json({ message, followUpMessage: reply.followUpMessage || null });
  return true;
}

// POST /chat - handles conversation with Gemini API
router.post("/", async (req, res) => {
  const { messages } = req.body; // [{role, content}]
  if (!messages) return res.status(400).json({ error: "Missing messages" });

  const flowReply = appointmentFlow.handleAppointmentFlow(messages);
  if (await sendFlowReply(res, flowReply)) {
    return;
  }

  const refillReply = refillFlow.handleRefillFlow(messages);
  if (await sendFlowReply(res, refillReply)) {
    return;
  }

  const supportReply = supportFlow.handleSupportFlow(messages);
  if (await sendFlowReply(res, supportReply)) {
    return;
  }

  const aiResponse = await gemini.sendToGemini(messages);
  res.json({ message: aiResponse });
});

module.exports = router;
