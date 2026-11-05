import "./home-animation-swarm.css";

const selectors = [
  ".ds-masthead-ki-side",
  ".ds-masthead-ki-main > span",
  ".ds-masthead-ki-main > p",
  ".ds-front-main > .ds-kicker",
  ".ds-front-main > h2",
  ".ds-front-main > .ds-dek",
  ".ds-front-main > .ds-verdict",
  ".ds-front-main > .ds-front-actions",
  ".ds-front-aside-test > .ds-test-table",
  ".ds-front-aside-test > .ds-box",
  ".ds-stack > article",
  ".ds-evidence > div",
  ".ds-anti > h2",
  ".ds-anti > div > article",
  ".ds-tasks > .ds-kicker",
  ".ds-tasks > h2",
  ".ds-tasks > div > a",
  ".ds-index-head",
  ".ds-index-table-head",
  ".ds-index-row",
  ".ds-index-top-tags",
];

const colors = [
  "#78caff", "#ffcc75", "#e8a2ff", "#8ce5c0", "#ff9c91",
  "#b9c4ff", "#f0a9c7", "#cbe38a", "#90dbec", "#f2b88e",
  "#d9b2fc", "#9ce0a0", "#ffe192", "#e8b5a6",
];
const MAX_TARGETS = 56;
const REPEATED_TARGET_LIMITS = [
  [".ds-index-row", 12],
  [".ds-stack > article", 8],
  [".ds-tasks > div > a", 8],
];

function wait(ms, signal) {
  if (signal.aborted) return Promise.resolve(false);
  return new Promise((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => finish(true), ms);
    function finish(completed) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      resolve(completed);
    }
    function onAbort() { finish(false); }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function isAvailable(element) {
  if (!element.isConnected || !element.getClientRects().length) return false;
  if (getComputedStyle(element).visibility === "hidden") return false;
  return !element.closest("[hidden], [inert]");
}

function visibleInViewport(element) {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 &&
    rect.top < window.innerHeight && rect.left < window.innerWidth;
}

function sampleEvenly(elements, limit) {
  if (elements.length <= limit) return elements;
  if (limit <= 1) return [elements[0]];
  return Array.from({ length: limit }, (_, index) =>
    elements[Math.round(index * (elements.length - 1) / (limit - 1))],
  );
}

function collectTargets() {
  const available = Array.from(new Set(document.querySelectorAll(selectors.join(","))))
    .filter(isAvailable);
  const selected = available.filter((element) =>
    !REPEATED_TARGET_LIMITS.some(([selector]) => element.matches(selector)),
  );

  for (const [selector, limit] of REPEATED_TARGET_LIMITS) {
    selected.push(...sampleEvenly(available.filter((element) => element.matches(selector)), limit));
  }

  const unique = Array.from(new Set(selected)).sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return Math.abs(ar.top - br.top) > 12 ? ar.top - br.top : ar.left - br.left;
    });
  return sampleEvenly(unique, MAX_TARGETS)
    .map((element) => ({ element, opacity: getComputedStyle(element).opacity }));
}

function makeSvgCursor(color) {
  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  svg.setAttribute("viewBox", "0 0 22 26");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(namespace, "path");
  path.setAttribute("d", "M2 1.5v19l5-4.8 3.5 7.3 3.8-1.7-3.5-7.2 7.1-.7z");
  path.setAttribute("fill", color);
  path.setAttribute("stroke", "#171716");
  path.setAttribute("stroke-width", "1.15");
  path.setAttribute("stroke-linejoin", "round");
  svg.append(path);
  return svg;
}

function makeCursors(stage, isEnglish) {
  const amount = window.innerWidth < 600 ? 9 : 14;
  const names = isEnglish
    ? ["Layout", "Type", "Editorial", "Details", "Grid", "Research"]
    : ["Layout", "Typografie", "Redaktion", "Details", "Raster", "Recherche"];

  return Array.from({ length: amount }, (_, index) => {
    const color = colors[index % colors.length];
    const element = document.createElement("div");
    element.className = "home-motion-swarm-cursor";
    element.style.setProperty("--home-motion-cursor-color", color);
    element.append(makeSvgCursor(color));
    if (index < names.length) {
      const label = document.createElement("span");
      label.className = "home-motion-swarm-label";
      label.textContent = names[index];
      element.append(label);
    }
    const x = index % 2 ? window.innerWidth + 30 : -50;
    const y = 36 + (index * 79) % Math.max(120, window.innerHeight - 100);
    element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    stage.append(element);
    return { element, color };
  });
}

