import { NextRequest, NextResponse } from "next/server";
import { synthesizeText } from "@/lib/ai/tts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      text?: string;
      language?: "en" | "sw";
    };

    const text = typeof body.text === "string" ? body.text.trim() : "";
    const language = body.language === "sw" ? "sw" : "en";
    if (!text) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }
    if (text.length > 20_000) {
      return NextResponse.json({ error: "Text is too long." }, { status: 413 });
    }

    const result = await synthesizeText({ text, language });
    if (!result) {
      // No server TTS provider: client should use browser speechSynthesis.
      return NextResponse.json({ provider: "browser", url: null });
    }

    return NextResponse.json({ provider: "server", ...result });
  } catch {
    return NextResponse.json({ error: "Failed to synthesize speech." }, { status: 500 });
  }
}
