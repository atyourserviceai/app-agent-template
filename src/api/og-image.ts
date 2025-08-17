export async function handleOgImage(
  request: Request,
  _env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const title = url.searchParams.get("title") || "App Agent Template";
    const description =
      url.searchParams.get("description") ||
      "AI-powered chat agent built with Cloudflare Agents";
    const mode = url.searchParams.get("mode") || "onboarding";

    // For now, return a simple SVG-based OG image
    // This works in all environments without requiring browser rendering
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#grad)"/>

        <!-- Logo/Brand Area -->
        <g transform="translate(60, 60)">
          <rect x="0" y="0" width="80" height="80" rx="16" fill="rgba(255,255,255,0.2)"/>
          <text x="40" y="50" text-anchor="middle" fill="white" font-family="Inter, system-ui, sans-serif" font-size="32" font-weight="bold">🤖</text>
          <text x="110" y="35" fill="white" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="600" opacity="0.9">App Agent Template</text>
          <text x="110" y="55" fill="white" font-family="Inter, system-ui, sans-serif" font-size="14" opacity="0.7">${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode</text>
        </g>

        <!-- Main Title -->
        <text x="600" y="280" text-anchor="middle" fill="white" font-family="Inter, system-ui, sans-serif" font-size="64" font-weight="bold">${title}</text>

        <!-- Description -->
        <text x="600" y="340" text-anchor="middle" fill="white" font-family="Inter, system-ui, sans-serif" font-size="28" opacity="0.9">${description}</text>

        <!-- Bottom Accent -->
        <rect x="60" y="590" width="1080" height="4" fill="rgba(255,255,255,0.3)" rx="2"/>

        <!-- Corner Decoration -->
        <rect x="1100" y="40" width="60" height="60" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3" rx="12"/>
      </svg>
    `;

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error generating OG image:", error);

    // Return a fallback image or error response
    return new Response("Error generating image", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
