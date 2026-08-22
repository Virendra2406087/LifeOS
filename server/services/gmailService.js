const { google } = require("googleapis");

const fetch = global.fetch || require("node-fetch");
const User = require("../models/User");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.6-flash";
const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";

const getOAuthClient = (user) => {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${SERVER_URL}/api/auth/google/callback`
  );

  client.setCredentials({
    access_token: user.google.accessToken,
    refresh_token: user.google.refreshToken,
  });

  // googleapis auto-refreshes the access token using the refresh_token
  // when it's expired — this event fires whenever that happens, so we
  // persist the new access_token (and rotated refresh_token if present)
  client.on("tokens", async (tokens) => {
    try {
      const update = {};
      if (tokens.access_token) update["google.accessToken"] = tokens.access_token;
      if (tokens.refresh_token) update["google.refreshToken"] = tokens.refresh_token;

      if (Object.keys(update).length) {
        await User.findByIdAndUpdate(user._id, { $set: update });
      }
    } catch (err) {
      console.error("Failed to persist refreshed Google tokens:", err.message);
    }
  });

  return client;
};

// ---- Extraction result cache ----
// Keyed by Gmail message ID. Prevents re-burning Gemini quota every time
// the dashboard reloads and re-scans the same emails — without this,
// two page refreshes can exhaust the free-tier daily limit (20 requests/day
// on gemini-3.6-flash), which is exactly what caused the 429 errors.
// Caches BOTH successful extractions and "not a meeting" (null) results,
// so a non-meeting email doesn't get re-sent to Gemini on every load either.
// In-memory only — resets on server restart, which is fine since a few
// hours of staleness is harmless for this use case.
const extractionCache = new Map();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function getCached(messageId) {
  const entry = extractionCache.get(messageId);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    extractionCache.delete(messageId);
    return undefined;
  }
  return entry.result;
}

function setCached(messageId, result) {
  extractionCache.set(messageId, { result, timestamp: Date.now() });
}

const extractMeetingFromSingleEmail = async (user, messageId) => {
  const cached = getCached(messageId);
  if (cached !== undefined) {
    if (cached === null) {
      throw new Error("Couldn't detect a clear meeting time in this email");
    }
    return cached;
  }

  const auth = getOAuthClient(user);
  const gmail = google.gmail({ version: "v1", auth });

  const msg = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const headers = msg.data.payload.headers;
  const subject = headers.find((h) => h.name === "Subject")?.value || "(no subject)";
  const dateHeader = headers.find((h) => h.name === "Date")?.value;
  const receivedAtISO = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString();

  const bodyText = extractPlainTextBody(msg.data.payload) || msg.data.snippet || "";

  const extracted = await extractMeetingWithGemini(subject, bodyText, receivedAtISO);

  if (!extracted) {
    setCached(messageId, null);
    throw new Error("Couldn't detect a clear meeting time in this email");
  }

  const result = {
    title: extracted.title || subject,
    date: extracted.date || null, // "YYYY-MM-DD" from Gemini — preserved through to the DB
    startTime: extracted.startTime,
    endTime: extracted.endTime,
    link: extracted.link || "",
  };

  setCached(messageId, result);
  return result;
};

// Scans recent inbox subjects for meeting/interview/deadline-style emails.
// Simple keyword heuristic — swap for the Gemini setup used elsewhere in
// this app (AICopilot/AIGoalPlanner pattern) if you want smarter detection.
const getSmartTasksFromGmail = async (user) => {
  const auth = getOAuthClient(user);
  const gmail = google.gmail({ version: "v1", auth });

  const list = await gmail.users.messages.list({
    userId: "me",
    maxResults: 15,
    q: "newer_than:14d (meeting OR interview OR deadline OR assignment OR schedule)",
  });

  const messages = list.data.messages || [];

  const tasks = await Promise.all(
    messages.map(async (m) => {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: m.id,
        format: "metadata",
        metadataHeaders: ["Subject", "Date"],
      });

      const headers = msg.data.payload.headers;
      const subject = headers.find((h) => h.name === "Subject")?.value || "(no subject)";
      const date = headers.find((h) => h.name === "Date")?.value;

      const lower = subject.toLowerCase();
      let type = "Reminder";
      if (lower.includes("interview")) type = "Interview";
      else if (lower.includes("meeting")) type = "Meeting";
      else if (lower.includes("deadline") || lower.includes("assignment")) type = "Deadline";

      return {
        id: m.id,
        title: subject,
        receivedAt: date ? new Date(date).toISOString() : new Date().toISOString(),
        type,
      };
    })
  );

  return tasks;
};

const getUpcomingMeetings = async (user) => {
  const auth = getOAuthClient(user);
  const calendar = google.calendar({ version: "v3", auth });

  const now = new Date();
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: sevenDaysOut.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 15,
  });

  const events = res.data.items || [];

  return events.map((e) => ({
    id: e.id,
    title: e.summary || "(no title)",
    start: e.start?.dateTime || e.start?.date,
    end: e.end?.dateTime || e.end?.date,
    location: e.location || null,
    meetLink: e.hangoutLink || null,
  }));
};

// ---- Gemini-based extraction from raw email bodies ----

// Recursively walks the Gmail MIME payload to find the plain text body
function extractPlainTextBody(payload) {
  if (!payload) return "";

  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }

  if (payload.parts) {
    const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if (textPart?.body?.data) {
      return Buffer.from(textPart.body.data, "base64").toString("utf-8");
    }
    for (const part of payload.parts) {
      const nested = extractPlainTextBody(part);
      if (nested) return nested;
    }
  }

  return "";
}

async function extractMeetingWithGemini(subject, bodyText, receivedAtISO) {
  if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not set — skipping AI meeting extraction");
    return null;
  }

  const prompt = `You are extracting meeting details from an email. Today's reference date/time is ${receivedAtISO}.

Email subject: "${subject}"
Email body:
"""
${bodyText.slice(0, 3000)}
"""

If this email describes a specific scheduled meeting with a clear date and time, respond with ONLY this JSON (no markdown, no extra text):
{"isMeeting": true, "title": "short meeting title", "date": "YYYY-MM-DD", "startTime": "HH:MM AM/PM", "endTime": "HH:MM AM/PM", "link": "meeting URL if present or empty string", "confidence": "high|medium|low"}

If there is no clear date/time (vague, generic, or not actually a meeting), respond with ONLY:
{"isMeeting": false}

If no end time is mentioned, estimate one hour after start time. Respond with raw JSON only.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    );

    const rawText = await res.text(); // read as text FIRST, not .json() directly

    if (!res.ok) {
      console.error(`Gemini API error (status ${res.status}):`, rawText);

      // 429 = quota/rate-limit exhausted. Surface this distinctly instead
      // of silently returning null, so the controller/frontend can show
      // an honest "quota exceeded" message instead of "couldn't detect a
      // clear meeting time" — which is misleading when the email is fine.
      if (res.status === 429) {
        const err = new Error("Gemini API quota exceeded — try again shortly");
        err.isQuotaError = true;
        throw err;
      }

      return null;
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.error("Gemini returned non-JSON body:", rawText.slice(0, 300));
      return null;
    }

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!raw) {
      console.error("Gemini response had no text content:", JSON.stringify(data).slice(0, 300));
      return null;
    }

    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.isMeeting) return null;
    return parsed;
  } catch (err) {
    if (err.isQuotaError) throw err; // let quota errors bubble up to the caller distinctly
    console.error("Gemini meeting extraction failed:", err.message);
    return null;
  }
}

