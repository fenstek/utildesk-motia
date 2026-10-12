const PREVIEW_HASH = "#shader-preview";
const panel = document.querySelector("[data-shader-preview-panel]");
const status = document.querySelector("[data-shader-preview-status]");
const closeButton = document.querySelector("[data-shader-preview-close]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let generation = 0;
let mountPromise = null;
let animationFrame = 0;
const shaderInstances = new Set();
const failedCanvases = new Set();

const isEnglish = document.documentElement.lang.toLowerCase().startsWith("en");
const messages = isEnglish
  ? {
      loading: "Loading the three GPU effects…",
      ready: "The three Shaders effects are running in this preview.",
      unsupported: "WebGPU is unavailable in this browser. The static artwork and paper texture remain visible.",
      noAdapter: "This browser exposes WebGPU, but no GPU adapter is available here. Static fallbacks remain visible.",
      fallback: "A GPU effect could not start. Its static fallback remains visible.",
      close: "Close preview",
    }
  : {
      loading: "Die drei GPU-Effekte werden geladen …",
      ready: "Alle drei Shaders-Effekte laufen in dieser Vorschau.",
      unsupported: "WebGPU ist in diesem Browser nicht verfügbar. Das Titelbild und die Papier-Fallback-Textur bleiben sichtbar.",
      noAdapter: "Dieser Browser stellt WebGPU bereit, aber hier ist kein GPU-Adapter verfügbar. Die statischen Fallbacks bleiben sichtbar.",
      fallback: "Ein GPU-Effekt konnte nicht starten. Die statische Ersatzdarstellung bleibt sichtbar.",
      close: "Vorschau schließen",
    };

function setStatus(message) {
  if (status) status.textContent = message;
}

function markReady(canvas) {
  canvas.dataset.ready = "true";
  if (canvas.dataset.shaderCanvas === "cover") {
    canvas.closest(".ds-shader-preview-stage")?.classList.add("is-ready");
  }
}

function markFailed(canvas, reason = "init-failed") {
  failedCanvases.add(canvas);
  delete canvas.dataset.ready;
  canvas.dataset.failure = String(reason).slice(0, 40);
  canvas.closest(".ds-shader-preview-stage")?.classList.remove("is-ready");
  setStatus(reason === "no-adapter" || reason === "no-device" || reason === "unsupported" ? messages.noAdapter : messages.fallback);
}

function imageUrlFor(canvas) {
  const image = canvas.closest("[data-shader-preview-stage]")?.querySelector("img");
  const source = image?.getAttribute("src");
  if (!source) throw new Error("Preview image is missing");
  return new URL(source, document.baseURI).href;
}

function componentsFor(canvas) {
  const kind = canvas.dataset.shaderCanvas;

  if (kind === "cover") {
    const url = imageUrlFor(canvas);
    return [
      {
        type: "Halftone",
        props: { style: "classic", frequency: 34, angle: 45, paperColor: "#f3efdf", blackColor: "#27231f" },
        children: [
          {
            type: "Duotone",
            props: { colorA: "#2b2721", colorB: "#b33a2f", blend: 0.48, colorSpace: "linear" },
            children: [
              {
                type: "NoiseDissolve",
                id: "noise-reveal",
                props: { progress: prefersReducedMotion.matches ? 0 : 1, scale: 6, softness: 0.22, seed: 7 },
                children: [{ type: "ImageTexture", props: { url, objectFit: "cover" } }],
              },
            ],
          },
        ],
      },
    ];
  }

  if (kind === "paper") {
    return [
      {
        type: "Paper",
        props: { roughness: 0.34, grainScale: 1.35, displacement: 0.12, seed: 23 },
        children: [{ type: "SolidColor", props: { color: "#f3efdf" } }],
      },
    ];
  }

  return [];
}

function animateReveal(instance, token) {
  if (prefersReducedMotion.matches) {
    instance.update("noise-reveal", { progress: 0 });
    return;
  }

  const startedAt = performance.now();
  const duration = 700;

  const frame = (now) => {
    if (token !== generation) return;
    const progress = Math.max(0, 1 - (now - startedAt) / duration);
    instance.update("noise-reveal", { progress });
    if (progress > 0) animationFrame = requestAnimationFrame(frame);
  };

  animationFrame = requestAnimationFrame(frame);
}

async function mountPreview(token) {
  if (!panel || !status) return;
  panel.hidden = false;
  document.documentElement.dataset.shaderPreview = "true";
  setStatus(messages.loading);

  if (!navigator.gpu) {
    setStatus(messages.unsupported);
    return;
  }

  try {
    const { createShader } = await import("shaders/js");
    if (token !== generation) return;

    const canvases = Array.from(document.querySelectorAll("[data-shader-canvas]"));
    await Promise.all(
      canvases.map(async (canvas) => {
        try {
          const instance = await createShader(
            canvas,
            { components: componentsFor(canvas) },
            {
              disableTelemetry: true,
              onReady: () => {
                if (token === generation && !failedCanvases.has(canvas)) markReady(canvas);
              },
              onError: (reason) => {
                if (token === generation) markFailed(canvas, reason);
              },
            },
          );

          if (token !== generation) {
            instance.destroy();
            return;
          }

          shaderInstances.add(instance);
          if (canvas.dataset.shaderCanvas === "cover" && !failedCanvases.has(canvas)) {
            animateReveal(instance, token);
          }
        } catch {
          if (token === generation) markFailed(canvas, "init-failed");
        }
      }),
    );

    if (token === generation && failedCanvases.size === 0) setStatus(messages.ready);
  } catch {
    if (token === generation) setStatus(messages.fallback);
  }
}

function openPreview() {
  if (!panel || window.location.hash !== PREVIEW_HASH) return;
  panel.hidden = false;
  document.documentElement.dataset.shaderPreview = "true";
  if (mountPromise) return;
  const token = ++generation;
  mountPromise = mountPreview(token);
}

function closePreview() {
  generation += 1;
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = 0;
  for (const instance of shaderInstances) instance.destroy();
  shaderInstances.clear();
  failedCanvases.clear();
  panel?.setAttribute("hidden", "");
  delete document.documentElement.dataset.shaderPreview;
  document.querySelectorAll("[data-shader-canvas]").forEach((canvas) => {
    delete canvas.dataset.ready;
    delete canvas.dataset.failure;
    canvas.closest(".ds-shader-preview-stage")?.classList.remove("is-ready");
  });
  mountPromise = null;
}

closeButton?.addEventListener("click", () => {
  if (window.location.hash === PREVIEW_HASH) {
    window.history.replaceState(window.history.state, document.title, `${window.location.pathname}${window.location.search}`);
  }
  closePreview();
});

window.addEventListener("hashchange", () => {
  if (window.location.hash === PREVIEW_HASH) openPreview();
  else closePreview();
});

openPreview();
