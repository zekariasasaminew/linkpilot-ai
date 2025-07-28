import { NextResponse } from "next/server";

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI;

export async function GET() {
  const state = "linkpilot_" + Date.now();
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=openid%20profile%20w_member_social&state=${state}`;
  return NextResponse.redirect(authUrl);
}
