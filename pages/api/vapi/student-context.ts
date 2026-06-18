// /pages/api/vapi/student-context.ts
// Called by Vapi's function-calling webhook mid-conversation
// Returns personalised student data to inject into the AI's context

import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentContext {
  studentName: string;
  currentLesson: string;
  currentModule: string;
  track: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  lastActivityAt: string;
}

interface VapiWebhookPayload {
  message: {
    type: string;
    functionCall?: {
      name: string;
      parameters: {
        studentId?: string;
      };
    };
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body: VapiWebhookPayload = req.body;

    // Vapi sends a function-call webhook when the agent calls get-student-context
    if (
      body.message?.type === "function-call" &&
      body.message?.functionCall?.name === "get-student-context"
    ) {
      const studentId = body.message.functionCall.parameters?.studentId;

      if (!studentId) {
        return res.status(200).json({
          result: JSON.stringify({
            studentName: "Student",
            currentLesson: "Introduction to AI",
            currentModule: "Module 1 – Foundations",
            track: "AI & Machine Learning",
            progressPercent: 0,
            completedLessons: 0,
            totalLessons: 10,
            lastActivityAt: new Date().toISOString(),
          } as StudentContext),
        });
      }

      // Fetch student profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("full_name, track_id")
        .eq("id", studentId)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
      }

      // Fetch current lesson progress
      const { data: progress, error: progressError } = await supabaseAdmin
        .from("lesson_progress")
        .select(
          `
          lesson_id,
          completed_at,
          lessons (
            title,
            module_id,
            modules (
              title,
              track_id
            )
          )
        `
        )
        .eq("student_id", studentId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (progressError) {
        console.error("Progress fetch error:", progressError);
      }

      // Fetch overall progress stats
      const { count: completedCount } = await supabaseAdmin
        .from("lesson_progress")
        .select("*", { count: "exact" })
        .eq("student_id", studentId)
        .not("completed_at", "is", null);

      const { count: totalCount } = await supabaseAdmin
        .from("lessons")
        .select("*", { count: "exact" });

      const completed = completedCount ?? 0;
      const total = totalCount ?? 10;
      const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Build context object
      const context: StudentContext = {
        studentName: profile?.full_name ?? "Student",
        currentLesson: (progress?.lessons as any)?.title ?? "Getting Started",
        currentModule: (progress?.lessons as any)?.modules?.title ?? "Module 1",
        track: profile?.track_id ?? "General Learning",
        progressPercent,
        completedLessons: completed,
        totalLessons: total,
        lastActivityAt: new Date().toISOString(),
      };

      // Vapi expects { result: string } for function-call responses
      return res.status(200).json({
        result: JSON.stringify(context),
      });
    }

    // For other webhook types (call-start, call-end, etc.) — acknowledge
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Vapi webhook error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
