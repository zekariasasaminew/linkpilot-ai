import { NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(req) {
  const body = await req.json();
  const { input } = body;

  if (!input) {
    return NextResponse.json(
      { error: "Missing input" },
      { status: 400 }
    );
  }

  try {
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
              content: `Write a LinkedIn post based on: ${input}`,
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
    return NextResponse.json({ generatedPost });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error", details: err?.message || err },
      { status: 500 }
    );
  }
}
