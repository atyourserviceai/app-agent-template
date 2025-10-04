/**
 * Server-side JWT authentication utilities for API routes
 */

export interface JWTPayload {
  userId: string;
  sub: string; // Standard JWT subject, also contains userId
  appContext: string;
  workspaceId: string;
  type: string;
  exp: number;
  iat: number;
}

export function isJWTToken(token: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  return parts.length === 3;
}

export function isJWTTokenExpired(token: string): boolean {
  if (!token || !isJWTToken(token)) return true;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    // Decode the payload (second part of JWT)
    const base64Payload = parts[1];
    // Add padding if needed for base64 decoding
    const paddedPayload = base64Payload.padEnd(
      base64Payload.length + ((4 - (base64Payload.length % 4)) % 4),
      "="
    );

    // Use atob for base64 decoding (available in Cloudflare Workers)
    const payload = JSON.parse(atob(paddedPayload));
    const exp = payload.exp;

    if (!exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= exp;
  } catch (error) {
    console.error("Error checking JWT token expiration:", error);
    return true;
  }
}

export function decodeJWTPayload(token: string): JWTPayload | null {
  if (!token || !isJWTToken(token)) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64Payload = parts[1];
    const paddedPayload = base64Payload.padEnd(
      base64Payload.length + ((4 - (base64Payload.length % 4)) % 4),
      "="
    );

    const payload = JSON.parse(atob(paddedPayload));

    // Validate required fields
    if (
      !payload.userId ||
      !payload.sub ||
      !payload.exp ||
      payload.type !== "oauth-session"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      sub: payload.sub,
      appContext: payload.appContext,
      workspaceId: payload.workspaceId,
      type: payload.type,
      exp: payload.exp,
      iat: payload.iat
    };
  } catch (error) {
    console.error("Error decoding JWT payload:", error);
    return null;
  }
}

export function validateAuthHeader(request: Request): {
  isValid: boolean;
  payload?: JWTPayload;
  error?: string;
} {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return { isValid: false, error: "Missing Authorization header" };
  }

  if (!authHeader.startsWith("Bearer ")) {
    return {
      isValid: false,
      error: "Invalid Authorization header format. Expected: Bearer <token>"
    };
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  if (!token) {
    return { isValid: false, error: "Missing JWT token" };
  }

  if (!isJWTToken(token)) {
    return { isValid: false, error: "Invalid JWT token format" };
  }

  if (isJWTTokenExpired(token)) {
    return { isValid: false, error: "JWT token has expired" };
  }

  const payload = decodeJWTPayload(token);
  if (!payload) {
    return { isValid: false, error: "Invalid JWT token payload" };
  }

  return { isValid: true, payload };
}
