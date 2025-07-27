"use client";
import { useState, useEffect } from "react";
import styles from "./LinkedInPostGenerator.module.css";

const LinkedInPostGenerator = () => {
  const [input, setInput] = useState("");
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [authorUrn, setAuthorUrn] = useState("");
  const [step, setStep] = useState("input"); // input | generated | posting | done

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

  // Generate or refine post
  const handleGenerate = async (text) => {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/generate-linkedin-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate post");
      setGenerated(data.generatedPost);
      setStep("generated");
    } catch (err) {
      setStatus("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Post to LinkedIn
  const handlePost = async () => {
    if (!generated.trim()) {
      setStatus("Please enter or generate a post first.");
      return;
    }
    if (!accessToken || !authorUrn) {
      setStatus("You must authenticate with LinkedIn first.");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/post-linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: generated, accessToken, authorUrn }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post to LinkedIn");
      setStatus("✅ Post published successfully to LinkedIn!");
      setStep("done");
    } catch (err) {
      setStatus("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.googleBg}>
      <div className={styles.googleCard}>
        <div className={styles.googleHeader}>
          <span className={styles.logoDot} />
          <span className={styles.logoDot2} />
          <span className={styles.logoDot3} />
          <span className={styles.logoDot4} />
          <span className={styles.googleTitle}>LinkPilot AI</span>
          <span className={styles.googleSubtitle}>LinkedIn Post Generator</span>
        </div>
        <div className={styles.googleBody}>
          <textarea
            className={styles.googleTextarea}
            rows={5}
            placeholder={
              step === "input"
                ? "What should the LinkedIn post be about?"
                : "Edit or refine your LinkedIn post here..."
            }
            value={step === "input" ? input : generated}
            onChange={(e) =>
              step === "input"
                ? setInput(e.target.value)
                : setGenerated(e.target.value)
            }
            disabled={!isAuthenticated || loading || step === "done"}
            autoFocus
          />
          {!isAuthenticated && (
            <div className={styles.googleOverlay}>
              Authenticate with LinkedIn to start
            </div>
          )}
        </div>
        <div className={styles.googleActions}>
          {!isAuthenticated ? (
            <button className={styles.googleButton} onClick={startLinkedInAuth}>
              Authenticate with LinkedIn
            </button>
          ) : step === "input" ? (
            <button
              className={styles.googleButton}
              onClick={() => handleGenerate(input)}
              disabled={loading || !input.trim()}
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          ) : step === "generated" ? (
            <>
              <button
                className={styles.googleButton}
                onClick={() => handleGenerate(generated)}
                disabled={loading || !generated.trim()}
                style={{ marginRight: 8 }}
              >
                {loading ? "Refining..." : "Refine"}
              </button>
              <button
                className={styles.googleButtonPrimary}
                onClick={handlePost}
                disabled={loading || !generated.trim()}
              >
                {loading ? "Posting..." : "Post"}
              </button>
            </>
          ) : (
            <button
              className={styles.googleButton}
              onClick={() => {
                setStep("input");
                setInput("");
                setGenerated("");
                setStatus("");
              }}
            >
              Create Another
            </button>
          )}
        </div>
        {status && (
          <div
            className={
              status.startsWith("Error")
                ? `${styles.googleStatus} ${styles.googleError}`
                : styles.googleStatus
            }
          >
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkedInPostGenerator;
