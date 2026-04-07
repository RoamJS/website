import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_VERSION = "dropbox-auth-2026-04-06-3";
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "X-Dropbox-Auth-Version": ROUTE_VERSION,
};
const DROPBOX_CLIENT_ID =
  process.env.DROPBOX_OAUTH_CLIENT_ID || "ghagecp4sgm6v99";
const DROPBOX_REDIRECT_URI = "https://roamjs.com/oauth?auth=true";

type DropboxAuthRequest = {
  code?: string;
  grant_type?: string;
  redirect_uri?: string;
  refresh_token?: string;
};

const jsonResponse = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: CORS_HEADERS,
  });

const parseRequest = async (
  request: NextRequest,
): Promise<DropboxAuthRequest | null> => {
  try {
    return (await request.json()) as DropboxAuthRequest;
  } catch {
    return null;
  }
};

const getClientSecret = () => process.env.DROPBOX_OAUTH_CLIENT_SECRET || "";

const parseResponse = async (
  response: Response,
  fallbackMessage: string,
): Promise<Record<string, unknown>> => {
  const text = await response.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {
      message: text || fallbackMessage,
    };
  }
};

export const OPTIONS = () =>
  new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });

export const POST = async (request: NextRequest) => {
  try {
    console.log(`[${ROUTE_VERSION}] request:start`);
    const payload = await parseRequest(request);
    if (!payload) {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const grantType = payload.grant_type;
    if (grantType !== "authorization_code" && grantType !== "refresh_token") {
      return jsonResponse({ error: "Unsupported grant_type" }, 400);
    }

    const clientSecret = getClientSecret();
    if (!clientSecret) {
      return jsonResponse(
        {
          error:
            "Missing OAuth env var. Set DROPBOX_OAUTH_CLIENT_SECRET. DROPBOX_OAUTH_CLIENT_ID is optional when using the default app.",
        },
        500,
      );
    }

    const redirectUri = payload.redirect_uri || DROPBOX_REDIRECT_URI;
    if (
      grantType === "authorization_code" &&
      redirectUri !== DROPBOX_REDIRECT_URI
    ) {
      return jsonResponse({ error: "Invalid redirect_uri" }, 400);
    }

    const requestData: DropboxAuthRequest = {
      ...payload,
      ...(grantType === "authorization_code"
        ? { redirect_uri: DROPBOX_REDIRECT_URI }
        : {}),
    };

    if (grantType === "authorization_code" && !requestData.code) {
      return jsonResponse({ error: "Missing code" }, 400);
    }

    if (grantType === "refresh_token" && !requestData.refresh_token) {
      return jsonResponse({ error: "Missing refresh_token" }, 400);
    }

    const formData = new URLSearchParams();
    Object.entries(requestData).forEach(([key, value]) => {
      if (typeof value === "string") {
        formData.append(key, value);
      }
    });

    const tokenResponse = await fetch(
      "https://api.dropboxapi.com/oauth2/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${DROPBOX_CLIENT_ID}:${clientSecret}`,
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        cache: "no-store",
      },
    );

    const tokenData = await parseResponse(
      tokenResponse,
      "Failed to exchange token",
    );
    console.log(`[${ROUTE_VERSION}] token:response`, {
      ok: tokenResponse.ok,
      status: tokenResponse.status,
      keys: Object.keys(tokenData),
    });

    if (!tokenResponse.ok) {
      return jsonResponse(tokenData, tokenResponse.status);
    }

    if (grantType === "refresh_token") {
      return jsonResponse(tokenData);
    }

    console.log(`[${ROUTE_VERSION}] request:success`);
    return jsonResponse(tokenData);
  } catch (e) {
    console.error(`[${ROUTE_VERSION}] request:error`, e);
    return jsonResponse(
      {
        error:
          e instanceof Error ? e.message : "Unexpected Dropbox auth failure",
      },
      500,
    );
  }
};
