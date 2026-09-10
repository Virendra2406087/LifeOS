import { useState, useEffect } from "react";
import "./AIFeaturesPanel.css";

// AI feature widgets (moved out of Dashboard.jsx to reduce clutter)
import SmartScheduler from "../../ai/SmartScheduler";
import ProductivityPrediction from "../../ai/ProductivityPrediction";
import GmailTasks from "../../ai/GmailTasks";
import WhatsAppReminder from "../../ai/WhatsAppReminder";
import SmartMeetingAssistant from "../../ai/SmartMeetingAssistant";

import AIPriorityCard from "../ai/AIPriorityCard";
import AITimeEstimator from "../ai/AITimeEstimator";
import AIAutoScheduler from "../ai/AIAutoScheduler";
import AIGoalPlanner from "../ai/AIGoalPlanner";
import HabitAnalyzer from "../ai/HabitAnalyzer";
import BurnoutPredictor from "../ai/BurnoutPredictor";
import SmartDailyPlanner from "../ai/SmartDailyPlanner";
import GmailMeetingSync from "../ai/GmailMeetingSync";
import SmartRescheduler from "../ai/SmartRescheduler";
import CallWhatsAppReminder from "../ai/CallWhatsAppReminder";
import AIVoiceAssistant from "../ai/AIVoiceAssistant";
import AICopilot from "../ai/AICopilot";
import {Brain, CalendarDays, ChartNoAxesColumn, Mail, Mic} from "lucide-react";

/**
 * Sidebar
 * -------
 * Central home for every AI feature. Dashboard.jsx now only shows a
 * trigger button + top-level cards; everything AI-related lives here
 * behind collapsible sections so the dashboard itself stays simple.
 *
 * NOTE: This is a functional placeholder layout/styling-wise. You said
 * you'll send the real Sidebar design later — swap the markup/CSS in
 * here once you do, the section/props structure underneath can stay.
 */

const SECTIONS = [
  { id: "copilot", label: "LifeOS Copilot", icon: (
        <span className="lifeos-ai-icon">
          ✨
        </span>
      ) },
  { id: "insights", label: "AI Insights", icon: <ChartNoAxesColumn/> },
  { id: "productivity", label: "AI Productivity", icon: <Brain/> },
  { id: "communication", label: "Communication", icon: <Mail/> },
  { id: "planning", label: "Planning", icon: <CalendarDays/> },
  { id: "voice", label: "Voice & Reminders", icon: <Mic/> },
];

export default function AIFeaturesPanel({
  isOpen,
  onClose,
  tasks = [],
  setTasks,
  focusSection = null,
}) {
  const [activeSection, setActiveSection] = useState("copilot");

  // When Dashboard opens the sidebar via a specific quick-action
  // (e.g. "Voice AI" or "Gmail Sync"), jump straight to that section.
  useEffect(() => {
    if (isOpen && focusSection) {
      setActiveSection(focusSection);
    }
  }, [isOpen, focusSection]);

  if (!isOpen) return null;

  const toggleSection = (id) => {
    setActiveSection((prev) => (prev === id ? null : id));
  };

  return (
    <>
      <div className="ai-panel-backdrop" onClick={onClose} />

      <aside className="ai-sidebar">
        <div className="ai-sidebar-header">
          <h2>AI Features</h2>
          <button
            className="ai-sidebar-close"
            onClick={onClose}
            aria-label="Close AI sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="ai-sidebar-nav">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              className={`ai-sidebar-nav-item ${
                activeSection === section.id ? "active" : ""
              }`}
              onClick={() => toggleSection(section.id)}
            >
              <span>{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>

        <div className="ai-sidebar-content">
          {activeSection === "copilot" && (
            <div className="ai-sidebar-section ai-sidebar-section-full">
              <AICopilot tasks={tasks} />
            </div>
          )}

          {activeSection === "insights" && (
            <div className="ai-sidebar-section ai-sidebar-section-grid">
              <AIPriorityCard tasks={tasks} />
              <AITimeEstimator tasks={tasks} />
              <BurnoutPredictor tasks={tasks} />
              <HabitAnalyzer tasks={tasks} />
            </div>
          )}

          {activeSection === "productivity" && (
            <div className="ai-sidebar-section ai-sidebar-section-grid">
              <SmartScheduler tasks={tasks} />
              <AIAutoScheduler tasks={tasks} />
              <ProductivityPrediction />
              <SmartDailyPlanner tasks={tasks} />
            </div>
          )}

          {activeSection === "communication" && (
            <div className="ai-sidebar-section ai-sidebar-section-grid">
              {/* <WhatsAppReminder /> */}
              {/* <GmailMeetingSync /> */}
              <GmailTasks />
              <SmartMeetingAssistant />
            </div>
          )}

          {activeSection === "planning" && (
            <div className="ai-sidebar-section">
              <AIGoalPlanner />
              <SmartRescheduler tasks={tasks} setTasks={setTasks} />
            </div>
          )}

          {activeSection === "voice" && (
            <div className="ai-sidebar-section">
              <AIVoiceAssistant setTasks={setTasks} />
              <CallWhatsAppReminder />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}