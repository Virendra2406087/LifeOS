import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";
import { ClerkProvider } from '@clerk/react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in your .env file");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <App />
  </ClerkProvider>
);