const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();
const genAI  = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ── Variety seeds — rotate on every refresh ── */
const NORMAL_SEEDS = [
  "Focus on deep work and concentration tasks",
  "Focus on physical wellness and movement",
  "Focus on learning and skill development",
  "Focus on communication and social tasks",
  "Focus on organization and planning ahead",
  "Focus on creative and enjoyable activities",
  "Focus on health and self-care habits",
  "Focus on career and professional growth",
];

const LOW_ENERGY_SEEDS = [
  "Focus on gentle mindfulness activities",
  "Focus on simple physical movement",
  "Focus on hydration and nutrition",
  "Focus on quick easy wins",
  "Focus on rest and mental recovery",
  "Focus on breathing and relaxation",
];


router.post("/copilot", async (req, res) => {
  try {
    const { message, history = [], tasks = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const taskContext = tasks.length === 0
      ? "The user currently has no tasks."
      : `The user's current tasks:\n${tasks
          .map((t, i) => `${i + 1}. "${t.text}" — priority: ${t.priority || "medium"}, completed: ${t.completed}, date: ${t.date || "n/a"}`)
          .join("\n")}`;

    const systemContext = `
You are LifeOS Copilot, a helpful productivity assistant inside the LifeOS app.
Be concise — 1 to 3 sentences unless the user asks for detail.
Use the task data below to give specific, grounded answers instead of generic advice.

${taskContext}
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
      },
    });

    // Gemini's chat history format needs role: "user" | "model"
   const chatHistory = history
      .filter((m) => m.content && m.content.trim())
      .map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemContext }] },
        { role: "model", parts: [{ text: "Understood, I'll use this context to help." }] },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text().trim();

    res.json({ success: true, reply });

  } catch (error) {
    console.error("Copilot AI ERROR:", error);

    if (error.status === 429) {
      return res.json({
        success: true,
        reply: "I'm getting a lot of requests right now — try again in a moment.",
        fallback: true,
      });
    }

    res.status(500).json({ success: false, error: "Copilot failed to respond" });
  }
});

router.post("/suggest", async (req, res) => {
  try {
    const { tasks = [], mode = "normal" } = req.body;

    /* ── Pick a random theme seed ── */
    const seeds      = mode === "low_energy" ? LOW_ENERGY_SEEDS : NORMAL_SEEDS;
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)];

    /* ── Task summary ── */
    const taskSummary = tasks.length === 0
      ? "No tasks yet."
      : tasks
          .map((t, i) =>
            `${i + 1}. "${t.text}" (priority: ${t.priority || "medium"}, completed: ${t.completed})`
          )
          .join("\n");

    /* ── Prompt with random seed injected ── */
    const prompt = mode === "low_energy"
      ? `
You are a gentle productivity coach helping someone who is feeling tired and low energy today.
Today's focus theme: ${randomSeed}

Based on their current tasks, suggest exactly 3 very light, easy, low-effort tasks they can do.

Rules:
- Each suggestion must be under 8 words
- Tasks should be easy, calming, or restorative — NOT demanding
- Be creative and SPECIFIC — avoid generic advice like "drink water" or "take a break"
- Suggestions must match today's theme: ${randomSeed}
- Return ONLY the 3 suggestions, one per line, no numbering, no bullets, no extra text

Current tasks:
${taskSummary}
`
      : `
You are a productivity coach helping a user improve their day.
Today's focus theme: ${randomSeed}

Based on their current task list, suggest exactly 3 short actionable tasks to add.

Rules:
- Each suggestion must be under 8 words
- Be CREATIVE and SPECIFIC — do NOT suggest generic tasks like "take a break" or "drink water"
- Suggestions must match today's theme: ${randomSeed}
- Never repeat suggestions from previous sessions
- Return ONLY the 3 suggestions, one per line, no numbering, no bullets, no extra text

Current tasks:
${taskSummary}
`;

    /* ── High temperature = more creative/varied output ── */
    const model  = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      generationConfig: {
        temperature: 0.9,
        topP:        0.95,
        topK:        40,
      }
    });

    const result = await model.generateContent(prompt);
    const text   = result.response.text();

    const suggestions = text
      .split("\n")
      .map(s => s.replace(/^[-•*0-9. ]+/, "").trim())
      .filter(Boolean)
      .slice(0, 3);

    res.json({ suggestions });

  } catch (error) {
    console.error("Gemini AI ERROR:", error);

    /* ── 429 quota fallback ── */
    if (error.status === 429) {
      const fallback = req.body.mode === "low_energy"
        ? ["Stretch for 5 minutes gently", "Write 3 things you're grateful for", "Tidy one small area nearby"]
        : ["List tomorrow's top 3 priorities", "Review and close unused browser tabs", "Send one important pending message"];
      return res.json({ suggestions: fallback });
    }

    res.status(500).json({ error: "AI suggestion failed" });
  }
});

router.post("/goal-plan", async (req, res) => {
  try {
    const { goal } = req.body;

    if (!goal || !goal.trim()) {
      return res.status(400).json({ success: false, error: "Goal is required" });
    }

    const prompt = `
You are a learning/goal-planning coach. Create a realistic, appropriately-scoped roadmap for this goal: "${goal.trim()}"

Rules:
- Decide the right timeframe and structure YOURSELF based on how big or small this goal actually is.
  - A small goal (e.g. "learn basic HTML") might only need 1-2 weeks or even a few days.
  - A large goal (e.g. "become a senior backend engineer") might need 8-16 weeks or more, possibly grouped into phases/months instead of weeks.
- Use whatever time unit fits best: "Week 1", "Day 1-3", "Month 1", "Phase 1: Foundations", etc. — pick what's natural for this specific goal.
- Return ONLY valid JSON, no markdown code fences, no explanation, no extra text.
- The JSON must be an array of objects, each shaped exactly like: { "period": "Week 1", "tasks": ["task 1", "task 2", "task 3"] }
- Each period should have 2-5 short, specific, actionable tasks (under 12 words each).
- Tasks should progress logically — foundational work early on, applied/advanced work later.
- Be specific to the goal, not generic advice.
- Choose however many periods are actually appropriate — don't pad or artificially shorten it.

Example format:
[{"period":"Week 1","tasks":["Learn X basics","Set up environment"]},{"period":"Week 2","tasks":["Build first small project"]}]
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
      },
    });

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let plan;
    try {
      plan = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Goal plan JSON parse failed:", cleaned);
      return res.status(502).json({ success: false, error: "AI returned an invalid plan format" });
    }

    if (!Array.isArray(plan) || plan.length === 0) {
      return res.status(502).json({ success: false, error: "AI returned an empty or invalid plan" });
    }

    res.json({ success: true, plan });

  } catch (error) {
    console.error("Goal Planner AI ERROR:", error);

    if (error.status === 429) {
      return res.status(429).json({ success: false, error: "AI is busy, please try again shortly" });
    }

    res.status(500).json({ success: false, error: "Failed to generate goal plan" });
  }
});

module.exports = router;