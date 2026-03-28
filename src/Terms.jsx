export default function Terms({ onClose }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}
    >
      <div
        style={{ background: "#13131A", border: "1px solid #2a2a35", borderRadius: 20, padding: 40, maxWidth: 620, width: "100%", position: "relative", maxHeight: "85vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: "#6B6B78", cursor: "pointer", fontSize: 20 }}>✕</button>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⇄</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Terms of Service &amp; Privacy Policy</h2>
          <p style={{ color: "#9998A8", fontSize: 13 }}>Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>

        <div style={{ fontSize: 14, color: "#C0BDB8", lineHeight: 1.8 }}>

          <Section title="1. Acceptance of Terms">
            By creating an account on SkillSwap, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use this platform. You must be at least 18 years old to use SkillSwap.
          </Section>

          <Section title="2. What SkillSwap Is">
            SkillSwap is a marketplace that connects people who want to exchange skills and services. We do not guarantee the quality, safety, legality, or outcome of any skill swap arranged through our platform. All arrangements are made directly between users.
          </Section>

          <Section title="3. Your Responsibilities">
            You are solely responsible for the accuracy of your listings, your conduct with other users, and any agreements you make. You agree not to post false, misleading, or illegal content. You agree not to harass, spam, or harm other users. SkillSwap reserves the right to remove any listing or user account at any time for any reason.
          </Section>

          <Section title="4. No Guarantee of Results">
            SkillSwap makes no promises about finding you a match, the value of any swap, or any outcome. Use of this platform is at your own risk. SkillSwap is not responsible for disputes between users, failed swaps, or any loss — financial or otherwise — arising from use of the platform.
          </Section>

          <Section title="5. Payments and Subscriptions">
            Free accounts are available at no charge. Paid plans (SwapPro) are billed according to the plan selected. All payments are non-refundable unless required by law. Subscriptions auto-renew unless cancelled before the renewal date.
          </Section>

          <Section title="6. Limitation of Liability">
            To the maximum extent permitted by law, SkillSwap and its owners shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of the platform. Our total liability to you shall not exceed the amount you paid us in the 12 months prior to the claim.
          </Section>

          <Section title="7. Privacy Policy">
            We collect your name, email address, and phone number when you register. We use this information to operate your account, communicate with you, and improve the platform. We do not sell your personal information to third parties. We use Supabase to store your data securely. By using SkillSwap, you consent to this data collection.
          </Section>

          <Section title="8. Data Retention">
            We retain your account data for as long as your account is active. You may request deletion of your account and data by contacting us. Some data may be retained as required by law.
          </Section>

          <Section title="9. Changes to These Terms">
            We may update these Terms at any time. Continued use of SkillSwap after changes constitutes acceptance of the new Terms.
          </Section>

          <Section title="10. Contact">
            If you have questions about these Terms or our Privacy Policy, or to report a user, please contact us at the email listed on our platform.
          </Section>

        </div>

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <button
            onClick={onClose}
            style={{ background: "#2DD4BF", border: "none", color: "#0A0A0F", padding: "13px 40px", borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "inherit" }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#F0EDE8", marginBottom: 8 }}>{title}</h3>
      <p style={{ margin: 0, color: "#9998A8" }}>{children}</p>
    </div>
  );
}
