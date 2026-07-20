import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  callReExplainApi,
  isTranscriptionResult,
  ReExplainApiError,
} from "@/lib/reexplain-api";
import { MAX_VOICE_DURATION_SECONDS } from "@/constants/session-input";

export const runtime = "nodejs";

const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_AUDIO_TYPES = new Set([
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/x-m4a",
]);

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const incomingForm = await request.formData();
  const file = incomingForm.get("file");
  const durationSeconds = Number(incomingForm.get("durationSeconds"));

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "A voice recording is required." }, { status: 400 });
  }
  const contentType = file.type.split(";", 1)[0];
  if (!SUPPORTED_AUDIO_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: "The recording format is not supported." },
      { status: 415 },
    );
  }
  if (file.size > MAX_AUDIO_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Voice recordings must be 10 MB or smaller." },
      { status: 413 },
    );
  }
  if (
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0 ||
    durationSeconds > MAX_VOICE_DURATION_SECONDS
  ) {
    return NextResponse.json(
      { error: "Voice recordings must be 3 minutes or shorter." },
      { status: 400 },
    );
  }

  const upstreamForm = new FormData();
  upstreamForm.set("file", file, file.name || "teaching.webm");
  upstreamForm.set("duration_seconds", String(durationSeconds));

  try {
    const transcription = await callReExplainApi(
      "/api/v1/learning/transcribe",
      { method: "POST", body: upstreamForm },
      isTranscriptionResult,
    );
    return NextResponse.json(transcription);
  } catch (error) {
    if (error instanceof ReExplainApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "The recording could not be transcribed." },
      { status: 503 },
    );
  }
}