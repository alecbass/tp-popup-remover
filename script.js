/** Removes the shorts reel and advertisement containers on a Youtube page */
const removeShortsAndAds = () => {
  const shortsPanels = [
    ...document.querySelectorAll("ytd-rich-shelf-renderer"),
    ...document.querySelectorAll("ytd-reel-shelf-renderer"),
    ...document.querySelectorAll("ytd-ad-slot-renderer"),
  ];

  for (const shortsPanel of shortsPanels) {
    shortsPanel.remove();
  }
};

/** DOM elements which prevent you from clicking on a Youtube video */
const IDENTIFIERS = ["tp-yt-iron-overlay-backdrop", "ytd-popup-container"];

/** Has the popup appeared? If this is true, then it means the popup has been removed at some point */
let hasRemoved = false;

/** Has the video been auto-resumed after the inital pause? */
let hasResumedVideo = false;

/**
    Retrieves the primary Youtube video
    @returns {HTMLVideoElement | null} The video, if it exists
*/
const getPrimaryVideo = () => document.querySelector("video.html5-main-video");

/**
    Removes the popup from the DOM and resumes the video (the popup trigger pauses it).
    @returns {boolean} True if the popup was removed, false otherwise
*/
const removePopup = () => {
  if (hasRemoved) {
    return false;
  }

  /** Has the popup been removed within this check? */
  let didRemoveThisTime = false;

  for (const identifier of IDENTIFIERS) {
    const element = document.querySelector(identifier);

    if (element) {
      element.remove();
      didRemoveThisTime = true;
    }
  }

  // Mark the popup as having been removed, so we don't try again
  hasRemoved = didRemoveThisTime;

  return didRemoveThisTime;
};

/** Resumes the primary video after the initial pause */
const resumeVideoOnce = () => {
  if (hasRemoved && hasResumedVideo) {
    // The video gets paused AFTER the popup appears
    return;
  }

  const video = getPrimaryVideo();
  if (video?.paused && video.currentTime > 0.0) {
    video.play();
    hasResumedVideo = true;
  }
};

// Keep track of if the URL changes so we can resume the new video
let oldHref = window.location.href;

const observer = new MutationObserver(() => {
  // Potentially remove the popup blocker and resume the video after the page loads
  const didRemove = removePopup();

  if (didRemove) {
    resumeVideoOnce();
  }

  if (!window.location.href.includes("watch?v=")) {
    // Remove the shorts panel
    removeShortsAndAds();
  }

  if (window.location.href !== oldHref) {
    // Video has changed
    // The popup only appears once per Youtube session, so even if you navigate between multiple videos, it won't
    // appear again. We only need to reset the video state
    hasResumedVideo = false;
    oldHref = window.location.href;
  }
});

if (window.location.hostname === "www.youtube.com") {
  observer.observe(document.body, { childList: true, subtree: true });
  // Don't worry about disconnecting
}
