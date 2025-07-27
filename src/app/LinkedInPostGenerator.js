"use client";
import { useState, useEffect } from "react";
import styles from "./LinkedInPostGenerator.module.css";

const LinkedInPostGenerator = () => {
  const [input, setInput] = useState("");
  const [post, setPost] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [authorUrn, setAuthorUrn] = useState("");

  // On mount, check for LinkedIn auth code in URL or existing session
  useEffect(() => {
    const url = new URL(window.location.href);
    const accessTokenParam = url.searchParams.get("accessToken");
    const authorUrnParam = url.searchParams.get("authorUrn");

    // If redirected from LinkedIn with tokens in URL, store and use them
    if (accessTokenParam && authorUrnParam) {
      setAccessToken(accessTokenParam);
      setAuthorUrn(authorUrnParam);
      setIsAuthenticated(true);
      sessionStorage.setItem("linkedin_access_token", accessTokenParam);
      sessionStorage.setItem("linkedin_author_urn", authorUrnParam);
      // Clean up URL
      window.history.replaceState({}, document.title, "/");
      return;
    }

    // If already have token/URN in sessionStorage, use them
    const storedToken = sessionStorage.getItem("linkedin_access_token");
    const storedUrn = sessionStorage.getItem("linkedin_author_urn");
    if (storedToken && storedUrn) {
      setAccessToken(storedToken);
      setAuthorUrn(storedUrn);
      setIsAuthenticated(true);
      return;
    }
  }, []);

  // Start LinkedIn OAuth
  const startLinkedInAuth = () => {
    setStatus("Redirecting to LinkedIn for authentication...");
    window.location.href = "/api/linkedin-auth";
  };

  const generatePostAndPublish = async () => {
    if (!input.trim()) {
      alert("Please enter a prompt.");
      return;
    }

    if (!accessToken || !authorUrn) {
      setStatus("You must authenticate with LinkedIn first.");
      return;
    }

    setLoading(true);
    setPost("");

    try {
      const res = await fetch("/api/agentic-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, accessToken, authorUrn }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post to LinkedIn");
      setPost("✅ Post published successfully to LinkedIn!");
      setStatus("");
    } catch (err) {
      setStatus("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.card}>
        <div className={styles.heading} style={{ textAlign: "center" }}>
          LinkPilot AI
          <div className={styles.subheading} style={{ fontSize: "1rem" }}>
            Agentic LinkedIn Post Generator
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <textarea
            className={styles.textarea}
            rows={4}
            placeholder={
              !isAuthenticated ? "" : "What should the LinkedIn post be about?"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!isAuthenticated}
            style={
              !isAuthenticated
                ? {
                    opacity: 0.5,
                    pointerEvents: "none",
                    background: "#222",
                    color: "#888",
                  }
                : {}
            }
          />
          {!isAuthenticated && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#aaa",
                fontWeight: 500,
                fontSize: "1.1rem",
                pointerEvents: "none",
                background: "rgba(20,20,20,0.35)",
                borderRadius: 10,
              }}
            >
              Authenticate with LinkedIn to start typing
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          {!isAuthenticated ? (
            <button className={styles.button} onClick={startLinkedInAuth}>
              Authenticate with LinkedIn
            </button>
          ) : (
            <button
              className={styles.button}
              onClick={generatePostAndPublish}
              disabled={loading}
            >
              {loading ? "Posting..." : "Post"}
            </button>
          )}
        </div>
        <div
          className={
            status.startsWith("Error")
              ? `${styles.status} ${styles.error}`
              : styles.status
          }
        >
          {status}
        </div>
        {post && <div className={styles.result}>{post}</div>}

        {/* Modal overlay for loading/auth status */}
        {(loading ||
          status.startsWith("Authenticating") ||
          status.startsWith("Redirecting")) && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              {loading ? (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 50 50"
                      style={{ display: "block", margin: "0 auto" }}
                    >
                      <circle
                        cx="25"
                        cy="25"
                        r="20"
                        fill="none"
                        stroke="#1a73e8"
                        strokeWidth="5"
                        strokeDasharray="31.4 31.4"
                        strokeLinecap="round"
                      >
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from="0 25 25"
                          to="360 25 25"
                          dur="1s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </svg>
                  </div>
                  Posting to LinkedIn...
                </>
              ) : (
                status
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkedInPostGenerator;
