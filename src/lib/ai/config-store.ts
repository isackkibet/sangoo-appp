import { decryptSecret, encryptSecret } from "@/lib/crypto/secrets";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AIProvider = "groq" | "openai" | "gemini" | "anthropic";

export const AI_PROVIDERS: AIProvider[] = ["groq", "openai", "gemini", "anthropic"];

export interface AIConfig {
  activeProvider: AIProvider;
  models: Record<AIProvider, string>;
  keys: Partial<Record<AIProvider, string>>;
  updatedAt: string | null;
}

interface AIConfigUpdate {
  activeProvider?: AIProvider;
  models?: Partial<Record<AIProvider, string>>;
  keys?: Partial<Record<AIProvider, string>>;
  updatedAt?: string | null;
}

const defaultConfig: AIConfig = {
  activeProvider: "groq",
  models: {
    groq: "openai/gpt-oss-120b",
    openai: "gpt-4.1-mini",
    gemini: "gemini-1.5-flash",
    anthropic: "claude-3-5-sonnet-latest",
  },
  keys: {},
  updatedAt: null,
};

// Groq retired these model IDs. Keep the app working for configs saved before
// the change instead of silently falling back to the retrieval-only answers.
const LEGACY_GROQ_MODELS = new Set([
  "llama-3.3-70b-versatile",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "mixtral-8x7b-32768",
]);

function isProvider(value: unknown): value is AIProvider {
  return typeof value === "string" && (AI_PROVIDERS as string[]).includes(value);
}

function normalizeModel(provider: AIProvider, value: unknown): string {
  const model = typeof value === "string" ? value.trim() : "";
  if (provider === "groq" && (!model || LEGACY_GROQ_MODELS.has(model))) {
    return defaultConfig.models.groq;
  }
  return model || defaultConfig.models[provider];
}

// Vercel-friendly: keys can come from environment variables so the app works
// without the Supabase settings table. Stored keys still take precedence.
function envKeys(): Partial<Record<AIProvider, string>> {
  return {
    groq: process.env.GROQ_API_KEY?.trim() || undefined,
    openai: process.env.OPENAI_API_KEY?.trim() || undefined,
    gemini:
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.GOOGLE_API_KEY?.trim() ||
      undefined,
    anthropic: process.env.ANTHROPIC_API_KEY?.trim() || undefined,
  };
}

function envModels(): Partial<Record<AIProvider, string>> {
  return {
    groq: process.env.GROQ_MODEL?.trim() || undefined,
    openai: process.env.OPENAI_MODEL?.trim() || undefined,
    gemini: process.env.GEMINI_MODEL?.trim() || undefined,
    anthropic: process.env.ANTHROPIC_MODEL?.trim() || undefined,
  };
}

function sanitizeConfig(raw: AIConfigUpdate | Partial<AIConfig> | null | undefined): AIConfig {
  return {
    activeProvider: isProvider(raw?.activeProvider)
      ? raw.activeProvider
      : defaultConfig.activeProvider,
    models: {
      groq: normalizeModel("groq", raw?.models?.groq),
      openai: normalizeModel("openai", raw?.models?.openai),
      gemini: normalizeModel("gemini", raw?.models?.gemini),
      anthropic: normalizeModel("anthropic", raw?.models?.anthropic),
    },
    keys: {
      groq: raw?.keys?.groq || undefined,
      openai: raw?.keys?.openai || undefined,
      gemini: raw?.keys?.gemini || undefined,
      anthropic: raw?.keys?.anthropic || undefined,
    },
    updatedAt: raw?.updatedAt || null,
  };
}

function maskKey(provider: AIProvider, value?: string) {
  if (!value) return null;

  if (provider === "groq") return `gsk_...${value.slice(-4)}`;
  if (provider === "openai") return `sk-...${value.slice(-4)}`;
  if (provider === "gemini") return `AIza...${value.slice(-4)}`;
  return `sk-ant-...${value.slice(-4)}`;
}

