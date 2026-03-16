// vapi.js
// Service to call Vapi API for phone calls
const axios = require("axios");

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;

async function startVapiCall(phoneNumber) {
  if (!VAPI_API_KEY || !VAPI_ASSISTANT_ID) {
    throw new Error("VAPI_API_KEY or VAPI_ASSISTANT_ID not set in environment");
  }
  const url = "https://api.vapi.ai/call";
  const headers = {
    Authorization: `Bearer ${VAPI_API_KEY}`,
    "Content-Type": "application/json",
  };
  const body = {
    assistantId: VAPI_ASSISTANT_ID,
    phoneNumberId: "f5165447-1d40-4613-8fef-6677b916fe36", // This should be the ID of the phone number you have set up in Vapi
    customer: { number: phoneNumber },
  };
  try {
    const response = await axios.post(url, body, { headers });
    return response.data;
  } catch (err) {
    console.error("Vapi API error:", err?.response?.data || err.message);
    throw err;
  }
}

module.exports = { startVapiCall };
