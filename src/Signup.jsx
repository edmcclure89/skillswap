import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Signup() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    city: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.email.trim()) { setError("Email is required"); setLoading(false); return; }
      if (!formData.username.trim()) { setError("Username is required"); setLoading(false); return; }
      if (!formData.first_name.trim()) { setError("First name is required"); setLoading(false); return; }
      if (!formData.last_name.trim()) { setError("Last name is required"); setLoading(false); return; }
      if (!formData.password) { setError("Password is required"); setLoading(false); return; }
      if (formData.password.length < 12) { setError("Password must be at least 12 characters"); setLoading(false); return; }
      if (formData.password !== formData.confirmPassword) { setError("Passwords do not match"); setLoading(false); return; }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: `${formData.first_name} ${formData.last_name}`,
            username: formData.username,
            city: formData.city || null
          }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: `${formData.first_name} ${formData.last_name}`,
          username: formData.username,
          city: formData.city || null,
          email: formData.email
        });
      }

      // Auto-login after signup
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (loginError) {
        window.history.pushState(null, "", "/auth");
        window.dispatchEvent(new PopStateEvent("popstate"));
        return;
      }

      // Redirect home on success
      window.history.pushState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));

    } catch (err) {
      setError(err.message || "Unable to connect. Check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f7", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "40px", maxWidth: "500px", width: "100%", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px", color: "#0A0A0F" }}>Create Account</h1>
        <p style={{ color: "#666", marginBottom: "32px", fontSize: "14px" }}>Join SkillSwap and start trading skills</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#424245", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@email.com" autoComplete="email" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e6e6e6", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#424245", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Username</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Choose a username" autoComplete="username" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e6e6e6", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#424245", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>First Name</label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="First" autoComplete="given-name" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e6e6e6", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#424245", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Last Name</label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Last" autoComplete="family-name" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e6e6e6", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#424245", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>City (Optional)</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Your city" autoComplete="address-level2" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e6e6e6", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#424245", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="At least 12 characters" autoComplete="new-password" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e6e6e6", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }} />
            {formData.password && formData.password.length < 12 && (
              <p style={{ fontSize: "11px", color: "#dc2626", marginTop: "4px" }}>{formData.password.length}/12 characters minimum</p>
            )}
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#424245", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Confirm Password</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat your password" autoComplete="new-password" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: formData.confirmPassword && formData.password !== formData.confirmPassword ? "1px solid #fca5a5" : "1px solid #e6e6e6", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }} />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p style={{ fontSize: "11px", color: "#dc2626", marginTop: "4px" }}>Passwords do not match</p>
            )}
          </div>

          {error && <div style={{ backgroundColor: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "12px", marginBottom: "16px", fontSize: "13px", color: "#dc2626" }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ width: "100%", backgroundColor: "#0066cc", color: "white", padding: "14px", borderRadius: "8px", border: "none", fontSize: "14px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "inherit" }}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "#666" }}>
            Already have an account?{" "}
            <a
              href="/auth"
              onClick={(e) => { e.preventDefault(); window.history.pushState(null, "", "/auth"); window.dispatchEvent(new PopStateEvent("popstate")); }}
              style={{ color: "#0066cc", textDecoration: "none", fontWeight: "600", cursor: "pointer" }}
            >
              Log in
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
