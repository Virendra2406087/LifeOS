import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  FaHome, FaChartBar, FaTasks, FaHistory,
  FaCog, FaUser, FaSignOutAlt, FaBars, FaTimes
} from "react-icons/fa";

export default function Sidebar() {

  const navigate  = useNavigate();
  const [showMenu,    setShowMenu]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const menuRef   = useRef(null);

  const user = JSON.parse(localStorage.getItem("userProfile")) || {
    name: "Virendra Kumar", email: "virendra@email.com", avatar: null
  };

  const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userProfile");
    navigate("/login");
  };

  // Close popup on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile sidebar on route change
  const handleNavClick = () => setMobileOpen(false);

  const NAV_LINKS = [
    { to: "/dashboard",  icon: <FaHome />,     label: "Dashboard"  },
    { to: "/analytics",  icon: <FaChartBar />, label: "Analytics"  },
    { to: "/tasks",      icon: <FaTasks />,    label: "Tasks"      },
    { to: "/history",    icon: <FaHistory />,  label: "History"    },
  ];

  const ACCOUNT_LINKS = [
    { to: "/profile",  icon: <FaUser />, label: "Profile"  },
    { to: "/settings", icon: <FaCog />,  label: "Settings" },
  ];

  return (
    <>
      {/* ── Mobile hamburger button (only shows on small screens) ── */}
      <button
        onClick={() => setMobileOpen(o => !o)}
        style={{
          display:      "none",
          position:     "fixed",
          top:          14,
          left:         16,
          zIndex:       300,
          width:        38,
          height:       38,
          borderRadius: 10,
          border:       "1px solid rgba(255,255,255,0.12)",
          background:   "rgba(13,13,26,0.95)",
          color:        "white",
          fontSize:     16,
          cursor:       "pointer",
          alignItems:   "center",
          justifyContent: "center",
        }}
        className="sidebar-hamburger"
      >
        {mobileOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            display:    "none",
            position:   "fixed",
            inset:      0,
            background: "rgba(0,0,0,0.6)",
            zIndex:     199,
          }}
          className="sidebar-backdrop"
        />
      )}

      {/* ── Sidebar ── */}
      <div
        className={`sidebar ${mobileOpen ? "sidebar-mobile-open" : ""}`}
        style={{ zIndex: 200 }}
      >

        {/* Logo */}
        <div className="sidebar-logo">
          <img src="/LifeOS_logo.jpeg" className="logo-img" alt="logo" />
          <h2 className="logo-text">LifeOS</h2>
        </div>

        {/* Main Menu */}
        <div className="sidebar-section">
          <span className="sidebar-section-label">Main Menu</span>
          {NAV_LINKS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={handleNavClick}
              className={({ isActive }) => `menu-box ${isActive ? "active" : ""}`}
            >
              <span className="menu-icon">{icon}</span>
              <span className="menu-text">{label}</span>
            </NavLink>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Account */}
        <div className="sidebar-section">
          <span className="sidebar-section-label">Account</span>
          {ACCOUNT_LINKS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={handleNavClick}
              className={({ isActive }) => `menu-box ${isActive ? "active" : ""}`}
            >
              <span className="menu-icon">{icon}</span>
              <span className="menu-text">{label}</span>
            </NavLink>
          ))}
        </div>

        {/* User row */}
        <div className="sidebar-user-wrapper" ref={menuRef}>

          {showMenu && (
            <div className="sidebar-popup-menu">
              <div className="sidebar-popup-user-info">
                <div className="sidebar-popup-avatar">
                  {user.avatar
                    ? <img src={user.avatar} alt="avatar" style={{ width:"100%", height:"100%", borderRadius:"50%", objectFit:"cover" }} />
                    : <span>{initials}</span>
                  }
                </div>
                <div>
                  <p style={{ fontWeight:600, fontSize:13, color:"white", margin:0 }}>{user.name}</p>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:0 }}>{user.email}</p>
                </div>
              </div>

              <div className="sidebar-popup-divider" />

              <button className="sidebar-popup-item" onClick={() => { navigate("/profile"); setShowMenu(false); setMobileOpen(false); }}>
                <FaUser size={12} /> View Profile
              </button>
              <button className="sidebar-popup-item" onClick={() => { navigate("/settings"); setShowMenu(false); setMobileOpen(false); }}>
                <FaCog size={12} /> Settings
              </button>

              <div className="sidebar-popup-divider" />

              <button className="sidebar-popup-item sidebar-popup-signout" onClick={handleSignOut}>
                <FaSignOutAlt size={12} /> Sign Out
              </button>
            </div>
          )}

          <div
            className="sidebar-user"
            onClick={() => setShowMenu(p => !p)}
            style={{ cursor: "pointer" }}
          >
            <div className="sidebar-avatar">
              {user.avatar
                ? <img src={user.avatar} alt="avatar" className="sidebar-avatar-img" />
                : <span className="sidebar-avatar-initials">{initials}</span>
              }
            </div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{user.name}</p>
              <p className="sidebar-user-email">{user.email}</p>
            </div>
            <span style={{ color:"rgba(255,255,255,0.3)", fontSize:16, paddingRight:2 }}>⋮</span>
          </div>

        </div>
      </div>

      {/* ── Responsive CSS ── */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar-hamburger {
            display: flex !important;
          }
          .sidebar-backdrop {
            display: block !important;
          }
          .sidebar {
            position: fixed !important;
            top: 0;
            left: 0;
            height: 100vh;
            transform: translateX(-100%);
            transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
            z-index: 200;
            box-shadow: 4px 0 32px rgba(0,0,0,0.5);
          }
          .sidebar.sidebar-mobile-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}