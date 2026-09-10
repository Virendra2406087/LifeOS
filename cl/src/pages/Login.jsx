import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSignIn } from "@clerk/react";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
  const { signIn, fetchStatus } = useSignIn();
  const navigate = useNavigate();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError]       = useState("");

  const loading = fetchStatus === "fetching";

  const finalizeSignIn = async () => {
    await signIn.finalize({
      navigate: async ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          console.log(session.currentTask);
          return;
        }
        const url = decorateUrl("/dashboard");
        if (url.startsWith("http")) {
          window.location.href = url;
        } else {
          navigate(url);
        }
      },
    });
  };

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setError("");

    const { error } = await signIn.password({ emailAddress: email, password });

    if (error) {
      console.error(error);
      setError(error.message || "Login failed. Check your credentials.");
      return;
    }

    if (signIn.status === "complete") {
      await finalizeSignIn();
    } else if (signIn.status === "needs_second_factor") {
      setError("This account requires additional verification (MFA).");
    } else if (signIn.status === "needs_client_trust") {
      setError("This device needs to be verified. Check your email for a code.");
    } else {
      console.error("Sign-in attempt not complete:", signIn);
      setError("Couldn't complete sign-in. Please try again.");
    }
  };

  const handleGoogleLogin = async () => {
    setError("");

    const { error } = await signIn.sso({
      strategy: "oauth_google",
      redirectCallbackUrl: "/sso-callback",
      redirectUrl: "/dashboard",
    });

    if (error) {
      console.error("Google sign-in failed:", error);
      setError(error.message || "Google sign-in failed.");
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleLogin(); };
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

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            id="remember"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
            style={{ width: 15, height: 15, accentColor: "#7c3aed", cursor: "pointer" }}
          />
          <label htmlFor="remember" style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", cursor: "pointer" }}>
            Remember me for 30 days
          </label>
        </div>

        <button className="register-btn" onClick={handleLogin} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div className="divider">OR</div>

        <button className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
          <FcGoogle size={18} /> Continue with Google
        </button>

        <p className="switch-auth">
          Don't have an account? <a href="/register">Register</a>
        </p>

      </div>
    </div>
  );
}