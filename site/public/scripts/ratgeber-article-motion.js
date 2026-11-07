(() => {
  const motionPreference = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false, addEventListener() {} };

  const initialize = () => {
    const motions = document.querySelectorAll("[data-article-motion]");

    for (const motion of motions) {
      const video = motion.querySelector("[data-motion-video]");
      const button = motion.querySelector("[data-article-motion-toggle]");
      const icon = motion.querySelector("[data-motion-icon]");
      const label = motion.querySelector("[data-motion-label]");
      if (!video || !button || !icon || !label) continue;

      let loaded = false;
      let inView = false;
      let userPaused = false;
      let manuallyStarted = false;

      const syncButton = () => {
        const playing = !video.paused && !video.ended;
        button.setAttribute("aria-pressed", String(playing));
        label.textContent = playing ? video.dataset.pauseLabel : video.dataset.playLabel;
        icon.textContent = playing ? "Ⅱ" : "▶";
        motion.toggleAttribute("data-motion-playing", playing);
      };

      const loadVideo = () => {
        if (loaded) return;
        const source = video.dataset.src;
        if (!source) return;
        loaded = true;
        video.poster = video.dataset.poster || "";
        video.src = source;
        video.load();
      };

      const playVideo = async (manual = false) => {
        if (manual) {
          manuallyStarted = true;
          userPaused = false;
        }
        loadVideo();
        try {
          await video.play();
        } catch {
          syncButton();
        }
      };

      button.addEventListener("click", () => {
        if (!video.paused && !video.ended) {
          userPaused = true;
          video.pause();
          return;
        }
        void playVideo(true);
      });

      video.addEventListener("play", syncButton);
      video.addEventListener("pause", syncButton);
      video.addEventListener("ended", syncButton);
      video.addEventListener("canplay", () => motion.setAttribute("data-motion-ready", ""));
      video.addEventListener("error", () => motion.removeAttribute("data-motion-ready"));

      const observer = typeof IntersectionObserver === "function"
        ? new IntersectionObserver((entries) => {
            for (const entry of entries) {
              if (entry.target !== motion) continue;
              inView = entry.isIntersecting;
              if (!inView) {
                video.pause();
              } else if (!motionPreference.matches && !userPaused) {
                void playVideo(false);
              }
            }
          }, { rootMargin: "240px 0px" })
        : null;

      if (observer) {
        observer.observe(motion);
      } else {
        inView = true;
        if (!motionPreference.matches) void playVideo(false);
      }

      motionPreference.addEventListener?.("change", (event) => {
        if (event.matches && !manuallyStarted) {
          video.pause();
        } else if (!event.matches && inView && !userPaused) {
          void playVideo(false);
        }
      });

      syncButton();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
