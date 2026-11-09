import { NextRequest, NextResponse } from "next/server";
import { readPublicAIConfig, writeAIConfig } from "@/lib/ai/config-store";
import { clientIp, isAdmin, rateLimit } from "@/lib/security/guard";

export async function POST(req: NextRequest) {
  // Changing the AI keys decides who answers SIHU's visitors: admins only.
  const limited = rateLimit(`keys:${clientIp(req)}`, 5, 60_000);
  if (!limited.ok) return NextResponse.json({ success: false, message: "Too many tries. Wait a minute." }, { status: 429, headers: { "Retry-After": String(limited.retryAfter) } });
  if (!isAdmin(req)) return NextResponse.json({ success: false, message: "Only SIHU admins can change these settings." }, { status: 401 });
  try {
    const body = await req.json();
    const { groq, openai, gemini, anthropic, activeProvider, models } = body as {
      groq?: string;
      openai?: string;
      gemini?: string;
      anthropic?: string;
      activeProvider?: "groq" | "openai" | "gemini" | "anthropic";
      models?: {
        groq?: string;
        openai?: string;
        gemini?: string;
        anthropic?: string;
      };
    };

    const config = await writeAIConfig({
      activeProvider,
      models,
      keys: {
        groq: groq || undefined,
        openai: openai || undefined,
        gemini: gemini || undefined,
        anthropic: anthropic || undefined,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "AI gateway settings saved.",
        activeProvider: config.activeProvider,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json(await readPublicAIConfig());
}
