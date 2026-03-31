import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Signup() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    city: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    setSuccess("");
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.email.trim()) {
        setError("Email is required");
        setLoading(false);
        return;
      }
      if (!formData.username.trim()) {
        setError("Username is required");
        setLoading(false);
        return;
      }
      if (!formData.first_name.trim()) {
        setError("First name is required");
        setLoading(false);
        return;
      }
      if (!formData.last_name.trim()) {
        setError("Last name is required");
        setLoading(false);
        return;
      }

      // Create account with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.username, // Using username as password for now
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
      } else {
        // Save profile data
        if (data?.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: `${formData.first_name} ${formData.last_name}`,
            username: formData.username,
            city: formData.city || null
          });
        }
        setSuccess("Account created! Check your email to confirm.");
        setFormData({ email: "", username: "", first_name: "", last_name: "", city: "" });
      }
    } catch (err) {
      setError(err.message || "An error occurred");
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
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@email.com"
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e6e6e6", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#424245", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e6e6e6", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#424245", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="First"
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e6e6e6", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#424245", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Last"
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e6e6e6", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#424245", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>City (Optional)</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Your city"
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e6e6e6", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>

          {error && (
            <div style={{ backgroundColor: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "12px", marginBottom: "16px", fontSize: "13px", color: "#dc2626" }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ backgroundColor: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: "8px", padding: "12px", marginBottom: "16px", fontSize: "13px", color: "#047857" }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              backgroundColor: "#0066cc",
              color: "white",
              padding: "14px",
              borderRadius: "8px",
              border: "none",
              fontSize: "14px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontFamily: "inherit"
            }}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "#666" }}>
            Already have an account? <a href="/auth" style={{ color: "#0066cc", textDecoration: "none", fontWeight: "600", cursor: "pointer" }}>Log in</a>
          </p>
        </form>
      </div>
    </div>
  );
}
