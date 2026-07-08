import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  FaHome, FaChartBar, FaTasks, FaHistory,
  FaCog, FaUser, FaSignOutAlt
} from "react-icons/fa";

export default function Sidebar() {

  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("userProfile")) || {
    name: "Virendra Kumar",
    email: "virendra@email.com",
    avatar: null
  };

  const initials = user.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userProfile");
    navigate("/login");
  };

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="sidebar">

      {/* Logo */}
      <div className="sidebar-logo">
        <img src="/LifeOS_logo.jpeg" className="logo-img" alt="logo" />
        <h2 className="logo-text">LifeOS</h2>
      </div>

      {/* Main Menu */}
      <div className="sidebar-section">
        <span className="sidebar-section-label">Main Menu</span>

        <NavLink to="/dashboard" className={({ isActive }) => `menu-box ${isActive ? "active" : ""}`}>
          <FaHome className="menu-icon" />
          <span className="menu-text">Dashboard</span>
        </NavLink>

        <NavLink to="/analytics" className={({ isActive }) => `menu-box ${isActive ? "active" : ""}`}>
          <FaChartBar className="menu-icon" />
          <span className="menu-text">Analytics</span>
        </NavLink>

        <NavLink to="/tasks" className={({ isActive }) => `menu-box ${isActive ? "active" : ""}`}>
          <FaTasks className="menu-icon" />
          <span className="menu-text">Tasks</span>
        </NavLink>

        <NavLink to="/history" className={({ isActive }) => `menu-box ${isActive ? "active" : ""}`}>
          <FaHistory className="menu-icon" />
          <span className="menu-text">History</span>
        </NavLink>
      </div>

      <div style={{ flex: 1 }} />

      {/* Account */}
      <div className="sidebar-section">
        <span className="sidebar-section-label">Account</span>

        <NavLink to="/profile" className={({ isActive }) => `menu-box ${isActive ? "active" : ""}`}>
          <FaUser className="menu-icon" />
          <span className="menu-text">Profile</span>
        </NavLink>

        <NavLink to="/settings" className={({ isActive }) => `menu-box ${isActive ? "active" : ""}`}>
          <FaCog className="menu-icon" />
          <span className="menu-text">Settings</span>
        </NavLink>
      </div>

      {/* User row — clicking anywhere on it toggles sign out popup */}
      <div className="sidebar-user-wrapper" ref={menuRef}>

        {/* Sign out popup above user row */}
        {showMenu && (
          <div className="sidebar-popup-menu">
            <div className="sidebar-popup-user-info">
              <div className="sidebar-popup-avatar">
                {user.avatar
                  ? <img src={user.avatar} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  : <span>{initials}</span>
                }
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: "white", margin: 0 }}>{user.name}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>{user.email}</p>
              </div>
            </div>

            <div className="sidebar-popup-divider" />

            <button
              className="sidebar-popup-item"
              onClick={() => { navigate("/profile"); setShowMenu(false); }}
            >
              <FaUser size={12} /> View Profile
            </button>

            <button
              className="sidebar-popup-item"
              onClick={() => { navigate("/settings"); setShowMenu(false); }}
            >
              <FaCog size={12} /> Settings
            </button>

            <div className="sidebar-popup-divider" />

            <button
              className="sidebar-popup-item sidebar-popup-signout"
              onClick={handleSignOut}
            >
              <FaSignOutAlt size={12} /> Sign Out
            </button>
          </div>
        )}

        {/* Clicking the whole user row opens the menu */}
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
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 16, paddingRight: 2 }}>⋮</span>
        </div>

      </div>

    </div>
  );
}