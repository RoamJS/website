import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "edge";

type SessionRecord = {
  status: "completed";
  code?: string;
  state?: string;
  error?: string;
  updatedAt: number;
};

const SESSION_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_SECONDS = Math.floor(SESSION_TTL_MS / 1000);
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
};

const globalStore = globalThis as typeof globalThis & {
  __ROAMJS_OAUTH_SESSION_STORE__?: Map<string, SessionRecord>;
};

const store =
  globalStore.__ROAMJS_OAUTH_SESSION_STORE__ ||
  new Map<string, SessionRecord>();
globalStore.__ROAMJS_OAUTH_SESSION_STORE__ = store;
const SESSION_CACHE_PREFIX = "https://oauth-session.roamjs.internal/";

const isValidSession = (session: string) =>
  /^sess_[A-Za-z0-9_-]{8,80}$/.test(session);

const jsonResponse = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: CORS_HEADERS,
  });

const getCache = async () => {
  const cacheApi = (globalThis as typeof globalThis & { caches?: CacheStorage })
    .caches;
  if (!cacheApi) {
    return null;
  }
  try {
    return await cacheApi.open("oauth-session");
  } catch {
    return null;
  }
};

const getCacheRequest = (session: string) =>
  new Request(`${SESSION_CACHE_PREFIX}${session}`);

const cleanupExpired = () => {
  const cutoff = Date.now() - SESSION_TTL_MS;
  Array.from(store.entries()).forEach(([session, record]) => {
    if (record.updatedAt < cutoff) {
      store.delete(session);
    }
  });
};

const readSession = async (session: string): Promise<SessionRecord | null> => {
  const cache = await getCache();
  if (cache) {
    const cached = await cache.match(getCacheRequest(session));
    if (cached) {
      try {
        const record = (await cached.json()) as SessionRecord;
        if (Date.now() - record.updatedAt <= SESSION_TTL_MS) {
          return record;
        }
      } catch {
        // ignore malformed cache entry
      }
    }
  }
  const fallback = store.get(session);
  if (!fallback) {
    return null;
  }
  if (Date.now() - fallback.updatedAt > SESSION_TTL_MS) {
    store.delete(session);
    return null;
  }
  return fallback;
};

const writeSession = async (session: string, record: SessionRecord) => {
  const cache = await getCache();
  if (cache) {
    await cache.put(
      getCacheRequest(session),
      new Response(JSON.stringify(record), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `public, max-age=${SESSION_TTL_SECONDS}`,
        },
      }),
    );
    return;
  }
  store.set(session, record);
};

export const OPTIONS = () =>
  new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });

export const GET = async (request: NextRequest) => {
  cleanupExpired();
  const session = request.nextUrl.searchParams.get("session") || "";
  if (!isValidSession(session)) {
    return jsonResponse({ error: "Invalid session" }, 400);
  }

  const record = await readSession(session);
  if (!record) {
    return jsonResponse({ status: "pending" });
  }

  return jsonResponse({
    status: "completed",
    code: record.code || "",
    state: record.state || "",
    error: record.error || "",
  });
};

export const POST = async (request: NextRequest) => {
  cleanupExpired();
  let payload: {
    session?: string;
    code?: string;
    state?: string;
    error?: string;
  } = {};
  try {
    payload = (await request.json()) as {
      session?: string;
      code?: string;
      state?: string;
      error?: string;
    };
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const session = payload.session || "";
  if (!isValidSession(session)) {
    return jsonResponse({ error: "Invalid session" }, 400);
  }

  const now = Date.now();
  await writeSession(session, {
    status: "completed",
    code: payload.code || "",
    state: payload.state || "",
    error: payload.error || "",
    updatedAt: now,
  });

  return jsonResponse({ ok: true });
};
