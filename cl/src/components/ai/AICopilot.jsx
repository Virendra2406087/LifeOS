import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FaPaperPlane } from "react-icons/fa";
import { askCopilot } from "../../services/copilotService";

// ── Copy button ──
function CopyBtn({ code }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      style={CS.copyBtn}
    >
      {copied ? "✅ Copied" : "📋 Copy"}
    </button>
  );
}

// ── SVG diagram renderer ──
function SvgDiagram({ code }) {
  const clean = code.trim();
  if (!clean.toLowerCase().startsWith("<svg"))
    return <div style={CS.svgError}>⚠️ Could not render diagram</div>;
  return (
    <div style={CS.svgWrap}>
      <div style={CS.svgHeader}>
        <span style={CS.svgLabel}>📊 Diagram</span>
        <CopyBtn code={code} />
      </div>
      <div style={CS.svgContainer} dangerouslySetInnerHTML={{ __html: clean }} />
    </div>
  );
}

// ── Markdown bubble renderer ──
function BubbleContent({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        h1: ({ children }) => <h1 style={MS.h1}>{children}</h1>,
        h2: ({ children }) => <h2 style={MS.h2}>{children}</h2>,
        h3: ({ children }) => <h3 style={MS.h3}>{children}</h3>,
        h4: ({ children }) => <h4 style={MS.h4}>{children}</h4>,
        p: ({ children }) => <p style={MS.p}>{children}</p>,
        ul: ({ children }) => <ul style={MS.ul}>{children}</ul>,
        ol: ({ children }) => <ol style={MS.ol}>{children}</ol>,
        li: ({ children }) => <li style={MS.li}>{children}</li>,
        strong: ({ children }) => <strong style={MS.strong}>{children}</strong>,
        em: ({ children }) => <em style={MS.em}>{children}</em>,
        hr: () => <hr style={MS.hr} />,
        blockquote: ({ children }) => <blockquote style={MS.blockquote}>{children}</blockquote>,
        table: ({ children }) => (
          <div style={{ overflowX: "auto", marginBottom: 14 }}>
            <table style={MS.table}>{children}</table>
          </div>
        ),
        th: ({ children }) => <th style={MS.th}>{children}</th>,
        td: ({ children }) => <td style={MS.td}>{children}</td>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noreferrer" style={MS.link}>
            {children}
          </a>
        ),
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const lang = match ? match[1].toLowerCase() : "";
          const codeStr = String(children).replace(/\n$/, "");
          if (!inline && lang === "svg") return <SvgDiagram code={codeStr} />;
          if (!inline && (match || codeStr.includes("\n")))
            return (
              <div style={CS.wrap}>
                <div style={CS.header}>
                  <span style={CS.lang}>{lang || "code"}</span>
                  <CopyBtn code={codeStr} />
                </div>
                <SyntaxHighlighter
                  style={oneDark}
                  language={lang || "javascript"}
                  PreTag="div"
                  showLineNumbers
                  wrapLongLines
                  customStyle={CS.block}
                >
                  {codeStr}
                </SyntaxHighlighter>
              </div>
            );
          return (
            <code style={MS.inlineCode} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ── Local fallback (unchanged logic) ──
const localFallback = (text, tasks) => {
  text = text.toLowerCase();
  if (text.includes("plan"))
    return "Start with your highest priority task, then complete medium priority tasks before lunch.";
  if (text.includes("productive"))
    return `You currently have ${tasks.length} tasks in LifeOS.`;
  if (text.includes("meeting"))
    return "You have upcoming meetings. Check Gmail Sync.";
  if (text.includes("call"))
    return "You have pending call reminders.";
  if (text.includes("schedule"))
    return "AI recommends completing important work between 9 AM and 11 AM.";
  return "I couldn't understand that — try asking about your tasks, schedule, or plan.";
};

const WELCOME = { role: "ai", content: "Ask me anything...." };

export default function AICopilot({ tasks = [] }) {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = async () => {
    if (!input.trim() || typing) return;
    const q = input.trim();
    const history = messages.filter((m) => m.role === "user" || m.role === "ai");

    setInput("");
    setTyping(true);
    setMessages((p) => [...p, { role: "user", content: q }]);

    try {
      const result = await askCopilot(q, history, tasks);
      const reply = result.success ? result.reply : localFallback(q, tasks);
      setMessages((p) => [...p, { role: "ai", content: reply }]);
    } catch {
      setMessages((p) => [...p, { role: "ai", content: localFallback(q, tasks) }]);
    } finally {
      setTyping(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const canSend = input.trim() && !typing;

  return (
    <div style={S.container}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />

      <div style={S.header}>
        <span className="lifeos-ai-icon">
      ✨
    </span>
        <h2 style={S.title}>LifeOS Copilot</h2>
      </div>

      <div style={S.chatBox}>
        {messages.map((msg, i) => (
          <div key={i} style={{ ...S.row, ...(msg.role === "user" ? S.rowUser : {}) }}>
            <div style={S.avatar}>{msg.role === "ai" ? <span className="lifeos-ai-icon">
      ✨
    </span> : "🧑"}</div>
            <div style={{ ...S.bubble, ...(msg.role === "user" ? S.bubbleUser : S.bubbleAI) }}>
              {msg.role === "ai" ? (
                <BubbleContent content={msg.content} />
              ) : (
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {typing && (
          <div style={S.row}>
            <div style={S.avatar}><span className="lifeos-ai-icon">
      ✨
    </span></div>
            <div style={{ ...S.bubble, ...S.bubbleAI, ...S.typingBubble }}>
              <span style={S.dot} />
              <span style={{ ...S.dot, animationDelay: "0.2s" }} />
              <span style={{ ...S.dot, animationDelay: "0.4s" }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div style={S.inputArea}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Ask AI…"
          disabled={typing}
          style={S.input}
        />
        <button onClick={sendMessage} disabled={!canSend} style={{ ...S.sendBtn, opacity: canSend ? 1 : 0.45 }}>
          <FaPaperPlane />
        </button>
      </div>

      <style>{`
        @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:0.4}40%{transform:translateY(-6px);opacity:1}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .katex-display{background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:10px;padding:16px 20px;margin:14px 0;overflow-x:auto;text-align:center;}
        .katex-display>.katex{color:#e2d9f3!important;font-size:1.15em!important;}
      `}</style>
    </div>
  );
}

const S = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: 20,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    backdropFilter: "blur(20px)",
    height: "100%",
    minHeight: 0,
  },
  header: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
  logo: { fontSize: 18 },
  title: {
    fontFamily: "'Syne',sans-serif",
    fontSize: 16,
    fontWeight: 800,
    background: "linear-gradient(135deg,#a855f7,#3b82f6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    margin: 0,
  },
  chatBox: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    paddingRight: 4,
  },
  row: { display: "flex", alignItems: "flex-start", gap: 10, animation: "fadeIn 0.3s ease" },
  rowUser: { flexDirection: "row-reverse" },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    flexShrink: 0,
  },
  bubble: { maxWidth: "85%", padding: "12px 16px", borderRadius: 14, fontSize: 13.5, lineHeight: 1.7, border: "1px solid rgba(255,255,255,0.07)" },
  bubbleAI: { background: "rgba(255,255,255,0.04)", color: "#f1f5f9", borderRadius: "4px 14px 14px 14px", backdropFilter: "blur(10px)" },
  bubbleUser: { background: "linear-gradient(135deg,rgba(124,58,237,0.35),rgba(168,85,247,0.25))", borderColor: "rgba(124,58,237,0.35)", borderRadius: "14px 4px 14px 14px", color: "#f1f5f9" },
  typingBubble: { display: "flex", alignItems: "center", gap: 5, padding: "12px 16px" },
  dot: { display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#a855f7", animation: "bounce 1.4s infinite" },
  inputArea: { display: "flex", gap: 8, flexShrink: 0 },
  input: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#f1f5f9",
    fontSize: 13.5,
    outline: "none",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    background: "linear-gradient(135deg,#7c3aed,#a855f7)",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 4px 15px rgba(124,58,237,0.4)",
  },
};

const MS = {
  h1: { fontSize: "1.4em", fontWeight: 800, color: "#e2d9f3", marginTop: 16, marginBottom: 8 },
  h2: { fontSize: "1.2em", fontWeight: 700, color: "#c4b5fd", marginTop: 14, marginBottom: 6 },
  h3: { fontSize: "1.05em", fontWeight: 700, color: "#a78bfa", marginTop: 12, marginBottom: 5 },
  h4: { fontSize: "1em", fontWeight: 700, color: "#8b5cf6", marginTop: 10, marginBottom: 4 },
  p: { color: "#cbd5e1", lineHeight: 1.8, marginBottom: 10, fontSize: 13.5 },
  ul: { paddingLeft: 20, marginBottom: 10, display: "flex", flexDirection: "column", gap: 4 },
  ol: { paddingLeft: 20, marginBottom: 10, display: "flex", flexDirection: "column", gap: 4 },
  li: { color: "#94a3b8", fontSize: 13.5, lineHeight: 1.65 },
  inlineCode: { background: "rgba(124,58,237,0.18)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 4, padding: "2px 6px", fontFamily: "'Courier New',monospace", fontSize: "0.85em", color: "#c4b5fd" },
  blockquote: { borderLeft: "3px solid #7c3aed", padding: "6px 12px", background: "rgba(124,58,237,0.08)", borderRadius: "0 8px 8px 0", margin: "10px 0", color: "#94a3b8", fontStyle: "italic" },
  strong: { color: "#f1f5f9", fontWeight: 700 },
  em: { color: "#a78bfa", fontStyle: "italic" },
  hr: { border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "14px 0" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12.5 },
  th: { padding: "6px 10px", background: "rgba(124,58,237,0.2)", color: "#c4b5fd", fontWeight: 700, textAlign: "left", border: "1px solid rgba(124,58,237,0.2)" },
  td: { padding: "6px 10px", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.06)" },
  link: { color: "#60a5fa", textDecoration: "none", fontWeight: 500 },
};

const CS = {
  wrap: { borderRadius: 10, overflow: "hidden", marginBottom: 12, marginTop: 4, border: "1px solid rgba(255,255,255,0.08)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px", background: "rgba(0,0,0,0.5)", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  lang: { fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" },
  copyBtn: { padding: "3px 10px", borderRadius: 6, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", color: "#a855f7", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "sans-serif" },
  block: { margin: 0, borderRadius: 0, fontSize: "12px", lineHeight: 1.7, background: "rgba(0,0,0,0.55)" },
  svgWrap: { borderRadius: 12, overflow: "hidden", marginBottom: 14, marginTop: 6, border: "1px solid rgba(124,58,237,0.25)" },
  svgHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(99,102,241,0.15))", borderBottom: "1px solid rgba(124,58,237,0.2)" },
  svgLabel: { fontSize: 11, fontWeight: 700, color: "#a855f7", letterSpacing: "0.05em" },
  svgContainer: { background: "#0f172a", padding: 20, display: "flex", justifyContent: "center", alignItems: "center", overflow: "auto", minHeight: 70 },
  svgError: { padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#fca5a5", fontSize: 12 },
};