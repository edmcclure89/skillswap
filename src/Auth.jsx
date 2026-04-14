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
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      setError(loginError.message);
      alert("Oops! " + loginError.message);
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(signUpError.message);
      alert("Oops! " + signUpError.message);
    } else {
      alert("Check your email for a magic link!");
    }
    setLoading(false);
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
        >X</button>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#333", marginBottom: 8 }}>Welcome to SkillSwap</h1>
        <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Sign in or create an account to start swapping</p>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", width: "100%", margin: "10px auto", padding: "12px 16px", border: "1px solid #ddd", borderRadius: 8, fontSize: 15, boxSizing: "border-box" }}
          />
          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: "100%", margin: "10px auto", padding: "12px 16px", border: "1px solid #ddd", borderRadius: 8, fontSize: 15, boxSizing: "border-box" }}
          />
          <button disabled={loading} style={{ width: "100%", padding: "12px 20px", background: "#0066cc", color: "white", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", marginTop: 8 }}>
            {loading ? "Loading..." : "Log In"}
          </button>
          <button onClick={handleSignUp} type="button" disabled={loading} style={{ width: "100%", marginTop: 10, padding: "12px 20px", background: "transparent", border: "1px solid #ddd", borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", color: "#333" }}>
            Sign Up
          </button>
        </form>
        {error && <p style={{ color: "red", marginTop: 16, fontSize: 14 }}>{error}</p>}
      </div>
    </div>
  );
}
