import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function GoogleCallback() {

  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get("token");
    const user   = params.get("user");

    if (token && user) {
      try {
        const profile = JSON.parse(user);

        // Clear old session data but preserve rememberMe
        const rememberMe = localStorage.getItem("rememberMe");
        localStorage.clear();
        if (rememberMe) localStorage.setItem("rememberMe", rememberMe);

        // Save new session
        localStorage.setItem("token", token);
        localStorage.setItem("userProfile", JSON.stringify(profile));

        navigate("/dashboard", { replace: true });

      } catch (err) {
        console.error("Failed to parse Google user:", err);
        navigate("/login?error=google_failed", { replace: true });
      }
    } else {
      navigate("/login?error=google_failed", { replace: true });
    }
  }, []);

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#0a0a12",
      color: "white",
      gap: 16
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: "rgba(124,58,237,0.15)",
        border: "2px solid rgba(124,58,237,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26
      }}>
        🔐
      </div>
      <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Signing you in...</p>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
        Please wait while we verify your Google account
      </p>
    </div>
  );
}