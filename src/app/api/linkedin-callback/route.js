import { NextResponse } from "next/server";

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI =
  process.env.LINKEDIN_REDIRECT_URI ||
  "http://localhost:3000/api/linkedin-callback";
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

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

    if (!tokenRes.ok) {
      return NextResponse.json(
        { error: "Token exchange failed", details: tokenData },
        { status: 500 }
      );
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token returned", details: tokenData },
        { status: 500 }
      );
    }

    // Use OpenID Connect /userinfo endpoint for profile info
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profile = await profileRes.json();

    if (!profileRes.ok) {
      return NextResponse.json(
        { error: "Profile fetch failed", details: profile },
        { status: 500 }
      );
    }

    const authorUrn = profile.sub ? `urn:li:person:${profile.sub}` : undefined;

    if (!authorUrn) {
      return NextResponse.json(
        { error: "No authorUrn in profile", details: profile },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      accessToken,
      authorUrn,
      name: profile.name || "",
      picture: profile.picture || "",
    }).toString();

    return NextResponse.redirect(`${baseUrl}/${params ? "?" + params : ""}`);
  } catch (err) {
    return NextResponse.json(
      { error: "OAuth flow failed", details: err?.message || err },
      { status: 500 }
    );
  }
}
