import { NextResponse } from "next/server";

const isDev = process.env.MOCK_LINKEDIN === "true";

export async function POST(req) {
  const body = await req.json();
  const { content, accessToken, authorUrn } = body;

  if (!content || !accessToken || !authorUrn) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    if (isDev) {
      return NextResponse.json({
        message: "Development mode: Post not actually sent",
      });
    }
    const linkedInPostResponse = await fetch(
      "https://api.linkedin.com/v2/ugcPosts",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          author: authorUrn,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: {
                text: content,
              },
              shareMediaCategory: "NONE",
            },
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
          },
        }),
      }
    );
    if (!linkedInPostResponse.ok) {
      const errorDetails = await linkedInPostResponse.text();
      return NextResponse.json(
        { error: "LinkedIn post failed", details: errorDetails },
        { status: 500 }
      );
    }
    return NextResponse.json({ message: "Post created successfully" });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error", details: err?.message || err },
      { status: 500 }
    );
  }
}
