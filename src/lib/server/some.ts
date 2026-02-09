export async function getPageAccessToken(): Promise<string> {
  const sysToken = process.env.FB_SYSTEM_USER_TOKEN!;
  const pageId = process.env.FB_SYSTEM_PAGE_ID!;

  const res = await fetch(
    `https://graph.facebook.com/v20.0/me/accounts?access_token=${sysToken}`
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Kunne ikke hente page token: ${err}`);
  }

  const data = await res.json();
  const page = data.data?.find(
    (p: { id: string; access_token?: string }) => p.id === pageId
  );

  if (!page?.access_token) {
    throw new Error("Page access token ikke fundet");
  }

  return page.access_token;
}

export async function postToFacebookPage({
  message,
  imageUrls,
}: {
  message: string;
  imageUrls?: string[];
}): Promise<{ link?: string } | null> {
  console.log("🚀 [SERVER] Starting Facebook post via system user...");
  console.log("📝 Message:", message);

  const pageId = process.env.FB_SYSTEM_PAGE_ID!;
  const systemToken = process.env.FB_SYSTEM_USER_TOKEN!;

  if (!systemToken || !pageId) {
    throw new Error("Facebook systembruger token eller page ID mangler");
  }

  const selectedPageId = pageId;

  // Get proper page access token
  const pageAccessToken = await getPageAccessToken();
  console.log("🔑 [SERVER] Retrieved page access token");

  try {
    // Hvis der kun er ét billede - brug /photos endpoint direkte
    if (imageUrls && imageUrls.length === 1) {
      const res = await fetch(
        `https://graph.facebook.com/v20.0/${selectedPageId}/photos`,
        {
          method: "POST",
          body: new URLSearchParams({
            url: imageUrls[0],
            message,
            published: "true", // Publiser direkte
            access_token: pageAccessToken,
          }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        console.error("Photo post error:", data);
        throw new Error(`Fejl ved billede-opslag: ${data.error?.message}`);
      }

      console.log(
        "✅ [SERVER] Facebook photo post created successfully:",
        data.id
      );
      return {
        link: data.id ? `https://www.facebook.com/${data.id}` : undefined,
      };
    }

    // For posts uden billeder eller med flere billeder - brug /feed endpoint
    const postBody: Record<string, string> = {
      message,
      access_token: pageAccessToken,
    };

    // Hvis flere billeder - opret et album post med alle billeder
    if (imageUrls && imageUrls.length > 1) {
      const mediaIds: string[] = [];

      // Upload alle billeder som unpublished media
      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];

        const res = await fetch(
          `https://graph.facebook.com/v20.0/${selectedPageId}/photos`,
          {
            method: "POST",
            body: new URLSearchParams({
              url,
              published: "false", // Unpublished så vi kan bruge dem i album
              access_token: pageAccessToken,
            }),
          }
        );
        const data = await res.json();

        if (!res.ok) {
          console.error("Photo upload error:", data);
          throw new Error(
            `Kunne ikke uploade billede ${i + 1}: ${data.error?.message}`
          );
        }

        mediaIds.push(data.id);
        console.log(
          `✅ [SERVER] Facebook photo ${i + 1} uploaded as media:`,
          data.id
        );
      }

      // Opret album post med alle billeder
      const albumRes = await fetch(
        `https://graph.facebook.com/v20.0/${selectedPageId}/feed`,
        {
          method: "POST",
          body: new URLSearchParams({
            message,
            attached_media: JSON.stringify(
              mediaIds.map((id) => ({ media_fbid: id }))
            ),
            access_token: pageAccessToken,
          }),
        }
      );

      const albumData = await albumRes.json();

      if (!albumRes.ok) {
        console.error("Facebook album post error:", albumData);
        throw new Error(`Fejl ved album opslag: ${albumData.error?.message}`);
      }

      console.log(
        "✅ [SERVER] Facebook album post created successfully:",
        albumData.id
      );

      return {
        link: albumData.id
          ? `https://www.facebook.com/${albumData.id}`
          : undefined,
      };
    } // Opret post (kun hvis ikke single photo)
    if (!imageUrls || imageUrls.length !== 1) {
      const postRes = await fetch(
        `https://graph.facebook.com/v20.0/${selectedPageId}/feed`,
        {
          method: "POST",
          body: new URLSearchParams(postBody),
        }
      );
      const postData = await postRes.json();

      if (!postRes.ok) {
        console.error("Facebook post error:", postData);
        throw new Error(`Fejl ved opslag: ${postData.error?.message}`);
      }

      console.log(
        "✅ [SERVER] Facebook post created successfully:",
        postData.id
      );
      return {
        link: postData.id
          ? `https://www.facebook.com/${postData.id}`
          : undefined,
      };
    }

    // If we got here, it was a single photo post that was already handled
    return null;
  } catch (error) {
    console.error("❌ [SERVER] Facebook posting failed:", error);
    throw error;
  }
}

