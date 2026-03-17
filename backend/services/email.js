// email.js
const nodemailer = require("nodemailer");

function buildEmailBody(details) {
  const location = details.location || {};
  const locationLine = [location.street, location.city, location.state, location.zip]
    .filter(Boolean)
    .join(", ");

  const lines = [
    "Hi, Kyron Medical here. Your appointment is confirmed.",
    "",
    "Confirmation details from our chat:",
    `- Name: ${details.patientName || "N/A"}`,
    `- DOB: ${details.dob || "N/A"}`,
    `- Reason: ${details.reason || "N/A"}`,
    `- Doctor/Department: ${details.doctor?.name || "N/A"}`,
    `- Appointment Date & Time: ${details.time || "N/A"}`,
    "",
    "Clinic Location:",
    `Street: ${location.street || "N/A"}`,
    `City: ${location.city || "N/A"}`,
    `State: ${location.state || "N/A"}`,
    `ZIP Code: ${location.zip || "N/A"}`,
    `Full Address: ${locationLine || "N/A"}`,
    "",
    "Please be on time to this location.",
    "",
    "Thank you for confirming with Kyron Medical.",
    "See you soon and take care of your health.",
  ];

  return lines.join("\n");
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

async function sendAppointmentEmail(patientEmail, appointmentDetails) {
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@kyronmedical.com";
  const body = buildEmailBody(appointmentDetails || {});
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[Email simulated] To: ${patientEmail}`);
    console.log(body);
    return { simulated: true };
  }

  const info = await transporter.sendMail({
    from: fromEmail,
    to: patientEmail,
    subject: "Kyron Medical Appointment Confirmation",
    text: body,
  });

  return {
    simulated: false,
    messageId: info.messageId,
  };
}

module.exports = { sendAppointmentEmail };
