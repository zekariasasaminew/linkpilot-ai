"use client";
import { useState } from "react";

const LinkedInPostGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [post, setPost] = useState("");
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [authorUrn, setAuthorUrn] = useState("");

  const generatePostAndPublish = async () => {
    if (!prompt.trim() || !accessToken || !authorUrn) {
      alert("Missing prompt, access token, or author URN");
      return;
    }
    setLoading(true);
    setPost("");
    try {
      const res = await fetch("/api/linkedin/agentic-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, accessToken, authorUrn }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post to LinkedIn");
      setPost("✅ Post published successfully to LinkedIn!");
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h2>LinkPilot AI — Agentic LinkedIn Post Generator</h2>
      <textarea
        rows={4}
        placeholder="What should the LinkedIn post be about?"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />
      <input
        placeholder="Access Token"
        value={accessToken}
        onChange={(e) => setAccessToken(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />
      <input
        placeholder="Author URN (e.g., urn:li:person:xxxx)"
        value={authorUrn}
        onChange={(e) => setAuthorUrn(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />
      <button
        onClick={generatePostAndPublish}
        disabled={loading}
        style={{ padding: "10px 20px" }}
      >
        {loading ? "Posting..." : "Generate & Post to LinkedIn"}
      </button>
      {post && (
        <div style={{ marginTop: 20 }}>
          <h3>Status:</h3>
          <div
            style={{
              whiteSpace: "pre-wrap",
              border: "1px solid #ccc",
              padding: 10,
              background: "#f9f9f9",
            }}
          >
            {post}
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkedInPostGenerator;
