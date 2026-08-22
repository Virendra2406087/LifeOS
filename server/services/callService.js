const twilio = require("twilio");

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
} = process.env;

let client = null;
let enabled = false;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  enabled = true;
  
} else {
  console.warn(
    "⚠️  Call service disabled — TWILIO_ACCOUNT_SID/AUTH_TOKEN/TWILIO_PHONE_NUMBER missing in .env"
  );
}

const placeCall = async ({ to, message }) => {
  if (!enabled) {
    throw new Error("Call service is disabled — missing Twilio credentials in .env");
  }

  if (!to) {
    throw new Error("Recipient phone number is required");
  }

  // Twilio fetches this URL for call instructions; twimlets.com generates
  // a simple "say this message" response dynamically from the query param.
  const twimlUrl = `https://twimlets.com/message?Message%5B0%5D=${encodeURIComponent(
    message || "This is a reminder from LifeOS."
  )}`;

  const call = await client.calls.create({
    url: twimlUrl,
    to,
    from: TWILIO_PHONE_NUMBER,
  });

  return { sid: call.sid, status: call.status };
};

module.exports = { placeCall, isEnabled: () => enabled };