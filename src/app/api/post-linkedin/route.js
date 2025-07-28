import { NextResponse } from "next/server";
// Simple markdown-to-text stripper (handles bold, italics, links, code, lists, etc.)
function stripMarkdown(md) {
  if (!md) return "";
  // Only remove ** used for bold, keep all other formatting and newlines
  return md.replace(/\*\*(.*?)\*\*/g, "$1");
}

export async function POST(req) {
  const body = await req.json();
  const { content, accessToken, authorUrn, imageAssetUrns } = body;

  if (!content || !accessToken || !authorUrn) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Convert markdown to plain text for LinkedIn
  const plainText = stripMarkdown(content);

  // Build media array if imageAssetUrn is provided
  let shareMediaCategory = "NONE";
  let media = undefined;
  if (Array.isArray(imageAssetUrns) && imageAssetUrns.length > 0) {
    shareMediaCategory = "IMAGE";
    media = imageAssetUrns.map((urn) => ({ status: "READY", media: urn }));
  }

  try {
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
                text: plainText,
              },
              shareMediaCategory,
              ...(media ? { media } : {}),
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
