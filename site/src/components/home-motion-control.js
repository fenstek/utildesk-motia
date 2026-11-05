const control = document.querySelector("[data-home-motion]");

if (control instanceof HTMLElement) {
  const choices = Array.from(control.querySelectorAll("[data-home-motion-choice]"));
  const runtime = control.querySelector("[data-home-motion-runtime]");
  const status = control.querySelector("[data-home-motion-status]");
  const progressWrap = control.querySelector("[data-home-motion-progress-wrap]");
  const progress = control.querySelector("[data-home-motion-progress]");
  const progressLabel = control.querySelector("[data-home-motion-progress-label]");
  const skipButton = control.querySelector("[data-home-motion-skip]");
  const closeButton = control.querySelector("[data-home-motion-close]");
  const isEnglish = document.documentElement.lang.toLowerCase().startsWith("en");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const copy = isEnglish
    ? {
        reduced: "Reduced motion is on. The live page stays in place; turn it off to play either view.",
        dialog: "Close the open dialog before starting a page view.",
        unsupported: "WebGL is unavailable here. The live page stays visible; use a browser with WebGL to view the fabric effect.",
        loadingCloth: "Preparing a live view of this page…",
        loadingSwarm: "Preparing the current page elements…",
        switching: "Switching page view…",
        complete: "View complete. Choose either button to play it again.",
        skipped: "View skipped. The live page is ready.",
        closed: "View closed. The live page is ready.",
        interrupted: "View ended. The live page is ready.",
        failed: "This view could not start. The live page is ready; choose either button to try again.",
      }
    : {
        reduced: "Bewegungsarmut ist aktiviert. Die aktuelle Seite bleibt sichtbar; deaktiviere sie für eine der Ansichten.",
        dialog: "Schließe den geöffneten Dialog, bevor du eine Seitenansicht startest.",
        unsupported: "WebGL ist hier nicht verfügbar. Die aktuelle Seite bleibt sichtbar; für den Stoffeffekt kannst du einen Browser mit WebGL verwenden.",
        loadingCloth: "Die aktuelle Seite wird vorbereitet …",
        loadingSwarm: "Die aktuellen Seitenelemente werden vorbereitet …",
        switching: "Die Seitenansicht wechselt …",
        complete: "Ansicht abgeschlossen. Mit einer der beiden Schaltflächen kannst du sie erneut starten.",
        skipped: "Ansicht übersprungen. Die aktuelle Seite ist wieder bereit.",
        closed: "Ansicht geschlossen. Die aktuelle Seite ist wieder bereit.",
        interrupted: "Ansicht beendet. Die aktuelle Seite ist wieder bereit.",
        failed: "Diese Ansicht ließ sich nicht starten. Die aktuelle Seite ist bereit; starte den Versuch über eine der Schaltflächen erneut.",
      };

  if (runtime && status && progress instanceof HTMLProgressElement && progressWrap && progressLabel && skipButton && closeButton) {
    let current = null;
    let requestNumber = 0;
    let placeholder = null;
    let savedFocus = null;
    let sessionListenerCleanup = null;
    const originalParent = control.parentNode;

    function updateProgress(value) {
      const percent = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
      progress.value = percent;
      progressLabel.textContent = `${percent}%`;
    }

    function publishStatus(message) {
      status.textContent = String(message || "");
      runtime.hidden = false;
    }

    function setChoiceState(mode) {
      for (const button of choices) {
        button.setAttribute("aria-pressed", String(button.dataset.homeMotionChoice === mode));
      }
    }

    function moveControlToOverlay() {
      if (control.parentElement === document.body) return;
      savedFocus = control.contains(document.activeElement) ? document.activeElement : null;
      const rect = control.getBoundingClientRect();
      placeholder = document.createElement("div");
      placeholder.className = "ds-home-motion home-motion-placeholder";
      placeholder.setAttribute("aria-hidden", "true");
      placeholder.setAttribute("data-home-motion-placeholder", "");
      placeholder.inert = true;
      placeholder.style.width = "100%";
      placeholder.style.height = `${rect.height}px`;
      placeholder.style.gridColumn = "1 / -1";
      const intro = control.querySelector(".ds-home-motion-intro")?.cloneNode(true);
      if (intro instanceof HTMLElement) {
        intro.removeAttribute("id");
        intro.querySelectorAll("[id], [data-home-motion-note]").forEach((element) => {
          element.removeAttribute("id");
          element.removeAttribute("data-home-motion-note");
        });
        placeholder.append(intro);
      }
      control.parentNode?.insertBefore(placeholder, control);
      document.body.append(control);
      control.dataset.homeMotionActive = "";
      updateConsentOffset();
      const focusTarget = savedFocus;
      requestAnimationFrame(() => focusTarget?.focus({ preventScroll: true }));
    }

    function restoreControl() {
      delete control.dataset.homeMotionActive;
      control.style.removeProperty("--home-motion-bottom");
      if (placeholder?.parentNode) placeholder.replaceWith(control);
      else if (originalParent?.isConnected && control.parentElement !== originalParent) originalParent.append(control);
      placeholder = null;
      const focusTarget = savedFocus;
      if (focusTarget instanceof HTMLElement && focusTarget.isConnected) {
        requestAnimationFrame(() => {
          if (focusTarget.isConnected) focusTarget.focus({ preventScroll: true });
        });
      }
      savedFocus = null;
    }

    function updateConsentOffset() {
      if (!control.hasAttribute("data-home-motion-active")) return;
      const consent = document.querySelector(".privacy-consent");
      if (!(consent instanceof HTMLElement) || consent.hidden) {
        control.style.setProperty("--home-motion-bottom", "max(12px, env(safe-area-inset-bottom))");
        return;
      }
      const consentRect = consent.getBoundingClientRect();
      const style = getComputedStyle(consent);
      if (style.display === "none" || style.visibility === "hidden" || consentRect.height < 1 || consentRect.top >= window.innerHeight) {
        control.style.setProperty("--home-motion-bottom", "max(12px, env(safe-area-inset-bottom))");
        return;
      }
      const offset = Math.ceil(window.innerHeight - consentRect.top + 12);
      control.style.setProperty("--home-motion-bottom", `${offset}px`);
    }

    function abortSession(session, reason) {
      if (!session || session.controller.signal.aborted) return;
      session.reason = reason;
      session.controller.abort(reason);
    }

    function installSessionListeners(session) {
      const signal = session.controller.signal;
      const abort = (reason) => abortSession(session, reason);
      const onPointerDown = (event) => {
        if (control.contains(event.target) || event.target instanceof Element && event.target.closest(".privacy-consent")) return;
        abort("interrupted");
      };
      const onKeyDown = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          abort("closed");
          return;
        }
        if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key) && !control.contains(document.activeElement)) {
          abort("interrupted");
        }
      };
      const onFocusIn = (event) => {
        if (!control.contains(event.target)) abort("interrupted");
      };
      const onVisibility = () => {
        if (document.hidden) abort("interrupted");
      };
      const onReducedMotion = (event) => {
        if (event.matches) abort("interrupted");
      };
      const signalOptions = { signal };

      document.addEventListener("pointerdown", onPointerDown, { capture: true, signal });
      document.addEventListener("keydown", onKeyDown, signalOptions);
      document.addEventListener("focusin", onFocusIn, signalOptions);
      document.addEventListener("visibilitychange", onVisibility, signalOptions);
      window.addEventListener("wheel", () => abort("interrupted"), { passive: true, signal });
      window.addEventListener("touchmove", () => abort("interrupted"), { passive: true, signal });
      window.addEventListener("resize", () => abort("interrupted"), { passive: true, signal });
      window.addEventListener("orientationchange", () => abort("interrupted"), { passive: true, signal });
      window.addEventListener("pagehide", () => abort("interrupted"), { once: true, signal });
      window.visualViewport?.addEventListener("resize", () => abort("interrupted"), { passive: true, signal });
      reducedMotion.addEventListener?.("change", onReducedMotion, signalOptions);

      const consent = document.querySelector(".privacy-consent");
      const observer = consent
        ? new MutationObserver(updateConsentOffset)
        : null;
      observer?.observe(consent, { attributes: true, attributeFilter: ["hidden", "style", "class"] });

      sessionListenerCleanup = () => {
        observer?.disconnect();
        sessionListenerCleanup = null;
      };
    }

    async function runSession(session) {
      try {
        const effect = session.mode === "cloth"
          ? await import("./home-animation-cloth.js")
          : await import("./home-animation-swarm.js");
        if (session.controller.signal.aborted) return;
        const result = await effect.play({
          signal: session.controller.signal,
          locale: isEnglish ? "en" : "de",
          onStatus: publishStatus,
          onProgress: updateProgress,
        });
        if (!session.controller.signal.aborted) {
          session.reason = result?.result === "complete" ? "complete"
            : result?.result === "unsupported" ? "unsupported"
              : "failed";
        }
      } catch {
        if (!session.controller.signal.aborted) session.reason = "failed";
      } finally {
        sessionListenerCleanup?.();
        if (!session.controller.signal.aborted) session.controller.abort("finished");
        if (current === session) {
          current = null;
          if (session.reason !== "switch") {
            const finalMessage = session.reason === "complete" ? copy.complete
              : session.reason === "unsupported" ? copy.unsupported
                : session.reason === "skipped" ? copy.skipped
                : session.reason === "closed" ? copy.closed
                  : session.reason === "failed" ? copy.failed
                    : copy.interrupted;
            publishStatus(finalMessage);
            progressWrap.hidden = true;
            skipButton.hidden = true;
            closeButton.hidden = true;
            setChoiceState("");
            restoreControl();
          }
        }
      }
    }

    async function requestMode(mode) {
      if (control.contains(document.activeElement)) savedFocus = document.activeElement;
      if (reducedMotion.matches) {
        publishStatus(copy.reduced);
        progressWrap.hidden = true;
        return;
      }
      if (document.querySelector("dialog[open]")) {
        publishStatus(copy.dialog);
        progressWrap.hidden = true;
        return;
      }

      const ticket = ++requestNumber;
      if (current) {
        const previous = current;
        if (previous.mode === mode && !previous.controller.signal.aborted) {
          previous.reason = "closed";
          previous.controller.abort("closed");
          await previous.done;
          return;
        }
        previous.reason = "switch";
        publishStatus(copy.switching);
        previous.controller.abort("switch");
        await previous.done;
        if (ticket !== requestNumber) return;
      }

      const session = {
        mode,
        controller: new AbortController(),
        reason: null,
        done: null,
      };
      current = session;
      moveControlToOverlay();
      runtime.hidden = false;
      progressWrap.hidden = false;
      skipButton.hidden = false;
      closeButton.hidden = false;
      updateProgress(0);
      setChoiceState(mode);
      publishStatus(mode === "cloth" ? copy.loadingCloth : copy.loadingSwarm);
      installSessionListeners(session);
      session.done = runSession(session);
    }

    for (const button of choices) {
      button.disabled = false;
      button.addEventListener("click", () => void requestMode(button.dataset.homeMotionChoice));
    }

    skipButton.addEventListener("click", () => {
      if (current) abortSession(current, "skipped");
    });
    closeButton.addEventListener("click", () => {
      if (current) abortSession(current, "closed");
    });

    const reducedMotionListener = (event) => {
      if (event.matches && current) abortSession(current, "interrupted");
    };
    reducedMotion.addEventListener?.("change", reducedMotionListener);

    window.addEventListener("pageshow", updateConsentOffset, { passive: true });
    updateConsentOffset();
  }
}
