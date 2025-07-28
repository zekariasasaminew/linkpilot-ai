import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.json();
  const { accessToken, authorUrn, fileName, fileType } = body;

  if (!accessToken || !authorUrn || !fileName || !fileType) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    // Step 1: Register upload
    const registerRes = await fetch(
      "https://api.linkedin.com/v2/assets?action=registerUpload",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          registerUploadRequest: {
            owner: authorUrn,
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            serviceRelationships: [
              {
                identifier: "urn:li:userGeneratedContent",
                relationshipType: "OWNER",
              },
            ],
            supportedUploadMechanism: ["SYNCHRONOUS_UPLOAD"],
          },
        }),
      }
    );
    const registerData = await registerRes.json();
    if (!registerRes.ok) {
      return NextResponse.json(
        { error: "Register upload failed", details: registerData },
        { status: 500 }
      );
    }
    const uploadUrl =
      registerData.value.uploadMechanism[
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
      ].uploadUrl;
    const asset = registerData.value.asset;

    // Step 2: Upload image binary
    const fileBuffer = Buffer.from(body.fileData, "base64");
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": fileType,
        "Content-Length": fileBuffer.length,
      },
      body: fileBuffer,
    });
    if (!uploadRes.ok) {
      const uploadErr = await uploadRes.text();
      return NextResponse.json(
        { error: "Image upload failed", details: uploadErr },
        { status: 500 }
      );
    }

    // Step 3: Return asset URN
    return NextResponse.json({ asset });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error", details: err?.message || err },
      { status: 500 }
    );
  }
}