function applyEnv(config: AIConfig): AIConfig {
  const keys = envKeys();
  const models = envModels();

  const merged: AIConfig = {
    ...config,
    models: {
      groq: normalizeModel("groq", models.groq || config.models.groq),
      openai: normalizeModel("openai", models.openai || config.models.openai),
      gemini: normalizeModel("gemini", models.gemini || config.models.gemini),
      anthropic: normalizeModel("anthropic", models.anthropic || config.models.anthropic),
    },
    keys: {
      groq: config.keys.groq || keys.groq,
      openai: config.keys.openai || keys.openai,
      gemini: config.keys.gemini || keys.gemini,
      anthropic: config.keys.anthropic || keys.anthropic,
    },
  };

  const envProvider = process.env.AI_PROVIDER?.trim();
  if (isProvider(envProvider)) {
    merged.activeProvider = envProvider;
  } else if (!merged.keys[merged.activeProvider]) {
    // If the selected provider has no key, use the first one that does.
    const fallback = AI_PROVIDERS.find((provider) => !!merged.keys[provider]);
    if (fallback) merged.activeProvider = fallback;
  }

  return merged;
}

// Config as stored in the database only (no environment fallback). Used for
// writes so that env-provided keys are never persisted back into the table.
async function readStoredAIConfig(): Promise<AIConfig> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("ai_gateway_settings")
      .select("*")
      .eq("id", "global")
      .maybeSingle();

    if (error || !data) {
      return defaultConfig;
    }

    return sanitizeConfig({
      activeProvider: data.active_provider as AIProvider,
      models: data.models_json as Partial<Record<AIProvider, string>>,
      keys: {
        groq: decryptSecret(data.groq_key_encrypted),
        openai: decryptSecret(data.openai_key_encrypted),
        gemini: decryptSecret(data.gemini_key_encrypted),
        anthropic: decryptSecret(data.anthropic_key_encrypted),
      },
      updatedAt: data.updated_at as string | null,
    });
  } catch {
    return defaultConfig;
  }
}

export async function readAIConfig(): Promise<AIConfig> {
  return applyEnv(await readStoredAIConfig());
}

export async function writeAIConfig(update: AIConfigUpdate): Promise<AIConfig> {
  const current = await readStoredAIConfig();
  const next = sanitizeConfig({
    ...current,
    ...update,
    models: {
      ...current.models,
      ...update.models,
    },
    keys: {
      ...current.keys,
      ...update.keys,
    },
    updatedAt: new Date().toISOString(),
  });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("ai_gateway_settings").upsert({
    id: "global",
    active_provider: next.activeProvider,
    models_json: next.models,
    groq_key_encrypted: next.keys.groq ? encryptSecret(next.keys.groq) : null,
    openai_key_encrypted: next.keys.openai ? encryptSecret(next.keys.openai) : null,
    gemini_key_encrypted: next.keys.gemini ? encryptSecret(next.keys.gemini) : null,
    anthropic_key_encrypted: next.keys.anthropic ? encryptSecret(next.keys.anthropic) : null,
    updated_at: next.updatedAt,
  });

  if (error) {
    throw error;
  }

  return next;
}

export async function readPublicAIConfig() {
  const config = await readAIConfig();
  return {
    activeProvider: config.activeProvider,
    models: config.models,
    configured: {
      groq: !!config.keys.groq,
      openai: !!config.keys.openai,
      gemini: !!config.keys.gemini,
      anthropic: !!config.keys.anthropic,
    },
    maskedKeys: {
      groq: maskKey("groq", config.keys.groq),
      openai: maskKey("openai", config.keys.openai),
      gemini: maskKey("gemini", config.keys.gemini),
      anthropic: maskKey("anthropic", config.keys.anthropic),
    },
    updatedAt: config.updatedAt,
    storageMode: "supabase-encrypted",
  };
}
