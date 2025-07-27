// LangChain agent for orchestrating LinkedIn post generation and publishing
import { NextResponse } from "next/server";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";
import { DynamicTool } from "langchain/tools";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENAI_API_KEY = process.env.CHATOPENAI_API_KEY;
const isDev =
  process.env.NODE_ENV === "development" ||
  process.env.MOCK_LINKEDIN === "true";

// Tool: Generate LinkedIn post using OpenRouter AI
const generatePostTool = new DynamicTool({
  name: "generate_linkedin_post",
  description: "Generate a professional LinkedIn post from an input.",

  func: async (input) => {
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
      throw new Error(`OpenRouter AI error: ${aiError}`);
    }

    const aiData = await aiResponse.json();

    if (
      !aiData.choices ||
      !aiData.choices[0] ||
      !aiData.choices[0].message ||
      !aiData.choices[0].message.content
    ) {
      throw new Error("OpenRouter AI response missing content");
    }
    return aiData.choices[0].message.content;
  },
});

// Tool: Post to LinkedIn
const postToLinkedInTool = new DynamicTool({
  name: "post_to_linkedin",
  description:
    "Post content to LinkedIn using the user's access token and author URN.",

  func: async ({ content, accessToken, authorUrn }) => {
    if (isDev) {
      return "MOCK: Post would be sent to LinkedIn:\n" + content;
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
      throw new Error(`LinkedIn post failed: ${errorDetails}`);
    }

    return "Post created successfully";
  },
});

export async function POST(req) {
  const body = await req.json();
  const { input, accessToken, authorUrn } = body;

  const prompt = {
    system:
      "You are a professional LinkedIn content writer. Keep the tone enthusiastic, clear, and concise. Do not include hashtags unless requested.",
  };

  // ...existing code...
  if (!input || !accessToken || !authorUrn) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OpenAI API key (CHATOPENAI_API_KEY)" },
      { status: 500 }
    );
  }

  try {
    // Set up LangChain agent with tools
    const tools = [generatePostTool, postToLinkedInTool];

    // ...existing code...
    const keyPrefix = OPENAI_API_KEY ? OPENAI_API_KEY.slice(0, 8) : "undefined";
    const model = "GPT-3.5 Turbo";
    // Extra check: OpenAI key must start with 'sk-'
    if (!OPENAI_API_KEY || !OPENAI_API_KEY.startsWith("sk-")) {
      return NextResponse.json(
        {
          error:
            "Your OpenAI key is missing or invalid. It must start with 'sk-'.",
        },
        { status: 500 }
      );
    }

    const llm = new ChatOpenAI({
      apiKey: OPENAI_API_KEY,
      model,
      temperature: 0.7,
      max_tokens: null,
      timeout: null,
      max_retries: 2,
    });

    let agent;
    try {
      agent = await createOpenAIFunctionsAgent({ llm, tools, prompt });
    } catch (agentErr) {
      // Add more helpful error message for common issues
      if (
        agentErr?.message?.includes("includes") ||
        agentErr?.message?.includes("undefined")
      ) {
        throw new Error(
          "Agent creation failed: This usually means your OpenAI key is not valid for this model, or your langchain/@langchain/openai packages are out of date. Please check your key and update your dependencies. " +
            (agentErr?.message || agentErr)
        );
      }
      throw new Error(
        "Agent creation failed: " + (agentErr?.message || agentErr)
      );
    }

    let executor;
    try {
      executor = new AgentExecutor({ agent, tools });
    } catch (execErr) {
      throw new Error(
        "AgentExecutor creation failed: " + (execErr?.message || execErr)
      );
    }

    let result;
    try {
      result = await executor.invoke({
        input: `Generate a LinkedIn post for: "${prompt}". Then post it to LinkedIn using the provided accessToken and authorUrn. accessToken: ${accessToken}, authorUrn: ${authorUrn}`,
      });
    } catch (invokeErr) {
      throw new Error(
        "AgentExecutor invoke failed: " + (invokeErr?.message || invokeErr)
      );
    }

    return NextResponse.json({ message: result.output });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Agentic workflow failed",
        details: err?.message || err,
        stack: err?.stack,
      },
      { status: 500 }
    );
  }
}
