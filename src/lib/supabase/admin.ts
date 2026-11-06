import { createClient } from "@supabase/supabase-js";

function isJwt(value: string): boolean {
  return value.split(".").length === 3;
}

// Publishable/secret keys (`sb_...`) are not JWTs. Supabase services reject
// them when they are copied into `Authorization: Bearer`, so send them on the
// `apikey` header only.
function apikeyOnlyFetch(apiKey: string): typeof fetch {
  return async (input, init) => {
    const headers = new Headers(init?.headers);
    if (headers.get("Authorization") === `Bearer ${apiKey}`) {
      headers.delete("Authorization");
    }
    return fetch(input, { ...init, headers });
  };
}

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: isJwt(serviceRoleKey)
      ? undefined
      : { fetch: apikeyOnlyFetch(serviceRoleKey) },
  });
}
