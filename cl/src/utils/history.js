// client/src/utils/history.js

const getKey = () => {
  try {
    const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
    const uid = profile.email || "guest";
    return `lifeos_history_${uid}`;
  } catch {
    return "lifeos_history_guest";
  }
};

export const getHistory = () => {
  try { return JSON.parse(localStorage.getItem(getKey()) || "{}"); }
  catch { return {}; }
};

const saveHistory = (data) => {
  localStorage.setItem(getKey(), JSON.stringify(data));
  window.dispatchEvent(new Event("historyUpdated"));
};

export const trackActivity = (type, title, detail = "") => {
  const history = getHistory();
  const dk      = new Date().toDateString();
  if (!history[dk]) history[dk] = [];
  history[dk].unshift({
    id:     Date.now(),
    type,
    title,
    detail,
    time:   new Date().toISOString(),
  });
  history[dk] = history[dk].slice(0, 100);
  saveHistory(history);
};

export const trackDoc       = (topic)    => trackActivity("doc",       `📄 Documentation: ${topic}`,       topic);
export const trackFlashcard = (topic, n) => trackActivity("flashcard", `🃏 Flashcards: ${topic}`,           `${n} cards generated`);
export const trackQuiz      = (topic, n) => trackActivity("quiz",      `🧠 Quiz: ${topic}`,                 `${n} questions generated`);
export const trackTopic     = (title)    => trackActivity("topic",     `📚 New Topic: ${title}`,            title);
export const trackTutor     = (q, a)     => trackActivity("tutor",     `🤖 AI Chat: ${q.slice(0,60)}${q.length>60?"…":""}`, a.slice(0,200));
export const trackTask      = (text)     => trackActivity("task",      `✅ Task: ${text}`,                  text);

export const getDayHistory  = (date) => {
  const history = getHistory();
  return history[date.toDateString()] || [];
};

export const getActiveDates = () => Object.keys(getHistory());

export const fmtTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:true });
};

export const TYPE_CONFIG = {
  doc:       { icon:"📄", label:"Documentation", color:"#6366f1" },
  flashcard: { icon:"🃏", label:"Flashcards",    color:"#a855f7" },
  quiz:      { icon:"🧠", label:"Quiz",          color:"#3b82f6" },
  topic:     { icon:"📚", label:"Topic",         color:"#10b981" },
  tutor:     { icon:"🤖", label:"AI Tutor",      color:"#f59e0b" },
  task:      { icon:"✅", label:"Task",          color:"#22c55e" },
};