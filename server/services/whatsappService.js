const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM;

let client = null;

// Only construct the Twilio client if credentials look valid.
// This prevents a crash at require() time when .env is unset/placeholder.
if (accountSid && authToken && accountSid.startsWith("AC")) {
  try {
    client = twilio(accountSid, authToken);
  } catch (err) {
    console.warn("⚠️  Twilio client failed to initialize:", err.message);
    client = null;
  }
} else {
  console.warn(
    "⚠️  WhatsApp service disabled — TWILIO_ACCOUNT_SID/AUTH_TOKEN missing or invalid in .env"
  );
}

const sendWhatsAppMessage = async (toNumber, message) => {
  if (!client) {
    throw new Error(
      "WhatsApp service not configured. Set valid TWILIO_ACCOUNT_SID (starts with 'AC'), TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM in .env"
    );
  }
  if (!toNumber) throw new Error("Recipient phone number is required");
  if (!fromWhatsApp) throw new Error("TWILIO_WHATSAPP_FROM is not set in .env");

  const formattedTo = toNumber.startsWith("whatsapp:")
    ? toNumber
    : `whatsapp:${toNumber}`;

  const formattedFrom = fromWhatsApp.startsWith("whatsapp:")
    ? fromWhatsApp
    : `whatsapp:${fromWhatsApp}`;

  try {
    const result = await client.messages.create({
      from: formattedFrom,
      to: formattedTo,
      body: message,
    });
    return { sid: result.sid, status: result.status };
  } catch (err) {
    console.error("Twilio send failed:", { code: err.code, message: err.message, moreInfo: err.moreInfo });
    throw new Error(err.message || "Failed to send WhatsApp message");
  }
};

module.exports = { sendWhatsAppMessage };