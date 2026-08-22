import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

/**
 * AIPanelContext
 * ---------------
 * The AI Features panel is rendered once inside Sidebar.jsx.
 *
 * Any page such as Dashboard can:
 * - open the AI panel
 * - close the AI panel
 * - open a specific AI section
 *
 * Example:
 *
 * openAIPanel("tasks")
 * openAIPanel("voice")
 * openAIPanel("copilot")
 * openAIPanel("communication")
 */

const AIPanelContext = createContext(null);

export function AIPanelProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusSection, setFocusSection] = useState(null);

  /* =========================================
     OPEN AI PANEL
  ========================================= */

  const openAIPanel = useCallback((section = null) => {
    setFocusSection(section);
    setIsOpen(true);
  }, []);

  /* =========================================
     CLOSE AI PANEL
  ========================================= */

  const closeAIPanel = useCallback(() => {
    setIsOpen(false);
    setFocusSection(null);
  }, []);

  return (
    <AIPanelContext.Provider
      value={{
        isOpen,
        focusSection,
        openAIPanel,
        closeAIPanel,
      }}
    >
      {children}
    </AIPanelContext.Provider>
  );
}

/* =========================================
   CUSTOM HOOK
========================================= */

export function useAIPanel() {
  const ctx = useContext(AIPanelContext);

  if (!ctx) {
    throw new Error(
      "useAIPanel must be used within an AIPanelProvider"
    );
  }

  return ctx;
}