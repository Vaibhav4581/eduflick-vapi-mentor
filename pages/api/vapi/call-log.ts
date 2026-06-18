// /pages/api/vapi/call-log.ts
// Vapi calls this webhook when a session ends
// Saves transcript + metadata to Supabase call_logs table

import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    // Only process end-of-call reports
    if (message?.type !== "end-of-call-report") {
      return res.status(200).json({ received: true });
    }

    const {
      call,
      transcript,
      summary,
      recordingUrl,
    } = message;

    // Write to Supabase call_logs table
    const { error } = await supabaseAdmin.from("call_logs").insert({
      call_id: call?.id,
      student_id: call?.metadata?.studentId ?? null,
      surface: "in_app_mentor",
      duration_seconds: call?.endedAt
        ? Math.round(
            (new Date(call.endedAt).getTime() -
              new Date(call.startedAt).getTime()) /
              1000
          )
        : null,
      transcript: transcript ?? null,
      summary: summary ?? null,
      recording_url: recordingUrl ?? null,
      ended_reason: call?.endedReason ?? null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to write call log:", error);
      return res.status(500).json({ error: "DB write failed" });
    }

    return res.status(200).json({ saved: true });
  } catch (err) {
    console.error("Call log webhook error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
