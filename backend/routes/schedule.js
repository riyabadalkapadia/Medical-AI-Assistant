// schedule.js
const express = require("express");
const router = express.Router();
const emailService = require("../services/email");

// POST /schedule - stores appointment booking
router.post("/", (req, res) => {
  const { patientInfo, doctor, time } = req.body;
  if (!patientInfo || !doctor || !time) {
    return res.status(400).json({ error: "Missing booking info" });
  }
  // Simulate storing booking (could be DB in real app)
  emailService.sendAppointmentEmail(patientInfo.email, {
    patientInfo,
    doctor,
    time,
  });
  res.json({
    success: true,
    message: `Appointment confirmed with ${doctor.name} on ${time}`,
  });
});

module.exports = router;
