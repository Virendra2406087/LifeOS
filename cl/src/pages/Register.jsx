import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";

export default function Register() {

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [strength, setStrength] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const checkStrength = (pass) => {
    if (pass.length < 6)                                      setStrength("weak");
    else if (pass.match(/[A-Z]/) && pass.match(/[0-9]/))     setStrength("strong");
    else                                                      setStrength("medium");
  };

  const strengthLabel = { weak: "Weak", medium: "Medium", strong: "Strong" };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (strength === "weak") {
      setError("Password is too weak — use at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        name, email, password
      });

      alert("Registration successful! Please log in.");
      window.location.href = "/login";

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.open("http://localhost:5000/api/auth/google", "_self");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <div style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Create Account</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
            Start managing your life with LifeOS
          </p>
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
            color: "#f87171"
          }}>
            {error}
          </div>
        )}

        <input
          placeholder="Full name"
          value={name}
          onChange={e => setName(e.target.value)}
          autoComplete="name"
        />

        <input
          placeholder="Email address"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => { setPassword(e.target.value); checkStrength(e.target.value); }}
          autoComplete="new-password"
        />

        {password && (
          <div className={`password-strength ${strength}`}>
            Password strength: {strengthLabel[strength]}
          </div>
        )}

        <button
          className="register-btn"
          onClick={handleRegister}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <div className="divider">OR</div>

        <button className="google-btn" onClick={handleGoogleLogin}>
          <FcGoogle size={18} /> Continue with Google
        </button>

        <p className="switch-auth">
          Already have an account? <a href="/login">Sign in</a>
        </p>

      </div>
    </div>
  );
}