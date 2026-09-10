import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSignUp } from "@clerk/react";
import { FcGoogle } from "react-icons/fc";

export default function Register() {
  const { signUp, fetchStatus } = useSignUp();
  const navigate = useNavigate();

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [strength, setStrength] = useState("");
  const [error, setError]       = useState("");
  const [code, setCode]         = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);

  const loading = fetchStatus === "fetching";

  const checkStrength = (pass) => {
    if (pass.length < 6)                                      setStrength("weak");
    else if (pass.match(/[A-Z]/) && pass.match(/[0-9]/))     setStrength("strong");
    else                                                      setStrength("medium");
  };

  const strengthLabel = { weak: "Weak", medium: "Medium", strong: "Strong" };

  const finalizeSignUp = async () => {
    await signUp.finalize({
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

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (strength === "weak") {
      setError("Password is too weak — use at least 6 characters");
      return;
    }
    setError("");

    const { error } = await signUp.password({ emailAddress: email, password });

    if (error) {
      console.error(error);
      setError(error.message || "Registration failed");
      return;
    }

    await signUp.verifications.sendEmailCode();
    setPendingVerification(true);
  };

  const handleVerify = async () => {
    if (!code) return;
    setError("");

    await signUp.verifications.verifyEmailCode({ code });

    if (signUp.status === "complete") {
      await finalizeSignUp();
      return;
    }

    if (signUp.status === "missing_requirements" && signUp.missingFields?.length) {
      const [firstName, ...rest] = name.trim().split(" ");
      await signUp.update({ firstName, lastName: rest.join(" ") || undefined });

      if (signUp.status === "complete") {
        await finalizeSignUp();
      } else {
        setError("A few more details are needed to finish creating your account.");
      }
      return;
    }

    console.error("Sign-up attempt not complete:", signUp);
    setError("Verification incomplete. Please check the code and try again.");
  };

  const handleGoogleLogin = async () => {
    setError("");

    const { error } = await signUp.sso({
      strategy: "oauth_google",
      redirectCallbackUrl: "/sso-callback",
      redirectUrl: "/dashboard",
    });

    if (error) {
      console.error("Google sign-up failed:", error);
      setError(error.message || "Google sign-up failed.");
    }
  };

  if (pendingVerification) {
    return (
      <div className="auth-container">
        <div className="auth-card">

          <div style={{ marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>Verify your email</h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
              Enter the code we sent to {email}
            </p>
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 8, padding: "10px 14px",
              fontSize: 13, color: "#f87171"
            }}>
              {error}
            </div>
          )}

          <input
            placeholder="Verification code"
            value={code}
            onChange={e => setCode(e.target.value)}
            autoComplete="one-time-code"
          />

          <button className="register-btn" onClick={handleVerify} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? "Verifying..." : "Verify Email"}
          </button>

          <button
            className="google-btn"
            onClick={() => signUp.verifications.sendEmailCode()}
            style={{ marginTop: 8 }}
          >
            Resend code
          </button>

        </div>
      </div>
    );
  }

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

        <button className="register-btn" onClick={handleRegister} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <div className="divider">OR</div>

        <button className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
          <FcGoogle size={18} /> Continue with Google
        </button>

        <p className="switch-auth">
          Already have an account? <a href="/login">Sign in</a>
        </p>

        {/* Clerk's bot sign-up protection mounts its CAPTCHA here */}
        <div id="clerk-captcha" />

      </div>
    </div>
  );
}