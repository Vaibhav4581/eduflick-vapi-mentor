// components/StudentCard.tsx
// Shows the student's current progress context — what the AI Mentor knows about them

interface StudentCardProps {
  name: string;
  currentLesson: string;
  currentModule: string;
  track: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
}

export default function StudentCard({
  name,
  currentLesson,
  currentModule,
  track,
  progressPercent,
  completedLessons,
  totalLessons,
}: StudentCardProps) {
  return (
    <div className="student-card">
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.avatar}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={styles.name}>{name}</p>
          <p style={styles.track}>{track}</p>
        </div>
      </div>

      <div style={styles.divider} />

      {/* Current lesson */}
      <div style={styles.section}>
        <p style={styles.sectionLabel}>Currently studying</p>
        <p style={styles.lessonTitle}>{currentLesson}</p>
        <p style={styles.moduleName}>{currentModule}</p>
      </div>

      {/* Progress bar */}
      <div style={styles.section}>
        <div style={styles.progressHeader}>
          <p style={styles.sectionLabel}>Overall progress</p>
          <p style={styles.progressPercent}>{progressPercent}%</p>
        </div>
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${progressPercent}%`,
            }}
          />
        </div>
        <p style={styles.progressSub}>
          {completedLessons} of {totalLessons} lessons complete
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "var(--accent)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },
  name: {
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  track: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    marginTop: "2px",
  },
  divider: {
    height: 1,
    background: "var(--border)",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--text-muted)",
  },
  lessonTitle: {
    fontSize: "15px",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginTop: "4px",
  },
  moduleName: {
    fontSize: "13px",
    color: "var(--text-secondary)",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressPercent: {
    fontSize: "14px",
    fontWeight: 700,
    color: "var(--accent)",
  },
  progressTrack: {
    height: 6,
    background: "var(--surface-2)",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: "6px",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, var(--accent), #a78bfa)",
    borderRadius: 3,
    transition: "width 0.5s ease",
  },
  progressSub: {
    fontSize: "12px",
    color: "var(--text-muted)",
    marginTop: "4px",
  },
};
