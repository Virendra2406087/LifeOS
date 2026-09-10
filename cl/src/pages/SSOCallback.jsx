import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useClerk, useSignIn, useSignUp } from "@clerk/react";

export default function SSOCallback() {
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const navigate = useNavigate();
  const hasRun = useRef(false);

  const navigateToSignIn = () => navigate("/login");

  const goHome = async ({ session, decorateUrl }) => {
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
  };

  const finalizeSignIn = async () => { await signIn.finalize({ navigate: goHome }); };
  const finalizeSignUp = async () => { await signUp.finalize({ navigate: goHome }); };

  useEffect(() => {
    (async () => {
      if (!clerk.loaded || hasRun.current) return;
      hasRun.current = true;

      if (signIn.status === "complete") {
        await finalizeSignIn();
        return;
      }

      if (signUp.isTransferable) {
        await signIn.create({ transfer: true });
        if (signIn.status === "complete") {
          await finalizeSignIn();
          return;
        }
        return navigateToSignIn();
      }

      if (
        signIn.status === "needs_first_factor" &&
        !signIn.supportedFirstFactors?.every((f) => f.strategy === "enterprise_sso")
      ) {
        return navigateToSignIn();
      }

      if (signIn.isTransferable) {
        await signUp.create({ transfer: true });
        if (signUp.status === "complete") {
          await finalizeSignUp();
          return;
        }
        return navigate("/register");
      }

      if (signUp.status === "complete") {
        await finalizeSignUp();
        return;
      }

      if (signIn.status === "needs_second_factor" || signIn.status === "needs_new_password") {
        return navigateToSignIn();
      }

      if (signIn.existingSession || signUp.existingSession) {
        const sessionId = signIn.existingSession?.sessionId || signUp.existingSession?.sessionId;
        if (sessionId) {
          await clerk.setActive({ session: sessionId, navigate: goHome });
        }
      }
    })();
  }, [clerk, signIn, signUp]);

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <p>Completing sign-in...</p>
        <div id="clerk-captcha"></div>
      </div>
    </div>
  );
}