// vapi.js
// Service to call Vapi API for phone calls
const axios = require("axios");

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID || "f5165447-1d40-4613-8fef-6677b916fe36"; // Default fallback

async function startVapiCall(phoneNumber) {
  if (!VAPI_API_KEY || !VAPI_ASSISTANT_ID) {
    throw new Error("VAPI_API_KEY or VAPI_ASSISTANT_ID not set in environment");
  }

  // Clean and format the phone number to E.164 format
  const cleanPhoneNumber = phoneNumber.replace(/[\s\-\.\(\)]/g, '');
  let formattedPhoneNumber = cleanPhoneNumber;

  // Ensure it starts with + and has country code
  if (!formattedPhoneNumber.startsWith('+')) {
    // Assume US if no country code provided
    formattedPhoneNumber = `+1${formattedPhoneNumber}`;
  }

  // Validate E.164 format (basic check)
  if (!formattedPhoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
    throw new Error(`Invalid phone number format: ${formattedPhoneNumber}. Please provide a valid phone number.`);
  }

  const url = "https://api.vapi.ai/call";
  const headers = {
    Authorization: `Bearer ${VAPI_API_KEY}`,
    "Content-Type": "application/json",
  };
  const body = {
    assistantId: VAPI_ASSISTANT_ID,
    phoneNumberId: VAPI_PHONE_NUMBER_ID,
    customer: { number: formattedPhoneNumber },
  };

  console.log("Making Vapi call with:", { assistantId: VAPI_ASSISTANT_ID, phoneNumberId: VAPI_PHONE_NUMBER_ID, customerNumber: formattedPhoneNumber });

  try {
    const response = await axios.post(url, body, { headers });
    console.log("Vapi API success:", response.data);
    return response.data;
  } catch (err) {
    console.error("Vapi API error:", err?.response?.data || err.message);
    throw new Error(`Vapi API error: ${err?.response?.data?.message || err.message}`);
  }
}

module.exports = { startVapiCall };
