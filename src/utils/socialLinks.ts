export const openFacebookLink = (url: string) => {
  const postIdMatch = url.match(/facebook\.com\/(\d+)/);

  if (postIdMatch) {
    const postId = postIdMatch[1];
    const fbAppUrl = `fb://story?story_fbid=${postId}`;

    try {
      window.location.href = fbAppUrl;

      setTimeout(() => {
        window.open(url, "_blank", "noopener,noreferrer");
      }, 1000);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

export const openInstagramLink = (url: string) => {
  const shortcodeMatch = url.match(/instagram\.com\/p\/([^\/]+)/);

  if (shortcodeMatch) {
    const shortcode = shortcodeMatch[1];
    const igAppUrl = `instagram://p/${shortcode}`;

    try {
      window.location.href = igAppUrl;

      setTimeout(() => {
        window.open(url, "_blank", "noopener,noreferrer");
      }, 1000);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

export const openSocialLink = (
  url: string,
  platform: "facebook" | "instagram"
) => {
  if (platform === "facebook") {
    openFacebookLink(url);
  } else if (platform === "instagram") {
    openInstagramLink(url);
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};
