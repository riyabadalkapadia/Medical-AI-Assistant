// sms.js
// Simulated SMS delivery used after Twilio/Vapi trial expiration.
async function sendAppointmentSms(phone, text) {
  const result = {
    status: "delivered",
    to: phone,
    simulated: true,
    reason: "Twilio and Vapi free trial ended",
  };

  console.log(`SMS simulated to ${phone}: ${text}`);
  return result;
}

module.exports = { sendAppointmentSms };
