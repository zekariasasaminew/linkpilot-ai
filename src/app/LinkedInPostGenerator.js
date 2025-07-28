"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./LinkedInPostGenerator.module.css";
import ReactMarkdown from "react-markdown";

const LinkedInPostGenerator = () => {
  // Hydration state to avoid SSR/client mismatch
  const [hydrated, setHydrated] = useState(false);
  // Set hydrated to true after mount
  useEffect(() => {
    setHydrated(true);
  }, []);
  const [input, setInput] = useState("");
  const [generated, setGenerated] = useState("");
  const [refining, setRefining] = useState(false);
  const [posting, setPosting] = useState(false);
  const [status, setStatus] = useState("");
  const [imageFiles, setImageFiles] = useState([]); // Array of File
  const [imagePreviews, setImagePreviews] = useState([]); // Array of preview URLs
  const [imageAssetUrns, setImageAssetUrns] = useState([]); // Array of asset URNs
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef();
  // Handle image selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
    setImageAssetUrns([]);
  };

  // Upload all images to LinkedIn and get asset URNs
  const uploadImages = async () => {
    if (!imageFiles.length || !accessToken || !authorUrn) return;
    setUploadingImages(true);
    setStatus("");
    try {
      const assetUrns = [];
      for (const file of imageFiles) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        await new Promise((resolve) => (reader.onload = resolve));
        const base64 = reader.result.split(",")[1];
        const res = await fetch("/api/upload-linkedin-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken,
            authorUrn,
            fileName: file.name,
            fileType: file.type,
            fileData: base64,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Image upload failed");
        assetUrns.push(data.asset);
      }
      setImageAssetUrns(assetUrns);
      setStatus("All images uploaded and ready to post.");
    } catch (err) {
      setStatus("Error uploading images: " + err.message);
      setImageAssetUrns([]);
    } finally {
      setUploadingImages(false);
    }
  };
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [authorUrn, setAuthorUrn] = useState("");
  const [step, setStep] = useState("input");
  const [userName, setUserName] = useState("");
  const [userPicture, setUserPicture] = useState("");

  // On mount, check for LinkedIn auth code in URL or existing session
  useEffect(() => {
    const url = new URL(window.location.href);
    const accessTokenParam = url.searchParams.get("accessToken");
    const authorUrnParam = url.searchParams.get("authorUrn");
    const nameParam = url.searchParams.get("name");
    const pictureParam = url.searchParams.get("picture");

    // If redirected from LinkedIn with tokens in URL, store and use them
    if (accessTokenParam && authorUrnParam) {
      setAccessToken(accessTokenParam);
      setAuthorUrn(authorUrnParam);
      setIsAuthenticated(true);
      sessionStorage.setItem("linkedin_access_token", accessTokenParam);
      sessionStorage.setItem("linkedin_author_urn", authorUrnParam);
      if (nameParam) {
        setUserName(nameParam);
        sessionStorage.setItem("linkedin_user_name", nameParam);
      }
      if (pictureParam) {
        setUserPicture(pictureParam);
        sessionStorage.setItem("linkedin_user_picture", pictureParam);
      }
      // Clean up URL
      window.history.replaceState({}, document.title, "/");
      return;
    }

    // If already have token/URN in sessionStorage, use them
    const storedToken = sessionStorage.getItem("linkedin_access_token");
    const storedUrn = sessionStorage.getItem("linkedin_author_urn");
    const storedName = sessionStorage.getItem("linkedin_user_name");
    const storedPicture = sessionStorage.getItem("linkedin_user_picture");
    if (storedToken && storedUrn) {
      setAccessToken(storedToken);
      setAuthorUrn(storedUrn);
      setIsAuthenticated(true);
      if (storedName) setUserName(storedName);
      if (storedPicture) setUserPicture(storedPicture);
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
    setRefining(true);
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
      setRefining(false);
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
    if (imageFiles.length && imageAssetUrns.length !== imageFiles.length) {
      setStatus("Please upload all images before posting.");
      return;
    }
    setPosting(true);
    setStatus("");
    try {
      const res = await fetch("/api/post-linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: generated,
          accessToken,
          authorUrn,
          imageAssetUrns: imageAssetUrns.length ? imageAssetUrns : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post to LinkedIn");
      setStatus("✅ Post published successfully to LinkedIn!");
      setStep("done");
    } catch (err) {
      setStatus("Error: " + err.message);
    } finally {
      setPosting(false);
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
          {isAuthenticated && (userName || userPicture) && (
            <div
              className={styles.googleUserInfo}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {userPicture && (
                <img
                  src={userPicture}
                  alt={userName || "User"}
                  className={styles.googleUserPic}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: "2px solid #dadce0",
                    objectFit: "cover",
                  }}
                />
              )}
              {userName && (
                <span
                  className={styles.googleUserName}
                  style={{
                    color: "#222",
                    textAlign: "center",
                  }}
                >
                  {userName}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={styles.googleBody}>
          {/* Image upload UI */}
          {/* Only render client-only UI after hydration to avoid SSR mismatch */}
          {hydrated && isAuthenticated && step !== "done" && (
            <div style={{ marginBottom: 16 }}>
              <input
                type="file"
                accept="image/*"
                multiple
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleImageChange}
              />
              <button
                className={styles.googleButton}
                type="button"
                onClick={() =>
                  fileInputRef.current && fileInputRef.current.click()
                }
                disabled={refining || posting || uploadingImages}
                style={{ marginRight: 8 }}
              >
                {imageFiles.length ? "Change Images" : "Upload Images"}
              </button>
              {imageFiles.length > 0 &&
                imageAssetUrns.length !== imageFiles.length && (
                  <button
                    className={styles.googleButtonPrimary}
                    type="button"
                    onClick={uploadImages}
                    disabled={uploadingImages || refining || posting}
                  >
                    {uploadingImages
                      ? `Uploading... (${imageAssetUrns.length}/${imageFiles.length})`
                      : "Upload to LinkedIn"}
                  </button>
                )}
              {imagePreviews.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                  {imagePreviews.map((preview, idx) => (
                    <div key={idx} style={{ textAlign: "center" }}>
                      <img
                        src={preview}
                        alt={`Preview ${idx + 1}`}
                        style={{
                          maxWidth: 120,
                          maxHeight: 80,
                          borderRadius: 8,
                          border: "1.5px solid #dadce0",
                        }}
                      />
                      {imageAssetUrns[idx] && (
                        <div
                          style={{
                            color: "#34a853",
                            fontSize: "0.97rem",
                            marginTop: 4,
                          }}
                        >
                          Image ready
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {step === "input" ? (
            <textarea
              className={styles.googleTextarea}
              rows={5}
              placeholder="What should the LinkedIn post be about?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={
                !isAuthenticated || refining || posting || step === "done"
              }
              autoFocus
            />
          ) : (
            <>
              <textarea
                className={styles.googleTextarea}
                rows={5}
                value={generated}
                onChange={(e) => setGenerated(e.target.value)}
                disabled={
                  !isAuthenticated || refining || posting || step === "done"
                }
                style={{ marginBottom: 12 }}
              />
              <div className={styles.googlePreviewLabel}>Preview:</div>
              <div className={styles.googleMarkdownPreview}>
                <ReactMarkdown>{generated}</ReactMarkdown>
              </div>
            </>
          )}
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
              disabled={refining || posting || !input.trim()}
            >
              {refining ? "Generating..." : "Generate"}
            </button>
          ) : step === "generated" ? (
            <>
              <button
                className={styles.googleButton}
                onClick={() => handleGenerate(generated)}
                disabled={refining || posting || !generated.trim()}
                style={{ marginRight: 8 }}
              >
                {refining ? "Refining..." : "Refine"}
              </button>
              <button
                className={styles.googleButtonPrimary}
                onClick={handlePost}
                disabled={posting || refining || !generated.trim()}
              >
                {posting ? "Posting..." : "Post"}
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
