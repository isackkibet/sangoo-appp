import { NextRequest, NextResponse } from "next/server";
import { runSearchAgent } from "@/lib/ai/search-agent";
import type { SourceItem } from "@/components/ai/types";
import { clientIp, rateLimit } from "@/lib/security/guard";

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: NextRequest) {
  // Each answer can cost money on the AI account: 20 questions a minute per visitor.
  const limited = rateLimit(`chat:${clientIp(req)}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "You are sending messages very fast. Please wait a minute." }, { status: 429, headers: { "Retry-After": String(limited.retryAfter) } });
  }
  if (Number(req.headers.get("content-length") ?? 0) > 64 * 1024) {
    return NextResponse.json({ error: "That message is too long." }, { status: 413 });
  }
  try {
    const body = (await req.json()) as {
      message?: string;
      sessionId?: string;
      history?: ChatTurn[];
      language?: string;
    };

    const language = body.language === "sw" ? "sw" : "en";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }
    if (message.length > 4000) {
      return NextResponse.json({ error: "Please keep your message under 4,000 characters." }, { status: 400 });
    }
    // Only the last few turns, and only plain text, are passed to the AI.
    const history = Array.isArray(body.history)
      ? body.history.slice(-8).filter((t) => t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string").map((t) => ({ role: t.role, content: t.content.slice(0, 4000) }))
      : [];
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 80) : undefined;

    // Controlled search agent: SIHU RAG first, then sufficiency evaluation,
    // then optional web search. Limits are enforced inside the agent.
    const result = await runSearchAgent({
      message,
      language,
      sessionId,
      history,
    });

    const sihuSources: SourceItem[] = result.sihuSources.map((source) => ({
      id: source.id,
      title: source.title,
      kind: source.kind,
      contentType: source.contentType,
      url: source.url,
      location: source.publisher,
      publishedAt: source.publishedAt,
      snippet: source.snippet,
    }));
    const webSources: SourceItem[] = result.webSources.map((source) => ({
      id: source.id,
      title: source.title,
      kind: source.kind,
      contentType: source.contentType,
      url: source.url,
      location: source.publisher,
      publishedAt: source.publishedAt,
      snippet: source.snippet,
    }));

    return NextResponse.json({
      reply: result.reply,
      provider: "groq",
      model: "search-agent",
      intent: result.intent,
      sources: [...sihuSources, ...webSources],
      sihuSources,
      webSources,
      mode: result.evidenceLevel,
      searchUsed: result.searchUsed,
      queriesUsed: result.queriesUsed,
      evidenceLevel: result.evidenceLevel,
      isStory: false,
      speechText: result.reply,
    });
  } catch (error) {
    console.error("AI chat route failed:", error);
    return NextResponse.json(
      {
        error: "Failed to process AI chat request.",
      },
      { status: 500 }
    );
  }
}
