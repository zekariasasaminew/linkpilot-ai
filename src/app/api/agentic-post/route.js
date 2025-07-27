import { NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(req) {
  const body = await req.json();
  const { prompt, accessToken, authorUrn } = body;
  if (!prompt || !accessToken || !authorUrn) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }
  try {
    // Step 1: Generate LinkedIn post using OpenRouter AI
    const aiResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat-v3-0324",
          messages: [
            {
              role: "system",
              content:
                "You are a professional LinkedIn content writer. Keep the tone enthusiastic, clear, and concise. Do not include hashtags unless requested.",
            },
            {
              role: "user",
              content: `Write a LinkedIn post based on: ${prompt}`,
            },
          ],
        }),
      }
    );
    if (!aiResponse.ok) {
      const aiError = await aiResponse.text();
      return NextResponse.json(
        { error: "OpenRouter AI error", details: aiError },
        { status: 500 }
      );
    }
    const aiData = await aiResponse.json();
    if (
      !aiData.choices ||
      !aiData.choices[0] ||
      !aiData.choices[0].message ||
      !aiData.choices[0].message.content
    ) {
      return NextResponse.json(
        { error: "OpenRouter AI response missing content", details: aiData },
        { status: 500 }
      );
    }
    const generatedPost = aiData.choices[0].message.content;
    // Step 2: Post to LinkedIn using /ugcPosts API
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
                text: generatedPost,
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
