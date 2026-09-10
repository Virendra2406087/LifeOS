import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useUser, useClerk } from "@clerk/react";

import {
  FaHome,
  FaChartBar,
  FaTasks,
  FaHistory,
  FaCog,
  FaUser,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";

import AIFeaturesPanel from "./AIFeaturesPanel";
import { useAIPanel } from "../../context/AIPanelContext";

import "./Sidebar.css";

export default function Sidebar({
  tasks = [],
  setTasks,
}) {
  const navigate = useNavigate();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();

  /* =========================================
     SIDEBAR STATE
  ========================================= */

  const [showMenu, setShowMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuRef = useRef(null);

  /* =========================================
     AI PANEL CONTEXT
  ========================================= */

  const {
    isOpen: aiPanelOpen,
    focusSection,
    openAIPanel,
    closeAIPanel,
  } = useAIPanel();

  /* =========================================
     USER
  ========================================= */

  const user = {
    name: clerkUser?.fullName || clerkUser?.username || "Account",
    email: clerkUser?.primaryEmailAddress?.emailAddress || "",
    avatar: clerkUser?.imageUrl || null,
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  /* =========================================
     SIGN OUT
  ========================================= */

  const handleSignOut = () => {
    closeAIPanel();
    signOut(() => navigate("/login"));
  };

  /* =========================================
     CLOSE USER POPUP
     WHEN CLICKING OUTSIDE
  ========================================= */

  useEffect(() => {
    const handler = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  /* =========================================
     NAVIGATION CLICK
  ========================================= */

  const handleNavClick = () => {
    setMobileOpen(false);

    /*
      If user navigates to another page,
      close AI panel.
    */

    if (aiPanelOpen) {
      closeAIPanel();
    }
  };

  /* =========================================
     MAIN NAVIGATION
  ========================================= */

  const NAV_LINKS = [
    {
      to: "/dashboard",
      icon: <FaHome />,
      label: "Dashboard",
    },
    {
      to: "/analytics",
      icon: <FaChartBar />,
      label: "Analytics",
    },
    {
      to: "/tasks",
      icon: <FaTasks />,
      label: "Tasks",
    },
    {
      to: "/history",
      icon: <FaHistory />,
      label: "History",
    },
  ];

  /* =========================================
     ACCOUNT NAVIGATION
  ========================================= */

  const ACCOUNT_LINKS = [
    {
      to: "/profile",
      icon: <FaUser />,
      label: "Profile",
    },
    {
      to: "/settings",
      icon: <FaCog />,
      label: "Settings",
    },
  ];

  /* =========================================
     RENDER
  ========================================= */

  return (
    <>
      {/* =========================================
          MOBILE HAMBURGER
      ========================================= */}

      <button
        className="sidebar-hamburger"
        onClick={() =>
          setMobileOpen((previous) => !previous)
        }
      >
        {mobileOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* =========================================
          MOBILE BACKDROP
      ========================================= */}

      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* =========================================
          MAIN SIDEBAR
      ========================================= */}

      <aside
        className={`sidebar ${
          mobileOpen ? "sidebar-mobile-open" : ""
        }`}
      >

        {/* =========================================
            LOGO
        ========================================= */}

        <div className="sidebar-logo">

          <img
            src="/LifeOS_logo.jpeg"
            className="logo-img"
            alt="LifeOS logo"
          />
           <span className="lifeos-ai-icon">
          <h2 className="logo-text">
            LifeOS
          </h2>
      
    </span>

        </div>

        {/* =========================================
            MAIN MENU
        ========================================= */}

        <div className="sidebar-section">

          <span className="sidebar-section-label">
            Main Menu
          </span>

          {/* =========================================
              NAVIGATION
          ========================================= */}

          {NAV_LINKS.map(
            ({
              to,
              icon,
              label,
              action,
              id,
            }) => {

              /* =====================================
                 AI ACTION ITEM
              ===================================== */

              if (action) {
                return (
                  <button
                    key={id}
                    type="button"
                    className={`menu-box ai-features-trigger ${
                      aiPanelOpen ? "active" : ""
                    }`}
                    onClick={action}
                  >
                    <span className="menu-icon">
                      {icon}
                    </span>

                    <span className="menu-text">
                      {label}
                    </span>
                  </button>
                );
              }

              /* =====================================
                 NORMAL NAVIGATION
              ===================================== */

              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `menu-box ${
                      isActive ? "active" : ""
                    }`
                  }
                >
                  <span className="menu-icon">
                    {icon}
                  </span>

                  <span className="menu-text">
                    {label}
                  </span>
                </NavLink>
              );
            }
          )}

        </div>

        {/* =========================================
            SPACER
        ========================================= */}

        <div className="sidebar-spacer" />

        {/* =========================================
            ACCOUNT
        ========================================= */}

        <div className="sidebar-section">

          <span className="sidebar-section-label">
            Account
          </span>

          {ACCOUNT_LINKS.map(
            ({
              to,
              icon,
              label,
            }) => (
              <NavLink
                key={to}
                to={to}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `menu-box ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <span className="menu-icon">
                  {icon}
                </span>

                <span className="menu-text">
                  {label}
                </span>
              </NavLink>
            )
          )}

        </div>

        {/* =========================================
            USER AREA
        ========================================= */}

        <div
          className="sidebar-user-wrapper"
          ref={menuRef}
        >

          {/* =========================================
              USER POPUP
          ========================================= */}

          {showMenu && (
            <div className="sidebar-popup-menu">

              {/* User information */}

              <div className="sidebar-popup-user-info">

                <div className="sidebar-popup-avatar">

                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="avatar"
                      className="sidebar-popup-avatar-img"
                    />
                  ) : (
                    <span>
                      {initials}
                    </span>
                  )}

                </div>

                <div>

                  <p className="sidebar-popup-name">
                    {user.name}
                  </p>

                  <p className="sidebar-popup-email">
                    {user.email}
                  </p>

                </div>

              </div>

              {/* Divider */}

              <div className="sidebar-popup-divider" />

              {/* Profile */}

              <button
                type="button"
                className="sidebar-popup-item"
                onClick={() => {
                  navigate("/profile");

                  setShowMenu(false);
                  setMobileOpen(false);

                  closeAIPanel();
                }}
              >
                <FaUser size={12} />

                <span>
                  View Profile
                </span>
              </button>

              {/* Settings */}

              <button
                type="button"
                className="sidebar-popup-item"
                onClick={() => {
                  navigate("/settings");

                  setShowMenu(false);
                  setMobileOpen(false);

                  closeAIPanel();
                }}
              >
                <FaCog size={12} />

                <span>
                  Settings
                </span>
              </button>

              {/* Divider */}

              <div className="sidebar-popup-divider" />

              {/* Sign Out */}

              <button
                type="button"
                className="sidebar-popup-item sidebar-popup-signout"
                onClick={handleSignOut}
              >
                <FaSignOutAlt size={12} />

                <span>
                  Sign Out
                </span>
              </button>

            </div>
          )}

          {/* =========================================
              USER ROW
          ========================================= */}

          <div
            className="sidebar-user"
            onClick={() =>
              setShowMenu(
                (previous) => !previous
              )
            }
          >

            {/* Avatar */}

            <div className="sidebar-avatar">

              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="avatar"
                  className="sidebar-avatar-img"
                />
              ) : (
                <span className="sidebar-avatar-initials">
                  {initials}
                </span>
              )}

            </div>

            {/* User information */}

            <div className="sidebar-user-info">

              <p className="sidebar-user-name">
                {user.name}
              </p>

              <p className="sidebar-user-email">
                {user.email}
              </p>

            </div>

            {/* Three dots */}

            <span className="sidebar-user-dots">
              ⋮
            </span>

          </div>

        </div>

      </aside>

      {/* =========================================
          AI FEATURES PANEL
      ========================================= */}

      <AIFeaturesPanel
        isOpen={aiPanelOpen}
        onClose={closeAIPanel}
        focusSection={focusSection}
        tasks={tasks}
        setTasks={setTasks}
      />

    </>
  );
}