export async function deleteFacebookPost(
  postId: string
): Promise<{ success: boolean }> {
  console.log("🗑️ [SERVER] Deleting Facebook post:", postId);

  const pageId = process.env.FB_SYSTEM_PAGE_ID!;
  const systemToken = process.env.FB_SYSTEM_USER_TOKEN!;

  if (!systemToken || !pageId) {
    throw new Error("Facebook system-token eller page ID mangler");
  }

  // Get proper page access token
  const pageAccessToken = await getPageAccessToken();

  const res = await fetch(`https://graph.facebook.com/v20.0/${postId}`, {
    method: "DELETE",
    body: new URLSearchParams({
      access_token: pageAccessToken,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    console.error("❌ [SERVER] Facebook deletion failed:", errorData);
    throw new Error(`Fejl ved sletning: ${errorData.error?.message}`);
  }

  console.log("✅ [SERVER] Facebook post deleted successfully!");
  return { success: true };
}

/**
 * Polls Instagram media creation status until it's ready
 */
async function pollMediaStatus(
  creationId: string,
  accessToken: string,
  maxAttempts = 30,
  initialDelay = 2000
): Promise<void> {
  const maxDelay = 30000; // 30 seconds max delay
  let delay = initialDelay;
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;

    try {
      const statusRes = await fetch(
        `https://graph.facebook.com/v20.0/${creationId}?fields=status_code&access_token=${accessToken}`
      );

      if (!statusRes.ok) {
        const errorData = await statusRes.json();
        console.warn(
          `⚠️ [SERVER] Status check failed for ${creationId}:`,
          errorData
        );
        // Continue polling even if status check fails
      } else {
        const statusData = await statusRes.json();
        const statusCode = statusData.status_code;

        console.log(
          `📊 [SERVER] Media ${creationId} status: ${statusCode} (attempt ${attempts}/${maxAttempts})`
        );

        if (statusCode === "FINISHED") {
          console.log(`✅ [SERVER] Media ${creationId} is ready!`);
          return;
        }

        if (statusCode === "ERROR") {
          throw new Error(
            `Media processing failed with status: ${statusCode}. Check image format, size, and URL accessibility.`
          );
        }

        // If IN_PROGRESS or other status, continue polling
        if (statusCode === "IN_PROGRESS") {
          console.log(
            `⏳ [SERVER] Media ${creationId} still processing, waiting ${delay}ms...`
          );
        } else {
          console.log(
            `⏳ [SERVER] Media ${creationId} status: ${statusCode}, waiting ${delay}ms...`
          );
        }
      }

      // Wait before next attempt with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 1.5, maxDelay); // Exponential backoff, max 30s
    } catch (error) {
      if (attempts >= maxAttempts) {
        throw error;
      }
      console.warn(
        `⚠️ [SERVER] Error checking status (attempt ${attempts}/${maxAttempts}):`,
        error
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 1.5, maxDelay);
    }
  }

  throw new Error(
    `Media ${creationId} did not become ready after ${maxAttempts} attempts (timeout ~${Math.round((delay * maxAttempts) / 1000)}s)`
  );
}

export async function postToInstagram({
  caption,
  imageUrls,
}: {
  caption: string;
  imageUrls?: string[];
}): Promise<{ success: boolean; id?: string; permalink?: string }> {
  console.log("🚀 [SERVER] Starting Instagram post...");
  console.log("📝 Caption:", caption);
  console.log("🖼️ Images:", imageUrls?.length || 0);

  const instagramBusinessId = process.env.INSTAGRAM_BUSINESS_ID!;
  if (!instagramBusinessId) throw new Error("INSTAGRAM_BUSINESS_ID mangler");

  const accessToken = process.env.FB_SYSTEM_USER_TOKEN!;
  if (!accessToken) {
    throw new Error("FB_SYSTEM_USER_TOKEN mangler");
  }

  if (!imageUrls || imageUrls.length === 0) {
    throw new Error("Instagram kræver mindst ét billede");
  }

  // Validate all URLs
  for (const url of imageUrls) {
    if (!/^https:\/\//i.test(url)) {
      throw new Error(
        "Alle billede URLs skal være offentligt tilgængelige HTTPS-URLs"
      );
    }
  }

  try {
    // Hvis kun ét billede - brug single image post
    if (imageUrls.length === 1) {
      const mediaRes = await fetch(
        `https://graph.facebook.com/v20.0/${instagramBusinessId}/media`,
        {
          method: "POST",
          body: new URLSearchParams({
            image_url: imageUrls[0],
            caption,
            access_token: accessToken,
          }),
        }
      );

      const mediaData = await mediaRes.json();
      if (!mediaRes.ok) {
        console.error("Instagram single media upload error:", mediaData);
        const msg = mediaData?.error?.message || "Ukendt fejl ved upload";
        throw new Error(`Kunne ikke uploade billede: ${msg}`);
      }

      const creationId = mediaData.id as string | undefined;
      if (!creationId) {
        throw new Error("Creation ID mangler efter media-upload");
      }

      console.log("✅ [SERVER] Instagram single media uploaded:", creationId);

      // Poll status until ready
      console.log("⏳ [SERVER] Waiting for media to be ready...");
      await pollMediaStatus(creationId, accessToken);

      // Publicér single image (with retry logic)
      let publishAttempts = 0;
      const maxPublishAttempts = 8;
      const publishRetryDelays = [2000, 4000, 8000, 16000, 30000, 30000, 30000, 30000];
      let publishedId: string | undefined;

      while (publishAttempts < maxPublishAttempts) {
        publishAttempts++;

        const publishRes = await fetch(
          `https://graph.facebook.com/v20.0/${instagramBusinessId}/media_publish`,
          {
            method: "POST",
            body: new URLSearchParams({
              creation_id: creationId,
              access_token: accessToken,
            }),
          }
        );

        const publishData = await publishRes.json();

        if (publishRes.ok) {
          publishedId = publishData.id as string | undefined;
          console.log("✅ [SERVER] Instagram single post published:", publishedId);
          break; // Success, exit retry loop
        }

        // Check if it's the specific retryable error
        if (
          publishData?.error?.code === 9007 &&
          publishData?.error?.error_subcode === 2207027
        ) {
          if (publishAttempts < maxPublishAttempts) {
            const delay = publishRetryDelays[publishAttempts - 1] || 30000;
            console.log(
              `⏳ [SERVER] Media not ready for publish (attempt ${publishAttempts}/${maxPublishAttempts}), waiting ${delay}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          } else {
            throw new Error(
              "Media blev ikke klar til publicering efter flere forsøg. Prøv igen senere."
            );
          }
        } else {
          // Non-retryable error
          console.error("Instagram single publish error:", publishData);
          const msg = publishData?.error?.message || "Ukendt fejl ved publish";
          throw new Error(`Kunne ikke publicere opslag: ${msg}`);
        }
      }

      if (!publishedId) {
        throw new Error(
          "Kunne ikke publicere opslag efter flere forsøg. Media blev ikke klar."
        );
      }

      // Fetch permalink
      let permalink: string | undefined;
      if (publishedId) {
        try {
          const permalinkRes = await fetch(
            `https://graph.facebook.com/v20.0/${publishedId}?fields=permalink&access_token=${accessToken}`
          );

          if (permalinkRes.ok) {
            const permalinkData = await permalinkRes.json();
            permalink = permalinkData.permalink;
            console.log(
              "✅ [SERVER] Instagram permalink retrieved:",
              permalink
            );
          } else {
            console.warn("⚠️ [SERVER] Could not fetch Instagram permalink");
          }
        } catch (permalinkError) {
          console.warn(
            "⚠️ [SERVER] Error fetching Instagram permalink:",
            permalinkError
          );
        }
      }

      return { success: true, id: publishedId, permalink };
    }

    // Hvis flere billeder - brug carousel post
    console.log(
      "🔄 [SERVER] Creating Instagram carousel with",
      imageUrls.length,
      "images"
    );

    // 1) Upload alle billeder som carousel items
    const carouselItemIds: string[] = [];

    for (let i = 0; i < imageUrls.length; i++) {
      const itemRes = await fetch(
        `https://graph.facebook.com/v20.0/${instagramBusinessId}/media`,
        {
          method: "POST",
          body: new URLSearchParams({
            image_url: imageUrls[i],
            is_carousel_item: "true",
            access_token: accessToken,
          }),
        }
      );

      const itemData = await itemRes.json();
      if (!itemRes.ok) {
        console.error(
          `Instagram carousel item ${i + 1} upload error:`,
          itemData
        );
        const msg = itemData?.error?.message || "Ukendt fejl ved upload";
        throw new Error(`Kunne ikke uploade billede ${i + 1}: ${msg}`);
      }

      const itemId = itemData.id as string | undefined;
      if (!itemId) {
        throw new Error(`Item ID mangler for billede ${i + 1}`);
      }

      console.log(
        `✅ [SERVER] Instagram carousel item ${i + 1} uploaded:`,
        itemId
      );

      // Poll status until ready
      console.log(
        `⏳ [SERVER] Waiting for carousel item ${i + 1} to be ready...`
      );
      await pollMediaStatus(itemId, accessToken);

      carouselItemIds.push(itemId);
    }

    // 2) Opret carousel container
    const carouselRes = await fetch(
      `https://graph.facebook.com/v20.0/${instagramBusinessId}/media`,
      {
        method: "POST",
        body: new URLSearchParams({
          media_type: "CAROUSEL",
          children: carouselItemIds.join(","),
          caption,
          access_token: accessToken,
        }),
      }
    );

    const carouselData = await carouselRes.json();
    if (!carouselRes.ok) {
      console.error("Instagram carousel creation error:", carouselData);
      const msg =
        carouselData?.error?.message || "Ukendt fejl ved carousel oprettelse";
      throw new Error(`Kunne ikke oprette carousel: ${msg}`);
    }

    const carouselId = carouselData.id as string | undefined;
    if (!carouselId) {
      throw new Error("Carousel ID mangler efter oprettelse");
    }

    console.log("✅ [SERVER] Instagram carousel created:", carouselId);

    // Poll carousel container status until ready
    console.log("⏳ [SERVER] Waiting for carousel container to be ready...");
    await pollMediaStatus(carouselId, accessToken);

    // 3) Publicér carousel (med retry logic for Instagram processing)
    let publishAttempts = 0;
    const maxAttempts = 8;
    const publishRetryDelays = [2000, 4000, 8000, 16000, 30000, 30000, 30000, 30000];
    let publishedId: string | undefined;

    while (publishAttempts < maxAttempts) {
      publishAttempts++;

      try {
        const publishRes = await fetch(
          `https://graph.facebook.com/v20.0/${instagramBusinessId}/media_publish`,
          {
            method: "POST",
            body: new URLSearchParams({
              creation_id: carouselId,
              access_token: accessToken,
            }),
          }
        );

        const publishData = await publishRes.json();

        if (publishRes.ok) {
          publishedId = publishData.id as string | undefined;
          console.log("✅ [SERVER] Instagram carousel published:", publishedId);
          break; // Success, exit retry loop
        }

        // Check if it's a retryable error
        if (
          publishData?.error?.code === 9007 &&
          publishData?.error?.error_subcode === 2207027
        ) {
          if (publishAttempts < maxAttempts) {
            const delay = publishRetryDelays[publishAttempts - 1] || 30000;
            console.log(
              `⏳ [SERVER] Media not ready for publish (attempt ${publishAttempts}/${maxAttempts}), waiting ${delay}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue; // Retry
          } else {
            throw new Error(
              "Media blev ikke klar til publicering efter flere forsøg. Prøv igen senere."
            );
          }
        } else {
          // Non-retryable error
          console.error("Instagram carousel publish error:", publishData);
          const msg = publishData?.error?.message || "Ukendt fejl ved publish";
          throw new Error(`Kunne ikke publicere carousel: ${msg}`);
        }
      } catch (fetchError) {
        if (publishAttempts >= maxAttempts) {
          throw fetchError;
        }
        const delay = publishRetryDelays[publishAttempts - 1] || 30000;
        console.log(
          `⏳ [SERVER] Network error, attempt ${publishAttempts}/${maxAttempts}. Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    if (!publishedId) {
      throw new Error(
        "Kunne ikke publicere carousel efter flere forsøg. Media blev ikke klar."
      );
    }

    // 4) Fetch permalink
    let permalink: string | undefined;
    if (publishedId) {
      try {
        const permalinkRes = await fetch(
          `https://graph.facebook.com/v20.0/${publishedId}?fields=permalink&access_token=${accessToken}`
        );

        if (permalinkRes.ok) {
          const permalinkData = await permalinkRes.json();
          permalink = permalinkData.permalink;
          console.log(
            "✅ [SERVER] Instagram carousel permalink retrieved:",
            permalink
          );
        } else {
          console.warn(
            "⚠️ [SERVER] Could not fetch Instagram carousel permalink"
          );
        }
      } catch (permalinkError) {
        console.warn(
          "⚠️ [SERVER] Error fetching Instagram carousel permalink:",
          permalinkError
        );
      }
    }

    return { success: true, id: publishedId, permalink };
  } catch (error) {
    console.error("❌ [SERVER] Instagram posting failed:", error);
    throw error;
  }
}