// Fetches meeting-like emails, pulls full body, extracts structured
// meeting data via Gemini. Skips low-confidence / non-meeting results.
// maxResults kept low (5, not 10) because this runs on every dashboard
// load/refresh — it's the single biggest source of Gemini quota usage.
const getAIExtractedMeetings = async (user) => {
  const auth = getOAuthClient(user);
  const gmail = google.gmail({ version: "v1", auth });

  const list = await gmail.users.messages.list({
    userId: "me",
    maxResults: 5,
    q: "newer_than:14d (meeting OR invite OR call OR sync)",
  });

  const messages = list.data.messages || [];

  const results = await Promise.all(
    messages.map(async (m) => {
      try {
        const cached = getCached(m.id);
        if (cached !== undefined) return cached; // null (not a meeting) or a result object; filtered below

        const msg = await gmail.users.messages.get({
          userId: "me",
          id: m.id,
          format: "full",
        });

        const headers = msg.data.payload.headers;
        const subject = headers.find((h) => h.name === "Subject")?.value || "(no subject)";
        const dateHeader = headers.find((h) => h.name === "Date")?.value;
        const receivedAtISO = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString();

        const bodyText = extractPlainTextBody(msg.data.payload) || msg.data.snippet || "";

        const extracted = await extractMeetingWithGemini(subject, bodyText, receivedAtISO);
        if (!extracted || extracted.confidence === "low") {
          setCached(m.id, null);
          return null;
        }

        const result = {
          id: m.id,
          title: extracted.title || subject,
          date: extracted.date,
          startTime: extracted.startTime,
          endTime: extracted.endTime,
          link: extracted.link || null,
          confidence: extracted.confidence,
        };

        setCached(m.id, result);
        return result;
      } catch (err) {
        // Quota errors here just mean this particular batch scan is skipped —
        // don't let one 429 kill the whole Promise.all, just log and move on.
        console.error(`Failed processing message ${m.id}:`, err.message);
        return null;
      }
    })
  );

  return results.filter(Boolean);
};

module.exports = {
  getSmartTasksFromGmail,
  getUpcomingMeetings,
  getAIExtractedMeetings,
  extractMeetingFromSingleEmail,
};