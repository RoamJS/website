import { NextRequest, NextResponse } from "next/server";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
const GOOGLE_REDIRECT_URI = "https://roamjs.com/oauth?auth=true";

type GoogleAuthRequest = {
  code?: string;
  grant_type?: string;
  refresh_token?: string;
};

const jsonResponse = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: CORS_HEADERS,
  });

const parseRequest = async (
  request: NextRequest
): Promise<GoogleAuthRequest | null> => {
  try {
    return (await request.json()) as GoogleAuthRequest;
  } catch {
    return null;
  }
};

const getClientId = () => process.env.GOOGLE_OAUTH_CLIENT_ID || "";

const getClientSecret = () => process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";

const getLabel = async (accessToken: string): Promise<string | undefined> => {
  try {
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
    if (!userInfoResponse.ok) {
      return undefined;
    }
    const userInfo = (await userInfoResponse.json()) as {
      email?: string;
      name?: string;
    };
    return userInfo.email || userInfo.name;
  } catch {
    return undefined;
  }
};

export const OPTIONS = () =>
  new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });

export const POST = async (request: NextRequest) => {
  const payload = await parseRequest(request);
  if (!payload) {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const grantType = payload.grant_type;
  if (grantType !== "authorization_code" && grantType !== "refresh_token") {
    return jsonResponse({ error: "Unsupported grant_type" }, 400);
  }

  const clientId = getClientId();
  const clientSecret = getClientSecret();
  if (!clientId || !clientSecret) {
    return jsonResponse(
      {
        error:
          "Missing OAuth env vars. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET.",
      },
      500
    );
  }

  const formData = new URLSearchParams();
  formData.set("client_id", clientId);
  formData.set("client_secret", clientSecret);
  formData.set("grant_type", grantType);

  if (grantType === "authorization_code") {
    if (!payload.code) {
      return jsonResponse({ error: "Missing code" }, 400);
    }
    formData.set("code", payload.code);
    formData.set("redirect_uri", GOOGLE_REDIRECT_URI);
  } else {
    if (!payload.refresh_token) {
      return jsonResponse({ error: "Missing refresh_token" }, 400);
    }
    formData.set("refresh_token", payload.refresh_token);
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
    cache: "no-store",
  });

  const responseText = await tokenResponse.text();
  let tokenData: Record<string, unknown>;
  try {
    tokenData = JSON.parse(responseText) as Record<string, unknown>;
  } catch {
    tokenData = {
      error: responseText || "Failed to exchange token",
    };
  }

  if (!tokenResponse.ok) {
    return jsonResponse(tokenData, tokenResponse.status);
  }

  if (typeof tokenData.access_token === "string") {
    const label = await getLabel(tokenData.access_token);
    if (label) {
      tokenData = {
        ...tokenData,
        label,
      };
    }
  }

  return jsonResponse(tokenData);
};