function moveCursor(cursor, x, y) {
  const maxX = Math.max(18, window.innerWidth - 28);
  const maxY = Math.max(18, window.innerHeight - 34);
  cursor.element.style.transform = `translate3d(${clamp(x, 2, maxX)}px, ${clamp(y, 2, maxY)}px, 0)`;
  cursor.element.classList.add("is-visible");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function describeTarget(element, isEnglish) {
  if (element.matches("h1,h2,h3")) return isEnglish ? "Heading" : "Überschrift";
  if (element.matches("p")) return isEnglish ? "Text" : "Text";
  if (element.matches("a")) return isEnglish ? "Entry" : "Eintrag";
  if (element.matches("article")) return isEnglish ? "Article" : "Beitrag";
  return isEnglish ? "Layout" : "Layout";
}

function createSelection(stage, target, cursor, isEnglish) {
  const element = target.element;
  const rect = element.getBoundingClientRect();
  const frame = document.createElement("div");
  frame.className = "home-motion-swarm-selection";
  frame.style.setProperty("--home-motion-cursor-color", cursor.color);
  frame.style.left = `${Math.round(rect.left)}px`;
  frame.style.top = `${Math.round(rect.top)}px`;
  frame.style.width = `${Math.max(2, Math.round(rect.width))}px`;
  frame.style.height = `${Math.max(2, Math.round(rect.height))}px`;

  const caption = document.createElement("span");
  caption.className = "home-motion-swarm-caption";
  caption.textContent = describeTarget(element, isEnglish);
  const size = document.createElement("span");
  size.className = "home-motion-swarm-size";
  size.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
  frame.append(caption, size);
  stage.append(frame);
  return frame;
}

async function reveal(target, cursor, index, stage, isEnglish, signal, animations, onProgress, count) {
  const element = target.element;
  if (!isAvailable(element) || !visibleInViewport(element)) {
    element.classList.remove("home-motion-swarm-pending");
    return false;
  }

  const frame = createSelection(stage, target, cursor, isEnglish);
  const rect = element.getBoundingClientRect();
  const offsetX = Math.min(18 + (index % 3) * 24, Math.max(2, rect.width - 4));
  moveCursor(cursor, rect.left + offsetX, rect.top + 3);
  if (!await wait(360, signal)) {
    frame.remove();
    return false;
  }

  element.classList.remove("home-motion-swarm-pending");
  let animation = null;
  if (typeof element.animate === "function") {
    animation = element.animate(
      [
        { opacity: 0, clipPath: "inset(0 14% 0 0)" },
        { opacity: target.opacity, clipPath: "inset(0 0 0 0)" },
      ],
      { duration: 440, easing: "cubic-bezier(.16, 1, .3, 1)" },
    );
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
  }
  const completed = count.value + 1;
  count.value = completed;
  onProgress((completed / count.total) * 100);
  if (!await wait(210, signal)) {
    frame.remove();
    return false;
  }
  if (animation) await animation.finished.catch(() => undefined);
  frame.remove();
  return true;
}

async function ensureVisible(target, signal, setAutoScrolling) {
  const element = target.element;
  if (!isAvailable(element)) return false;
  const rect = element.getBoundingClientRect();
  const upper = Math.max(72, window.innerHeight * 0.13);
  const lower = window.innerHeight * 0.82;
  if (rect.top < upper || rect.bottom > lower) {
    const targetTop = Math.max(0, window.scrollY + rect.top - window.innerHeight * 0.23);
    if (Math.abs(targetTop - window.scrollY) > 4) {
      setAutoScrolling(true);
      window.scrollTo({ top: targetTop, behavior: "smooth" });
      const deadline = performance.now() + 2400;
      let stableFrames = 0;
      let previousScrollY = window.scrollY;
      while (performance.now() < deadline && stableFrames < 3) {
        const completed = await wait(80, signal);
        if (!completed) return false;
        const nextScrollY = window.scrollY;
        if (visibleInViewport(element) && Math.abs(nextScrollY - previousScrollY) < 1) stableFrames += 1;
        else stableFrames = 0;
        previousScrollY = nextScrollY;
      }
      if (stableFrames < 3) window.scrollTo({ top: window.scrollY, behavior: "instant" });
      setAutoScrolling(false);
    }
  }
  return isAvailable(element) && visibleInViewport(element);
}

export async function play({ signal, locale, onStatus, onProgress }) {
  const isEnglish = locale === "en";
  window.scrollTo({ top: 0, behavior: "instant" });
  const targets = collectTargets();
  if (!targets.length) return { result: "empty" };
  if (signal.aborted) return { result: "stopped" };

  const stage = document.createElement("div");
  stage.id = "home-motion-swarm-stage";
  stage.setAttribute("aria-hidden", "true");
  const cursors = makeCursors(stage, isEnglish);
  const animations = new Set();
  const count = { value: 0, total: targets.length };
  let autoScrolling = false;
  const finish = () => {
    if (autoScrolling) {
      window.scrollTo({ top: window.scrollY, behavior: "instant" });
      autoScrolling = false;
    }
    for (const target of targets) target.element.classList.remove("home-motion-swarm-pending");
    for (const animation of animations) animation.cancel();
    animations.clear();
    stage.replaceChildren();
    stage.remove();
  };

  targets.forEach((target) => target.element.classList.add("home-motion-swarm-pending"));
  document.body.append(stage);
  onProgress(0);
  onStatus(isEnglish ? "The current page is taking shape…" : "Die aktuelle Seite entsteht …");

  try {
    if (!await wait(120, signal)) return { result: "stopped" };
    if (!await wait(80, signal)) return { result: "stopped" };
    cursors.forEach((cursor, index) => {
      const x = window.innerWidth * (0.12 + ((index * 19) % 74) / 100);
      const y = window.innerHeight * (0.12 + ((index * 23) % 66) / 100);
      moveCursor(cursor, x, y);
    });
    if (!await wait(700, signal)) return { result: "stopped" };

    for (let index = 0; index < targets.length;) {
      if (signal.aborted) return { result: "stopped" };
      const first = targets[index];
      if (!await ensureVisible(first, signal, (value) => { autoScrolling = value; })) {
        if (signal.aborted) return { result: "stopped" };
        first.element.classList.remove("home-motion-swarm-pending");
        count.total = Math.max(count.value, count.total - 1);
        index += 1;
        continue;
      }

      const group = [first];
      const next = targets[index + 1];
      if (next && isAvailable(next.element) && visibleInViewport(next.element)) {
        const nextRect = next.element.getBoundingClientRect();
        if (nextRect.top >= 45 && nextRect.bottom < window.innerHeight - 115) group.push(next);
      }
      const busy = new Set();
      const workers = group.map((_, offset) => {
        const cursor = cursors[(index * 3 + offset * 5) % cursors.length];
        busy.add(cursor);
        return cursor;
      });
      const area = group[0].element.getBoundingClientRect();
      let extra = 0;
      for (const cursor of cursors) {
        if (busy.has(cursor)) continue;
        const angle = (index + extra * 1.7) * 0.8;
        const radius = 32 + (extra % 3) * 18;
        moveCursor(cursor, area.left + area.width * 0.5 + Math.cos(angle) * radius, area.top + area.height * 0.5 + Math.sin(angle) * radius);
        extra += 1;
        if (extra >= 5) break;
      }
      const results = await Promise.all(group.map((target, offset) =>
        reveal(target, workers[offset], index + offset, stage, isEnglish, signal, animations, onProgress, count),
      ));
      if (results.some((completed) => !completed) && signal.aborted) return { result: "stopped" };
      const skipped = results.filter((completed) => !completed).length;
      if (skipped) count.total = Math.max(count.value, count.total - skipped);
      onStatus(isEnglish
        ? `Assembling the page · ${Math.min(count.value, count.total)} of ${count.total}`
        : `Die Seite entsteht · ${Math.min(count.value, count.total)} von ${count.total}`);
      index += group.length;
    }

    onStatus(isEnglish ? "The page is assembled." : "Die Seite ist aufgebaut.");
    onProgress(100);
    if (!await wait(460, signal)) return { result: "stopped" };
    return { result: "complete" };
  } finally {
    finish();
  }
}
