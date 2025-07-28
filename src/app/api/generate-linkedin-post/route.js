import { NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(req) {
  const body = await req.json();
  const { input } = body;

  if (!input) {
    return NextResponse.json({ error: "Missing input" }, { status: 400 });
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
              content: [
                "You are an expert LinkedIn content writer and social media strategist - LinkPilot AI.",
                "Do not use em dashes (—), hyphens (-), or any dash character.",
                "Your job is to craft engaging, professional, and authentic LinkedIn posts that drive conversation and value.",
                "Always use a positive, clear, and concise tone.",
                "Make sure the post is actionable, relevant to the target audience, and includes a strong opening and a clear call to action.",
                "If the user provides a draft, improve its structure, clarity, and impact while preserving their voice.",
                "Never mention that you are an AI or language model.",
              ].join(" "),
            },
            {
              role: "user",
              content: [
                `Write a LinkedIn post based on the following topic or draft: ${input}`,
                "Do not use em dashes (—), hyphens (-), or any dash character.",
                "The post should be detailed, actionable, and tailored for a professional audience.",
                "Start with a strong hook, develop the main idea with supporting points or examples, and end with a clear call to action or question to encourage engagement.",
                "Keep the language natural and authentic, as if written by a real person.",
                "If you are refining a draft, make it more compelling, concise, and impactful.",
                "Return ONLY the LinkedIn post draft. Do not include any commentary, preamble, explanation, or extra text before or after the post.",
              ].join(" "),
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
