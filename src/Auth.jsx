import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Auth() {
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
      alert("❌ Oops! " + loginError.message);
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
      alert("❌ Oops! " + signUpError.message);
    } else {
      alert("✅ Check your email for a magic link!");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>Welcome to SkillSwap</h1>
      <form onSubmit={handleLogin}>
        <input 
          type="email" 
          placeholder="Your email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          style={{ display: "block", margin: "10px auto", padding: "10px" }}
        />
        <input 
          type="password" 
          placeholder="Your password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          style={{ display: "block", margin: "10px auto", padding: "10px" }}
        />
        <button disabled={loading} style={{ padding: "10px 20px", background: "#0070f3", color: "white", border: "none", borderRadius: "5px" }}>
          {loading ? "Loading..." : "Log In"}
        </button>
        <button onClick={handleSignUp} disabled={loading} style={{ marginLeft: "10px", padding: "10px 20px" }}>
          Sign Up
        </button>
      </form>
      {error && <p style={{ color: "red", marginTop: "20px" }}>{error}</p>}
    </div>
  );
}