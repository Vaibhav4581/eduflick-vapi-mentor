// components/MicrophoneButton.tsx
// Core voice button — connects to Vapi, shows live transcript, handles all states

import { useEffect, useRef, useState, useCallback } from "react";
import Vapi from "@vapi-ai/web";

// ─── Types ────────────────────────────────────────────────────────────────────

type CallStatus = "idle" | "connecting" | "active" | "ending" | "error";

interface TranscriptLine {
  role: "user" | "assistant";
  text: string;
}

interface StudentData {
  id?: string;
  name?: string;
  currentLesson?: string;
  currentModule?: string;
  track?: string;
  progressPercent?: number;
}

interface MicrophoneButtonProps {
  student?: StudentData;
  onCallStart?: () => void;
  onCallEnd?: (durationSeconds: number) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildSystemPrompt(student: StudentData): string {
  const name = student.name ?? "Student";
  const lesson = student.currentLesson ?? "their current lesson";
  const module_ = student.currentModule ?? "the current module";
  const track = student.track ?? "their learning track";
  const progress = student.progressPercent ?? 0;

  return `You are the EduFlick AI Mentor — a warm, encouraging, and knowledgeable learning assistant for the EduFlick platform.

ABOUT EDUFLICK:
EduFlick offers the following courses:

MAIN COURSES:
1. AI Foundations — Learn what AI is, how LLMs work, prompt engineering basics, and how to use AI tools in everyday life. Modules: What is AI?, Understanding AI Models, Prompt Engineering, AI Tools & Workflows, Ethics & Future of AI.
2. AI Content Creation — Use AI to write, design, and create content at scale. Covers ChatGPT, Midjourney, video AI tools, and building a content workflow.
3. AI Software Dev — Build real apps with AI assistance. Covers GitHub Copilot, code generation, debugging with AI, and shipping products faster.
4. Agentic Automation — Build autonomous AI agents that can browse the web, run tasks, and automate workflows using tools like LangChain, CrewAI, and n8n.

BOOTCAMP PROGRAMS:
- AgentEx Beginner — Intro to AI agents, no-code automation, building your first agent.
- AgentEx Intermediate — Multi-agent systems, tool use, memory & context management.
- AgentEx Advanced — Production-grade agent deployment, monitoring, and scaling.

STUDENT CONTEXT:
- Name: ${name}
- Current track: ${track}
- Current module: ${module_}
- Current lesson: ${lesson}
- Overall progress: ${progress}% complete

YOUR ROLE:
- Greet ${name} by name at the start of every conversation
- Answer questions about their current lesson and EduFlick courses clearly and concisely
- Encourage them when they're stuck — never make them feel bad for not knowing something
- Keep responses SHORT for voice — 2-3 sentences maximum per turn
- Speak naturally, as if having a real conversation — avoid bullet points or lists in your speech

BOOTCAMP PITCH (VERY IMPORTANT):
- Whenever ${name} asks about other modules, other courses, what comes next, or anything beyond their current lesson, you MUST briefly answer and then enthusiastically pitch the EduFlick AgentEx Bootcamp.
- Make it feel natural and conversational — not salesy. Mention that the bootcamp is the fastest way to go from learning to actually building real AI agents, and that spots are limited.
- Example pitch: "By the way, if you really want to accelerate, the AgentEx Bootcamp takes everything you're learning and turns it into hands-on projects — students go from zero to shipping real AI agents in just a few weeks. It might be perfect for where you're headed!"
- Always tie the pitch back to what the student is currently learning or asking about — make it feel relevant, not random.
- If they show interest, briefly describe the three tracks: Beginner (intro to agents, no-code automation), Intermediate (multi-agent systems, tool use), and Advanced (production deployment and scaling).

START the conversation by greeting ${name} and asking what they'd like help with today in their ${track} course.`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MicrophoneButton({
  student = {},
  onCallStart,
  onCallEnd,
}: MicrophoneButtonProps) {
  const vapiRef = useRef<Vapi | null>(null);
  const startTimeRef = useRef<number>(0);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Keep callback refs stable so the Vapi effect doesn't need them as deps
  const onCallStartRef = useRef(onCallStart);
  const onCallEndRef = useRef(onCallEnd);
  useEffect(() => { onCallStartRef.current = onCallStart; }, [onCallStart]);
  useEffect(() => { onCallEndRef.current = onCallEnd; }, [onCallEnd]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Init Vapi once
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) {
      console.error("NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set");
      return;
    }

    // Only create a new Vapi instance if one doesn't exist yet.
    // React Strict Mode mounts/unmounts/remounts quickly, and creating
    // multiple instances causes duplicate WebRTC connections.
    if (!vapiRef.current) {
      vapiRef.current = new Vapi(publicKey);
    }
    const vapi = vapiRef.current;

    // ── Event listeners ──────────────────────────────────────────────────────

    const handleCallStart = () => {
      setStatus("active");
      setTranscript([]);
      startTimeRef.current = Date.now();
      onCallStartRef.current?.();
    };

    const handleCallEnd = () => {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      setStatus("idle");
      setIsMuted(false);
      setVolumeLevel(0);
      onCallEndRef.current?.(duration);
    };

    const handleMessage = (message: any) => {
      // Live transcript from Vapi
      if (message.type === "transcript") {
        if (message.transcriptType === "final") {
          setTranscript((prev) => [
            ...prev,
            { role: message.role, text: message.transcript },
          ]);
        }
      }
    };

    const handleVolumeLevel = (level: number) => {
      setVolumeLevel(level);
    };

    const handleError = (error: any) => {
      console.error("Vapi error:", JSON.stringify(error, null, 2));
      console.error("Error type:", error?.type, "| Code:", error?.error?.code, "| Message:", error?.error?.message ?? error?.message);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    };

    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);
    vapi.on("message", handleMessage);
    vapi.on("volume-level", handleVolumeLevel);
    vapi.on("error", handleError);

    return () => {
      // Remove all listeners before destroying — prevents duplicate events
      // and stuck state caused by React Strict Mode double-invoking effects
      vapi.off("call-start", handleCallStart);
      vapi.off("call-end", handleCallEnd);
      vapi.off("message", handleMessage);
      vapi.off("volume-level", handleVolumeLevel);
      vapi.off("error", handleError);
      vapi.stop();
    };
  }, []);

  // ── Start call ──────────────────────────────────────────────────────────────

  const startCall = useCallback(async () => {
    const vapi = vapiRef.current;
    if (!vapi || status !== "idle") return;

    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

    setStatus("connecting");

    try {
      if (assistantId) {
        // Use a pre-configured assistant from Vapi dashboard
        // Override the system prompt with student-specific context
        await vapi.start(assistantId, {
          variableValues: {
            studentName: student.name ?? "Student",
            currentLesson: student.currentLesson ?? "Introduction",
            currentModule: student.currentModule ?? "Module 1",
            track: student.track ?? "General",
            progress: String(student.progressPercent ?? 0),
          },
        });
      } else {
        // Inline assistant config — no dashboard setup needed for testing
        await vapi.start({
          name: "EduFlick AI Mentor",
          model: {
            provider: "openai",
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: buildSystemPrompt(student),
              },
            ],
          },
          voice: {
            provider: "openai",
            voiceId: "alloy", // OpenAI TTS — most reliable on Vapi
          },
          transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "en-US",
          },
          firstMessage: `Hi ${student.name ?? "there"}! I'm your EduFlick AI Mentor. What would you like help with today?`,
          endCallMessage: "Great session! Keep up the great work. Goodbye!",
          maxDurationSeconds: 600,
        });
      }
    } catch (err) {
      console.error("Failed to start call:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [status, student]);

  // ── End call ────────────────────────────────────────────────────────────────

  const endCall = useCallback(() => {
    const vapi = vapiRef.current;
    if (!vapi) return;
    setStatus("ending");
    vapi.stop();
  }, []);

  // ── Mute toggle ─────────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    const vapi = vapiRef.current;
    if (!vapi || status !== "active") return;
    const newMuted = !isMuted;
    vapi.setMuted(newMuted);
    setIsMuted(newMuted);
  }, [isMuted, status]);

  // ── Render ──────────────────────────────────────────────────────────────────

  const isActive = status === "active";
  const isConnecting = status === "connecting" || status === "ending";

  return (
    <div style={styles.wrapper}>
      {/* Status label */}
      <div style={styles.statusRow}>
        <span
          style={{
            ...styles.statusDot,
            background:
              status === "active"
                ? "var(--success)"
                : status === "error"
                  ? "var(--danger)"
                  : isConnecting
                    ? "var(--warning)"
                    : "var(--text-muted)",
            boxShadow:
              status === "active"
                ? "0 0 8px var(--success)"
                : "none",
          }}
        />
        <span style={styles.statusText}>
          {status === "idle" && "Click mic to talk to your AI Mentor"}
          {status === "connecting" && "Connecting…"}
          {status === "active" && "Live — AI Mentor is listening"}
          {status === "ending" && "Ending session…"}
          {status === "error" && "Something went wrong — try again"}
        </span>
      </div>

      {/* Main mic button */}
      <div style={styles.buttonArea}>
        {/* Pulse rings when active */}
        {isActive && (
          <>
            <div
              style={{
                ...styles.pulseRing,
                animationDelay: "0s",
                transform: `scale(${1 + volumeLevel * 0.5})`,
              }}
            />
            <div
              style={{
                ...styles.pulseRing,
                animationDelay: "0.4s",
                opacity: 0.5,
              }}
            />
          </>
        )}

        <button
          onClick={isActive ? endCall : startCall}
          disabled={isConnecting}
          style={{
            ...styles.micButton,
            background: isActive
              ? "var(--danger)"
              : isConnecting
                ? "var(--surface-2)"
                : "var(--accent)",
            boxShadow: isActive
              ? "0 0 24px rgba(239,68,68,0.4)"
              : "0 0 24px var(--accent-glow)",
          }}
          aria-label={isActive ? "End call" : "Start call"}
        >
          {isConnecting ? (
            <SpinnerIcon />
          ) : isActive ? (
            <PhoneOffIcon />
          ) : (
            <MicIcon />
          )}
        </button>
      </div>

      {/* Controls — only show during active call */}
      {isActive && (
        <div style={styles.controls}>
          <button
            onClick={toggleMute}
            style={{
              ...styles.controlBtn,
              background: isMuted ? "var(--danger)" : "var(--surface-2)",
              color: isMuted ? "#fff" : "var(--text-secondary)",
            }}
          >
            {isMuted ? <MicOffIcon /> : <MicIcon size={16} />}
            <span>{isMuted ? "Unmute" : "Mute"}</span>
          </button>
        </div>
      )}

      {/* Live transcript */}
      {transcript.length > 0 && (
        <div style={styles.transcriptBox}>
          <p style={styles.transcriptLabel}>Live Transcript</p>
          <div style={styles.transcriptScroll}>
            {transcript.map((line, i) => (
              <div
                key={i}
                style={{
                  ...styles.transcriptLine,
                  alignSelf:
                    line.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <span style={styles.transcriptRole}>
                  {line.role === "user" ? "You" : "AI Mentor"}
                </span>
                <div
                  style={{
                    ...styles.transcriptBubble,
                    background:
                      line.role === "user"
                        ? "var(--accent)"
                        : "var(--surface-2)",
                    color:
                      line.role === "user"
                        ? "#fff"
                        : "var(--text-primary)",
                  }}
                >
                  {line.text}
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inline styles ────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
    width: "100%",
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    flexShrink: 0,
    transition: "all 0.3s ease",
  },
  statusText: {
    fontSize: "14px",
    color: "var(--text-secondary)",
  },
  buttonArea: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 100,
  },
  pulseRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: "50%",
    border: "2px solid var(--danger)",
    animation: "pulse 1.5s ease-out infinite",
    transition: "transform 0.1s ease",
  },
  micButton: {
    position: "relative",
    zIndex: 1,
    width: 80,
    height: 80,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    color: "#fff",
  },
  controls: {
    display: "flex",
    gap: "12px",
  },
  controlBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    borderRadius: "var(--radius-sm)",
    fontSize: "13px",
    fontWeight: 500,
    transition: "all 0.2s ease",
  },
  transcriptBox: {
    width: "100%",
    maxWidth: 480,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "16px",
  },
  transcriptLabel: {
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--text-muted)",
    marginBottom: "12px",
  },
  transcriptScroll: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: 240,
    overflowY: "auto",
  },
  transcriptLine: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    maxWidth: "80%",
  },
  transcriptRole: {
    fontSize: "11px",
    color: "var(--text-muted)",
    fontWeight: 600,
  },
  transcriptBubble: {
    padding: "8px 12px",
    borderRadius: "var(--radius-sm)",
    fontSize: "14px",
    lineHeight: 1.5,
  },
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function MicIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function PhoneOffIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A2 2 0 0 1 10.68 13.31z" />
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M10.68 10.68a16 16 0 0 0-2.6-3.41l1.27-1.27a2 2 0 0 0 .45-2.11 12.84 12.84 0 0 0-.7-2.81A2 2 0 0 0 7.1 0H4.1A2 2 0 0 0 2.1 2.18a19.79 19.79 0 0 0 3.07 8.63" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
