import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Auth({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        setError(loginError.message);
      } else {
        if (onClose) onClose();
        window.history.pushState(null, "", "/");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    } catch (err) {
      setError(err.message || "Unable to connect. Check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpClick = (e) => {
    e.preventDefault();
    if (onClose) onClose();
    window.history.pushState(null, "", "/signup");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: 20, padding: 40, maxWidth: 420, width: "100%", position: "relative", textAlign: "center" }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: "#999", cursor: "pointer", fontSize: 22 }}
        >&#x2715;</button>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#333", marginBottom: 8 }}>Welcome to SkillSwap</h1>
        <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Sign in to your account</p>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            style={{ display: "block", width: "100%", margin: "10px auto", padding: "12px 16px", border: "1px solid #ddd", borderRadius: 8, fontSize: 15, boxSizing: "border-box" }}
          />
          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            style={{ display: "block", width: "100%", margin: "10px auto", padding: "12px 16px", border: "1px solid #ddd", borderRadius: 8, fontSize: 15, boxSizing: "border-box" }}
          />
          {error && (
            <div style={{ backgroundColor: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#dc2626", textAlign: "left" }}>
              {error}
            </div>
          )}
          <button disabled={loading} type="submit" style={{ width: "100%", padding: "12px 20px", background: loading ? "#80aee0" : "#0066cc", color: "white", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", marginTop: 8 }}>
            {loading ? "Logging in..." : "Log In"}
          </button>
          <button onClick={handleSignUpClick} type="button" disabled={loading} style={{ width: "100%", marginTop: 10, padding: "12px 20px", background: "transparent", border: "1px solid #ddd", borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", color: "#333" }}>
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}
