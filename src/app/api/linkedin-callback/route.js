import { NextResponse } from "next/server";

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  try {
    const tokenRes = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
          client_id: LINKEDIN_CLIENT_ID,
          client_secret: LINKEDIN_CLIENT_SECRET,
        }),
      }
    );
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    // Use OpenID Connect /userinfo endpoint for profile info
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await profileRes.json();
    const authorUrn = profile.sub ? `urn:li:person:${profile.sub}` : undefined;
    // Redirect to app with credentials and profile info in URL
    const params = new URLSearchParams({
      accessToken,
      authorUrn,
      name: profile.name || "",
      picture: profile.picture || "",
    });
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || "/"}?${params.toString()}`
    );
  } catch (err) {
    return NextResponse.json({ error: "OAuth flow failed" }, { status: 500 });
  }
}
