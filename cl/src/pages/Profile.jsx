import { useState, useEffect } from "react";

export default function Profile({ tasks = [] }) {

  const [editMode, setEditMode] = useState(false);

  const [user, setUser] = useState({
    name: "Virendra Kumar",
    email: "virendra@email.com",
    role: "Active Learner",
    plan: "Free Plan",
    memberSince: "April 2026",
    avatar: null,
  });

  useEffect(() => {
    const saved = localStorage.getItem("userProfile");
    if (saved) setUser(prev => ({ ...prev, ...JSON.parse(saved) }));
  }, []);

  const initials = user.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSave = () => {
    localStorage.setItem("userProfile", JSON.stringify(user));
    setEditMode(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setUser({ ...user, avatar: URL.createObjectURL(file) });
  };

  const tasksCreated = tasks.length;

  return (
    <div style={{ color: "white" }}>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>My Profile</h1>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginBottom: 28 }}>
        Manage your personal information
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, alignItems: "start" }}>

        {/* ── Left card ── */}
        <div className="profile-left-card">

          {/* Avatar */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <label style={{ cursor: "pointer", display: "inline-block" }}>
              {user.avatar
                ? <img src={user.avatar} alt="avatar" className="profile-avatar" />
                : <div className="profile-initials-avatar">{initials}</div>
              }
              <input type="file" accept="image/*" onChange={handleImageChange} hidden />
            </label>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "14px 0 4px" }}>{user.name}</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>{user.email}</p>
            <span className="profile-role-badge">⚡ {user.role}</span>
          </div>

          {/* Single stat — Tasks Created */}
          <div className="profile-stats">
            <div className="profile-stat-row">
              <span className="profile-stat-label">Tasks Created</span>
              <span className="profile-stat-val">{tasksCreated}</span>
            </div>
          </div>

        </div>

        {/* ── Right card ── */}
        <div className="profile-right-card">

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Personal Information</h2>
            {!editMode
              ? <button className="profile-edit-btn" onClick={() => setEditMode(true)}>✏️ Edit</button>
              : (
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
                  <button className="profile-edit-btn" onClick={handleSave}>Save</button>
                </div>
              )
            }
          </div>

          <div className="profile-fields-grid">

            <div className="profile-field">
              <label>FULL NAME</label>
              {editMode
                ? <input value={user.name} onChange={e => setUser({...user, name: e.target.value})} className="profile-input" />
                : <div className="profile-field-value">{user.name}</div>
              }
            </div>

            <div className="profile-field">
              <label>EMAIL ADDRESS</label>
              {editMode
                ? <input value={user.email} onChange={e => setUser({...user, email: e.target.value})} className="profile-input" />
                : <div className="profile-field-value">{user.email}</div>
              }
            </div>

            <div className="profile-field">
              <label>MEMBER SINCE</label>
              <div className="profile-field-value">{user.memberSince}</div>
            </div>

            <div className="profile-field">
              <label>ACCOUNT TYPE</label>
              <div className="profile-field-value">{user.plan}</div>
            </div>

          </div>

          {/* Achievements */}
          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", letterSpacing: 1, marginBottom: 16 }}>
              🏆 ACHIEVEMENTS
            </h3>
            <div className="profile-achievements-empty">
              <div style={{ fontSize: 36, marginBottom: 10 }}>🎯</div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>No achievements yet</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
                Add tasks and complete them daily to earn badges
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}