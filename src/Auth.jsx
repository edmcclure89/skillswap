import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Auth({ onClose, onShowTerms, refCode }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isStudentEmail = email.toLowerCase().trim().endsWith(".edu");

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (mode === "signup") {
      if (!name.trim()) { setError("Please enter your full name."); return; }
      if (!phone.trim()) { setError("Please enter your phone number."); return; }
      if (!agreedToTerms) { setError("You must agree to the Terms of Service to create an account."); return; }
    }

    setLoading(true);

    if (mode === "signup") {
      // Insert phone into profiles table after signup
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, phone, referred_by: refCode || null, is_student: isStudentEmail } }
      });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        // Save profile with phone and terms agreement
        if (data?.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: name,
            phone: phone.trim(),
            agreed_to_terms: true,
            agreed_at: new Date().toISOString(),
          });
        }
        setSuccess("Check your email to confirm your account!");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else onClose();
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const inputStyle = {
    width: "100%", background: "#0D0D14", border: "1px solid #2a2a35",
    borderRadius: 10, color: "#F0EDE8", padding: "13px 16px", fontSize: 15,
    fontFamily: "inherit", outline: "none", marginTop: 6, boxSizing: "border-box"
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "#13131A", border: "1px solid #2a2a35", borderRadius: 20, padding: 36, maxWidth: 420, width: "100%", position: "relative", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: "#6B6B78", cursor: "pointer", fontSize: 20 }}>✕</button>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⇄</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            {mode === "login" ? "Welcome back" : "Join SkillSwap"}
          </h2>
          <p style={{ color: "#9998A8", fontSize: 14 }}>
            {mode === "login" ? "Log in to your account" : "Create your free account"}
          </p>
        </div>

        <button onClick={handleGoogle} style={{ width: "100%", background: "#fff", border: "none", color: "#0A0A0F", padding: "13px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>G</span> Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "#2a2a35" }} />
          <span style={{ fontSize: 12, color: "#6B6B78" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#2a2a35" }} />
        </div>

        {mode === "signup" && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: "#6B6B78", textTransform: "uppercase", letterSpacing: "0.1em" }}>Full Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
          </div>
        )}

        <div style={{ marginBottom: isStudentEmail && mode === "signup" ? 8 : 14 }}>
          <label style={{ fontSize: 12, color: "#6B6B78", textTransform: "uppercase", letterSpacing: "0.1em" }}>Email *</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" style={{ ...inputStyle, border: isStudentEmail && mode === "signup" ? "1px solid #34D399" : "1px solid #2a2a35" }} />
        </div>

        {isStudentEmail && mode === "signup" && (
          <div style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>🎓</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#34D399" }}>Student email detected!</div>
              <div style={{ fontSize: 12, color: "#9998A8", marginTop: 2 }}>You qualify for Student access at <strong style={{ color: "#34D399" }}>$8.98/mo</strong> — 82% off Pro pricing.</div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: "#6B6B78", textTransform: "uppercase", letterSpacing: "0.1em" }}>Password *</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
        </div>

        {mode === "signup" && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: "#6B6B78", textTransform: "uppercase", letterSpacing: "0.1em" }}>Phone Number *</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
              style={inputStyle}
            />
          </div>
        )}

        {mode === "signup" && (
          <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 12 }}>
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={e => setAgreedToTerms(e.target.checked)}
              style={{ marginTop: 3, cursor: "pointer", accentColor: "#2DD4BF", width: 16, height: 16, flexShrink: 0 }}
            />
            <label htmlFor="terms" style={{ fontSize: 13, color: "#9998A8", lineHeight: 1.6, cursor: "pointer" }}>
              I agree to the{" "}
              <button
                onClick={e => { e.preventDefault(); onShowTerms && onShowTerms(); }}
                style={{ background: "transparent", border: "none", color: "#2DD4BF", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 600, padding: 0 }}
              >
                Terms of Service
              </button>
              {" "}and{" "}
              <button
                onClick={e => { e.preventDefault(); onShowTerms && onShowTerms(); }}
                style={{ background: "transparent", border: "none", color: "#2DD4BF", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 600, padding: 0 }}
              >
                Privacy Policy
              </button>
              . I confirm I am 18 years of age or older.
            </label>
          </div>
        )}

        {!agreedToTerms && mode === "signup" && (
          <div style={{ marginBottom: 16 }} />
        )}

        {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#EF4444", marginBottom: 16 }}>{error}</div>}
        {success && <div style={{ background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#2DD4BF", marginBottom: 16 }}>{success}</div>}

        <button
          onClick={handleSubmit}
          disabled={loading || (mode === "signup" && !agreedToTerms)}
          style={{ width: "100%", background: "#2DD4BF", border: "none", color: "#0A0A0F", padding: "14px", borderRadius: 10, cursor: (loading || (mode === "signup" && !agreedToTerms)) ? "not-allowed" : "pointer", fontSize: 15, fontWeight: 700, fontFamily: "inherit", opacity: (loading || (mode === "signup" && !agreedToTerms)) ? 0.5 : 1 }}
        >
          {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
        </button>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "#9998A8" }}>
          {mode === "login" ? "No account? " : "Already have one? "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSuccess(""); }} style={{ background: "transparent", border: "none", color: "#2DD4BF", cursor: "pointer", fontSize: 14, fontFamily: "inherit", fontWeight: 600 }}>
            {mode === "login" ? "Sign up free" : "Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
