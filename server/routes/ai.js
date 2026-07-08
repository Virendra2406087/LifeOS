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
      model: "gemini-2.0-flash-lite",
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

module.exports = router;