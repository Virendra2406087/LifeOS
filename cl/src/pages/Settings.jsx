import { useState, useEffect } from "react";

export default function Settings() {

  const [activeTab, setActiveTab] = useState("account");

  const [name, setName]       = useState("Virendra Kumar");
  const [email, setEmail]     = useState("virendra@email.com");
  const [plan]                = useState("Free Plan");
  const [since]               = useState("April 2026");

  const [currentPwd, setCurrentPwd]   = useState("");
  const [newPwd, setNewPwd]           = useState("");
  const [confirmPwd, setConfirmPwd]   = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("userProfile");
    if (saved) {
      const u = JSON.parse(saved);
      if (u.name)  setName(u.name);
      if (u.email) setEmail(u.email);
    }
  }, []);

  const handleSaveAccount = () => {
    const saved = JSON.parse(localStorage.getItem("userProfile") || "{}");
    localStorage.setItem("userProfile", JSON.stringify({ ...saved, name, email }));
    alert("Account updated ✅");
  };

  const handleSavePassword = () => {
    if (!currentPwd) { alert("Enter your current password"); return; }
    if (newPwd.length < 6) { alert("New password must be at least 6 characters"); return; }
    if (newPwd !== confirmPwd) { alert("Passwords don't match"); return; }
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    alert("Password updated ✅");
  };

  return (
    <div style={{ color: "white" }}>

      {/* Page title */}
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Settings</h1>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginBottom: 28 }}>
        Manage your account preferences
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, alignItems: "start" }}>

        {/* ── Tabs ── */}
        <div className="settings-tabs-card">
          <button
            className={`settings-tab-btn ${activeTab === "account" ? "active" : ""}`}
            onClick={() => setActiveTab("account")}
          >
            👤 Account
          </button>
          <button
            className={`settings-tab-btn ${activeTab === "password" ? "active" : ""}`}
            onClick={() => setActiveTab("password")}
          >
            🔒 Password
          </button>
        </div>

        {/* ── Content ── */}
        <div className="settings-content-card">

          {activeTab === "account" && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Account Settings</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 28 }}>
                Update your display name and email address
              </p>

              <div className="settings-fields-grid">

                <div className="settings-field">
                  <label>DISPLAY NAME</label>
                  <input
                    className="settings-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className="settings-field">
                  <label>EMAIL ADDRESS</label>
                  <input
                    className="settings-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Your email"
                  />
                </div>

                <div className="settings-field">
                  <label>ACCOUNT TYPE</label>
                  <input className="settings-input" value={plan} readOnly style={{ opacity: 0.5 }} />
                </div>

                <div className="settings-field">
                  <label>MEMBER SINCE</label>
                  <input className="settings-input" value={since} readOnly style={{ opacity: 0.5 }} />
                </div>

              </div>

              <button className="settings-save-btn" onClick={handleSaveAccount}>
                💾 Save Changes
              </button>
            </>
          )}

          {activeTab === "password" && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Change Password</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 28 }}>
                Update your password to keep your account secure
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>

                <div className="settings-field">
                  <label>CURRENT PASSWORD</label>
                  <input
                    className="settings-input"
                    type="password"
                    value={currentPwd}
                    onChange={e => setCurrentPwd(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="settings-field">
                  <label>NEW PASSWORD</label>
                  <input
                    className="settings-input"
                    type="password"
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="settings-field">
                  <label>CONFIRM NEW PASSWORD</label>
                  <input
                    className="settings-input"
                    type="password"
                    value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>

              </div>

              <button className="settings-save-btn" style={{ marginTop: 24 }} onClick={handleSavePassword}>
                🔒 Update Password
              </button>
            </>
          )}

        </div>

      </div>

    </div>
  );
}