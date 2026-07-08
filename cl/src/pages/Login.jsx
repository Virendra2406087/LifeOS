import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";

export default function Login() {

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields"); return; }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email, password, remember
      });

      const { token, user } = res.data;

      localStorage.clear();
      localStorage.setItem("token", token);
      localStorage.setItem("userProfile", JSON.stringify({
        name:        user.name,
        email:       user.email,
        role:        "Active Learner",
        plan:        "Free Plan",
        memberSince: user.memberSince,
        avatar:      user.avatar || null,
      }));

      // Store remember preference
      if (remember) localStorage.setItem("rememberMe", "true");

      window.location.href = "/dashboard";

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleLogin(); };

  /* Check URL for Google error */
  const urlError = new URLSearchParams(window.location.search).get("error");

  return (
    <div className="auth-container">
      <div className="auth-card">

        <div style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Welcome back</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
            Sign in to your LifeOS account
          </p>
        </div>

        {/* Error message */}
        {(error || urlError) && (
          <div style={{
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, padding: "10px 14px",
            fontSize: 13, color: "#f87171"
          }}>
            {error || (urlError === "google_failed" ? "Google sign-in failed. Please try again." : urlError)}
          </div>
        )}

        <input
          placeholder="Email address"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="email"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="current-password"
        />

        {/* Remember me */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            id="remember"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
            style={{ width: 15, height: 15, accentColor: "#7c3aed", cursor: "pointer" }}
          />
          <label htmlFor="remember" style={{
            fontSize: 13, color: "rgba(255,255,255,0.55)", cursor: "pointer"
          }}>
            Remember me for 30 days
          </label>
        </div>

        <button
          className="register-btn"
          onClick={handleLogin}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div className="divider">OR</div>

        <button className="google-btn" onClick={handleGoogleLogin}>
          <FcGoogle size={18} /> Continue with Google
        </button>

        <p className="switch-auth">
          Don't have an account? <a href="/register">Register</a>
        </p>

      </div>
    </div>
  );
}