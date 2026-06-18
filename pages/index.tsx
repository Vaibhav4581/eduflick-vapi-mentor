// pages/index.tsx
// EduFlick Roadmap Page — where the AI Mentor voice button lives
// In a real app this page would be behind auth; for the demo we use mock student data

import { useState, useEffect } from "react";
import Head from "next/head";
import MicrophoneButton from "../components/MicrophoneButton";
import StudentCard from "../components/StudentCard";

// ─── Mock student data ────────────────────────────────────────────────────────
// In production: fetch this from Supabase using the logged-in user's ID
// The /api/vapi/student-context webhook does the same thing server-side for Vapi

const MOCK_STUDENT = {
  id: "demo-student-001",
  name: "Arjun",
  currentLesson: "How Large Language Models Actually Work",
  currentModule: "Module 2 — Understanding AI Models",
  track: "AI Foundations",
  progressPercent: 35,
  completedLessons: 7,
  totalLessons: 20,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const [sessionCount, setSessionCount] = useState(0);
  const [lastDuration, setLastDuration] = useState<number | null>(null);
  const [callActive, setCallActive] = useState(false);

  // Pulse animation keyframes injected into DOM
  useEffect(() => {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes pulse {
      ...your existing keyframes...
    }
  `;
  document.head.appendChild(style); // ✅ don't return this
  return () => {                     // ✅ return a cleanup function instead
    document.head.removeChild(style);
  };
}, []);

  return (
    <>
      <Head>
        <title>EduFlick — AI Mentor</title>
        <meta name="description" content="EduFlick AI Voice Mentor — Task 10 Demo" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
      </Head>

      <div className="layout-page">
        {/* ── Top nav ───────────────────────────────────────────────────── */}
        <nav className="layout-nav">
          <div style={styles.navLogo}>
            <span style={styles.logoMark}>E</span>
            <span style={styles.logoText}>EduFlick</span>
          </div>
          <div style={styles.navRight}>
            <span style={styles.navBadge}>AI Mentor Demo</span>
            <div style={styles.navAvatar}>
              {MOCK_STUDENT.name.charAt(0)}
            </div>
          </div>
        </nav>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <main className="layout-main">
          {/* Left column — student info */}
          <aside className="layout-sidebar">
            <StudentCard {...MOCK_STUDENT} />

            {/* Session stats */}
            {sessionCount > 0 && (
              <div style={styles.statsCard}>
                <p style={styles.statsLabel}>This session</p>
                <div style={styles.statsRow}>
                  <div style={styles.stat}>
                    <p style={styles.statValue}>{sessionCount}</p>
                    <p style={styles.statKey}>conversations</p>
                  </div>
                  {lastDuration !== null && (
                    <div style={styles.stat}>
                      <p style={styles.statValue}>{lastDuration}s</p>
                      <p style={styles.statKey}>last call</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* How to use */}
            <div style={styles.hintCard}>
              <p style={styles.hintTitle}>How to use</p>
              <ol style={styles.hintList}>
                <li>Click the microphone button</li>
                <li>Wait for "Live" status (1–2s)</li>
                <li>Ask your AI Mentor anything about your lesson</li>
                <li>Click the red button to end the session</li>
              </ol>
            </div>
          </aside>

          {/* Right column — voice mentor */}
          <section className="layout-mentor-section">
            <div style={styles.mentorHeader}>
              <h1 style={styles.mentorTitle}>AI Mentor</h1>
              <div style={styles.roleTagRow}>
                <span style={styles.roleTag}>🎓 Enrollment Agent</span>
                <span style={styles.roleSep}>·</span>
                <span style={styles.roleDesc}>Pitching the EduFlick Bootcamp</span>
              </div>
              <p style={styles.mentorSubtitle}>
                Ask me anything about{" "}
                <strong style={{ color: "var(--accent)" }}>
                  {MOCK_STUDENT.currentLesson}
                </strong>
              </p>
            </div>

            {/* Voice card */}
            <div className="layout-voice-card">
              <MicrophoneButton
                student={MOCK_STUDENT}
                onCallStart={() => {
                  setCallActive(true);
                }}
                onCallEnd={(duration) => {
                  setCallActive(false);
                  setSessionCount((c) => c + 1);
                  setLastDuration(duration);
                }}
              />
            </div>

            {/* Framework info badge — good for the demo presentation */}
            <div style={styles.techBadge}>
              <span style={styles.techDot} />
              <span>Powered by Vapi WebRTC · EduFlick AI Mentor · Task 10</span>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  navLogo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: "var(--radius-sm)",
    background: "var(--accent)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: 800,
    color: "#fff",
  },
  logoText: {
    fontSize: "18px",
    fontWeight: 700,
    color: "var(--text-primary)",
    letterSpacing: "-0.02em",
  },
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  navBadge: {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--accent)",
    background: "var(--accent-glow)",
    padding: "4px 10px",
    borderRadius: 20,
    border: "1px solid var(--accent)",
  },
  navAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "var(--accent)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: 700,
    color: "#fff",
  },
  statsCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "16px 20px",
  },
  statsLabel: {
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--text-muted)",
    marginBottom: "12px",
  },
  statsRow: {
    display: "flex",
    gap: "24px",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: 700,
    color: "var(--text-primary)",
    letterSpacing: "-0.02em",
  },
  statKey: {
    fontSize: "12px",
    color: "var(--text-muted)",
  },
  hintCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "16px 20px",
  },
  hintTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: "10px",
  },
  hintList: {
    paddingLeft: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    color: "var(--text-secondary)",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  mentorHeader: {
    textAlign: "center",
  },
  mentorTitle: {
    fontSize: "32px",
    fontWeight: 800,
    letterSpacing: "-0.03em",
    color: "var(--text-primary)",
    marginBottom: "10px",
  },
  roleTagRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "12px",
  },
  roleTag: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#a78bfa",
    background: "rgba(167,139,250,0.12)",
    border: "1px solid rgba(167,139,250,0.35)",
    padding: "4px 12px",
    borderRadius: 20,
    letterSpacing: "0.03em",
  },
  roleSep: {
    color: "var(--text-muted)",
    fontSize: "14px",
  },
  roleDesc: {
    fontSize: "13px",
    color: "var(--text-muted)",
    fontStyle: "italic",
  },
  mentorSubtitle: {
    fontSize: "15px",
    color: "var(--text-secondary)",
  },
  techBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "var(--text-muted)",
  },
  techDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "var(--success)",
    flexShrink: 0,
  },
};
