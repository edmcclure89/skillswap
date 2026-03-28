import { useState } from "react";
import { supabase } from "./supabaseClient";

const SKILL_CATEGORIES = ["Finance", "Design", "Health", "Education", "Tech", "Home", "Marketing", "Writing", "Music", "Other"];

export default function PostSkill({ user, onClose, onPosted }) {
  const [offering, setOffering] = useState("");
  const [wanting, setWanting] = useState("");
  const [category, setCategory] = useState("Tech");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePost = async () => {
    if (!offering.trim() || !wanting.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    setLoading(true);
    setError("");

    const { error } = await supabase.from("listings").insert({
      user_id: user.id,
      user_name: user.user_metadata?.full_name || user.email.split("@")[0],
      offering: offering.trim(),
      wanting: wanting.trim(),
      category,
      bio: bio.trim(),
    });

    if (error) setError(error.message);
    else { onPosted(); onClose(); }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", background: "#0D0D14", border: "1px solid #2a2a35",
    borderRadius: 10, color: "#F0EDE8", padding: "13px 16px", fontSize: 15,
    fontFamily: "inherit", outline: "none", marginTop: 6, boxSizing: "border-box"
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "#13131A", border: "1px solid #2a2a35", borderRadius: 20, padding: 36, maxWidth: 460, width: "100%", position: "relative" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: "#6B6B78", cursor: "pointer", fontSize: 20 }}>✕</button>

        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Post Your Skill</h2>
        <p style={{ color: "#9998A8", fontSize: 14, marginBottom: 24 }}>Tell the community what you offer and what you need.</p>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: "#6B6B78", textTransform: "uppercase", letterSpacing: "0.1em" }}>I am offering</label>
          <input value={offering} onChange={e => setOffering(e.target.value)} placeholder="e.g. Tax preparation, Logo design, Spanish lessons" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: "#6B6B78", textTransform: "uppercase", letterSpacing: "0.1em" }}>I am looking for</label>
          <input value={wanting} onChange={e => setWanting(e.target.value)} placeholder="e.g. Web design, Photography, Coding lessons" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: "#6B6B78", textTransform: "uppercase", letterSpacing: "0.1em" }}>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: "#6B6B78", textTransform: "uppercase", letterSpacing: "0.1em" }}>Short Bio (optional)</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="A sentence or two about your experience..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#EF4444", marginBottom: 16 }}>{error}</div>}

        <button onClick={handlePost} disabled={loading} style={{ width: "100%", background: "#2DD4BF", border: "none", color: "#0A0A0F", padding: "14px", borderRadius: 10, cursor: loading ? "not-allowed" : "pointer", fontSize: 15, fontWeight: 700, fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Posting..." : "Post My Skill"}
        </button>
      </div>
    </div>
  );
}
