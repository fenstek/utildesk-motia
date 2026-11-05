import "./home-animation-cloth.css";
import jetBrainsMonoLatin from "../assets/home-animation-fonts/JetBrainsMono-latin.woff2?inline";
import sourceSerif4Latin from "../assets/home-animation-fonts/SourceSerif4-latin.woff2?inline";
import sourceSerif4ItalicLatin from "../assets/home-animation-fonts/SourceSerif4-Italic-latin.woff2?inline";

const COLUMNS = 48;
const ROWS = 32;
const DURATION = 9300;
const MAX_CAPTURE_PIXELS = 2_300_000;
const MAX_FONT_FACE_RULES = 12;
const MAX_FONT_EMBED_CSS_CHARACTERS = 2_000_000;
const EMBEDDED_FONT_FAMILIES = new Set(["source serif 4", "jetbrains mono"]);
const LATIN_UNICODE_RANGE = "U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2C6, U+2DA, U+2DC, U+304, U+308, U+329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
const LOCAL_FONT_FACES = [
  { family: "source serif 4", style: "normal", weights: [400, 600, 700, 900], data: sourceSerif4Latin },
  { family: "source serif 4", style: "italic", weights: [400, 700, 900], data: sourceSerif4ItalicLatin },
  { family: "jetbrains mono", style: "normal", weights: [400, 500, 600, 700, 800], data: jetBrainsMonoLatin },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smoothstep = (start, end, value) => {
  const t = clamp((value - start) / (end - start), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeInOut = (value) => value < 0.5
  ? 4 * value * value * value
  : 1 - Math.pow(-2 * value + 2, 3) / 2;

function boundedWait(promises, timeout, signal) {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const timer = window.setTimeout(finish, timeout);
    function finish() {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      signal.removeEventListener("abort", finish);
      resolve();
    }
    signal.addEventListener("abort", finish, { once: true });
    Promise.all(promises).then(finish, finish);
  });
}

function waitForFonts(signal) {
  return document.fonts?.ready ? boundedWait([document.fonts.ready], 850, signal) : Promise.resolve();
}

function normalizeFontFamily(value) {
  return String(value || "").trim().replace(/^["']|["']$/g, "").trim().toLowerCase();
}

function parseWeightRange(value) {
  const weights = String(value || "400").trim().split(/\s+/).map((entry) => {
    if (entry === "normal") return 400;
    if (entry === "bold") return 700;
    return Number.parseFloat(entry);
  }).filter(Number.isFinite);
  if (!weights.length) return [400, 400];
  return [weights[0], weights[1] ?? weights[0]];
}

function weightRangeIncludes(value, weight) {
  const [minimum, maximum] = parseWeightRange(value);
  return weight >= minimum && weight <= maximum;
}

function parseUnicodeRanges(value) {
  const raw = String(value || "").trim();
  if (!raw || raw === "normal") return [[0, 0x10ffff]];

  const ranges = [];
  for (const token of raw.split(",")) {
    const match = token.trim().match(/^U\+([\da-f?]+)(?:-([\da-f]+))?$/i);
    if (!match) continue;
    if (match[1].includes("?")) {
      ranges.push([
        Number.parseInt(match[1].replace(/\?/g, "0"), 16),
        Number.parseInt(match[1].replace(/\?/g, "f"), 16),
      ]);
      continue;
    }
    const start = Number.parseInt(match[1], 16);
    const end = match[2] ? Number.parseInt(match[2], 16) : start;
    if (Number.isFinite(start) && Number.isFinite(end)) ranges.push([start, end]);
  }
  return ranges;
}

function codePointInRanges(codePoint, ranges) {
  return ranges.some(([start, end]) => codePoint >= start && codePoint <= end);
}

function collectVisibleFontUsage(width, height) {
  const usage = new Map();
  const excluded = "[data-home-motion], .privacy-consent, [data-privacy-consent], noscript, template, iframe, script, style, link, head, meta, title, astro-dev-toolbar, [data-astro-dev-toolbar], [data-astro-dev-toolbar-root], #astro-dev-toolbar, .astro-dev-toolbar, [data-astro-dev-overlay]";
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let node = walker.nextNode();
  let visited = 0;

  while (node && visited < 2200) {
    visited += 1;
    const textNode = node;
    const text = textNode.nodeValue || "";
    const parent = textNode.parentElement;
    node = walker.nextNode();
    if (!parent || !text.trim() || parent.closest(excluded)) continue;

    const style = getComputedStyle(parent);
    if (style.display === "none" || style.visibility === "hidden") continue;
    const family = normalizeFontFamily(style.fontFamily.split(",")[0]);
    if (!EMBEDDED_FONT_FAMILIES.has(family)) continue;

    range.selectNodeContents(textNode);
    const visible = Array.from(range.getClientRects()).some((rect) =>
      rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < height && rect.left < width,
    );
    if (!visible) continue;

    const styleName = style.fontStyle === "italic" ? "italic" : style.fontStyle === "normal" ? "normal" : "oblique";
    if (styleName === "oblique") continue;
    const weight = Number.parseFloat(style.fontWeight) || (style.fontWeight === "bold" ? 700 : 400);
    const key = `${family}|${styleName}|${weight}`;
    let entry = usage.get(key);
    if (!entry) {
      entry = { family, style: styleName, weight, codePoints: new Set(), textLength: 0 };
      usage.set(key, entry);
    }
    entry.textLength += text.length;
    for (const character of text) {
      entry.codePoints.add(character.codePointAt(0));
      if (entry.codePoints.size >= 4096) break;
    }
  }

  return Array.from(usage.values());
}

function fontFaceLoadedForUsage(face, usage, latinRanges) {
  if (face.status !== "loaded" || normalizeFontFamily(face.family) !== usage.family) return false;
  if (String(face.style).toLowerCase() !== usage.style || !weightRangeIncludes(face.weight, usage.weight)) return false;
  const loadedRanges = parseUnicodeRanges(face.unicodeRange);
  return Array.from(usage.codePoints).some((codePoint) =>
    codePointInRanges(codePoint, latinRanges) && codePointInRanges(codePoint, loadedRanges),
  );
}

function fontEmbedCSSForViewport(width, height, signal) {
  try {
    if (signal.aborted || !document.fonts) return "";
    const usages = collectVisibleFontUsage(width, height);
    if (!usages.length) return "";

    const latinRanges = parseUnicodeRanges(LATIN_UNICODE_RANGE);
    const loadedFaces = Array.from(document.fonts);
    const candidates = [];
    for (const usage of usages) {
      if (signal.aborted) return "";
      const font = LOCAL_FONT_FACES.find((entry) =>
        entry.family === usage.family && entry.style === usage.style && entry.weights.includes(usage.weight) && entry.data.startsWith("data:"),
      );
      if (!font || !Array.from(usage.codePoints).some((codePoint) => codePointInRanges(codePoint, latinRanges))) continue;
      if (!loadedFaces.some((face) => fontFaceLoadedForUsage(face, usage, latinRanges))) continue;
      candidates.push({ font, usage });
    }

    candidates.sort((first, second) => second.usage.textLength - first.usage.textLength);
    const selected = candidates.slice(0, MAX_FONT_FACE_RULES);
    const rules = selected.map(({ font, usage }) =>
      `@font-face { font-family: "${font.family === "source serif 4" ? "Source Serif 4" : "JetBrains Mono"}"; font-style: ${font.style}; font-weight: ${usage.weight}; unicode-range: ${LATIN_UNICODE_RANGE}; font-display: swap; src: url("${font.data}") format("woff2"); }`,
    );
    const result = rules.join("\n");
    return !signal.aborted && result.length <= MAX_FONT_EMBED_CSS_CHARACTERS ? result : "";
  } catch {
    return "";
  }
}

function waitForVisibleImages(signal) {
  const pending = Array.from(document.images).filter((image) => {
    if (image.complete) return false;
    const rect = image.getBoundingClientRect();
    return rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
  });
  if (!pending.length) return Promise.resolve();

  return boundedWait(pending.map((image) => new Promise((resolve) => {
    if (image.complete || signal.aborted) return resolve();
    const finish = () => {
      image.removeEventListener("load", finish);
      image.removeEventListener("error", finish);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
    signal.addEventListener("abort", finish, { once: true });
  })), 650, signal);
}

function isLocalResource(value) {
  if (!value || value.startsWith("data:")) return true;
  try {
    return new URL(value, document.baseURI).origin === location.origin;
  } catch {
    return false;
  }
}

function hasExternalImageValue(value) {
  for (const match of String(value || "").matchAll(/url\((?:"|')?([^"')]+)(?:"|')?\)/g)) {
    if (!isLocalResource(match[1])) return true;
  }
  return false;
}

function hasExternalVisualResource(element) {
  if (element instanceof HTMLImageElement && !isLocalResource(element.currentSrc || element.src)) return true;
  if (element instanceof SVGImageElement && !isLocalResource(element.href.baseVal)) return true;
  if (element instanceof HTMLVideoElement && !isLocalResource(element.currentSrc || element.poster)) return true;

  const style = getComputedStyle(element);
  const images = [style.backgroundImage, style.maskImage, style.webkitMaskImage, style.borderImageSource, style.listStyleImage];
  if (images.some(hasExternalImageValue)) return true;
  for (const pseudo of ["::before", "::after"]) {
    const pseudoStyle = getComputedStyle(element, pseudo);
    if (hasExternalImageValue(pseudoStyle.backgroundImage) || hasExternalImageValue(pseudoStyle.content)) return true;
  }
  return false;
}

function shouldCaptureNode(node, width, height) {
  if (!(node instanceof Element)) return true;
  const tag = node.tagName.toLowerCase();
  if (["head", "script", "style", "link", "meta", "title", "noscript", "template", "iframe"].includes(tag)) return false;
  if (node.matches("[data-home-motion], .privacy-consent, [data-privacy-consent], astro-dev-toolbar, [data-astro-dev-toolbar], [data-astro-dev-toolbar-root], #astro-dev-toolbar, .astro-dev-toolbar, [data-astro-dev-overlay], #home-motion-cloth-stage, #home-motion-swarm-stage")) return false;
  if (node !== document.documentElement && node !== document.body) {
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 &&
      (rect.bottom < -2 || rect.top > height + 2 || rect.right < -2 || rect.left > width + 2)) {
      return false;
    }
  }
  return !hasExternalVisualResource(node);
}

async function captureViewport(signal) {
  const { toCanvas } = await import("html-to-image");
  if (signal.aborted) return null;

  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  await Promise.all([waitForFonts(signal), waitForVisibleImages(signal)]);
  if (signal.aborted) return null;

  const width = Math.max(1, document.documentElement.clientWidth || window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  const fontEmbedCSS = fontEmbedCSSForViewport(width, height, signal);
  if (signal.aborted) return null;
  const scale = Math.min(
    window.devicePixelRatio || 1,
    1.25,
    1600 / width,
    1400 / height,
    Math.sqrt(MAX_CAPTURE_PIXELS / (width * height)),
  );

  const canvas = await toCanvas(document.documentElement, {
    width,
    height,
    canvasWidth: width,
    canvasHeight: height,
    pixelRatio: scale,
    fontEmbedCSS,
    filter: (node) => shouldCaptureNode(node, width, height),
    style: {
      width: `${width}px`,
      height: `${height}px`,
      maxWidth: "none",
      margin: "0",
      overflow: "hidden",
      transform: "none",
      transformOrigin: "top left",
      scrollBehavior: "auto",
    },
  });

  if (signal.aborted) {
    canvas.width = 1;
    canvas.height = 1;
    return null;
  }
  return canvas;
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Shader allocation failed");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    throw new Error("Shader compilation failed");
  }
  return shader;
}

function createRenderer(canvas, pageCanvas) {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  let vertexShader = null;
  let fragmentShader = null;
  let program = null;
  let pageTexture = null;
  let vertexBuffer = null;
  let indexBuffer = null;

  try {
    const vertexSource = `
      attribute vec2 a_position;
      attribute vec3 a_normal;
      attribute vec2 a_uv;
      uniform vec2 u_viewport;
      varying vec3 v_normal;
      varying vec2 v_uv;
      void main() {
        vec2 clip = vec2((a_position.x / u_viewport.x) * 2.0 - 1.0,
                         1.0 - (a_position.y / u_viewport.y) * 2.0);
        gl_Position = vec4(clip, 0.0, 1.0);
        v_normal = normalize(a_normal);
        v_uv = a_uv;
      }
    `;
    const fragmentSource = `
      precision mediump float;
      uniform sampler2D u_page;
      uniform vec2 u_page_size;
      varying vec3 v_normal;
      varying vec2 v_uv;
      void main() {
        if (v_uv.x < 0.0 || v_uv.x > 1.0 || v_uv.y < 0.0 || v_uv.y > 1.0) discard;
        vec4 ink = texture2D(u_page, v_uv);
        vec3 normal = normalize(v_normal);
        vec3 light = normalize(vec3(-0.34, -0.52, 0.78));
        float diffuse = max(dot(normal, light), 0.0);
        float matte = 0.70 + diffuse * 0.36;
        float pageX = v_uv.x * u_page_size.x;
        float pageY = v_uv.y * u_page_size.y;
        float warp = sin((pageX + pageY * 0.035) * 2.58);
        float weft = sin((pageY + pageX * 0.028) * 2.36);
        float weave = 1.0 + (warp + weft) * 0.004 + warp * weft * 0.009;
        vec3 clothColor = ink.rgb * matte * weave * vec3(1.006, 1.000, 0.989);
        gl_FragColor = vec4(clothColor, ink.a);
      }
    `;

    vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    program = gl.createProgram();
    if (!program) throw new Error("Program allocation failed");
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    vertexShader = null;
    fragmentShader = null;
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Program link failed");

    pageTexture = gl.createTexture();
    vertexBuffer = gl.createBuffer();
    indexBuffer = gl.createBuffer();
    if (!pageTexture || !vertexBuffer || !indexBuffer) throw new Error("Buffer allocation failed");
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, pageTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pageCanvas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    const locations = {
      position: gl.getAttribLocation(program, "a_position"),
      normal: gl.getAttribLocation(program, "a_normal"),
      uv: gl.getAttribLocation(program, "a_uv"),
      viewport: gl.getUniformLocation(program, "u_viewport"),
      page: gl.getUniformLocation(program, "u_page"),
      pageSize: gl.getUniformLocation(program, "u_page_size"),
    };
    if (Object.values(locations).some((location) => location === null || location === -1)) {
      throw new Error("Shader locations unavailable");
    }

    return {
      gl,
      program,
      pageTexture,
      vertexBuffer,
      indexBuffer,
      locations,
      pageWidth: pageCanvas.width,
      pageHeight: pageCanvas.height,
      vertexAllocated: false,
      indexUploaded: false,
      destroy() {
        try {
          gl.deleteTexture(pageTexture);
          gl.deleteBuffer(vertexBuffer);
          gl.deleteBuffer(indexBuffer);
          gl.deleteProgram(program);
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        } catch {
          // The context may already have been lost by the browser.
        }
      },
    };
  } catch (error) {
    if (vertexShader) gl.deleteShader(vertexShader);
    if (fragmentShader) gl.deleteShader(fragmentShader);
    if (pageTexture) gl.deleteTexture(pageTexture);
    if (vertexBuffer) gl.deleteBuffer(vertexBuffer);
    if (indexBuffer) gl.deleteBuffer(indexBuffer);
    if (program) gl.deleteProgram(program);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    throw error;
  }
}

function makeMesh(width, height) {
  const count = COLUMNS * ROWS;
  const positions = new Float32Array(count * 3);
  const previous = new Float32Array(count * 3);
  const vertices = new Float32Array(count * 7);
  const indices = new Uint16Array((COLUMNS - 1) * (ROWS - 1) * 6);
  let indexOffset = 0;

  for (let row = 0; row < ROWS - 1; row += 1) {
    for (let column = 0; column < COLUMNS - 1; column += 1) {
      const a = row * COLUMNS + column;
      const b = a + 1;
      const c = a + COLUMNS;
      const d = c + 1;
      indices[indexOffset++] = a;
      indices[indexOffset++] = c;
      indices[indexOffset++] = b;
      indices[indexOffset++] = b;
      indices[indexOffset++] = c;
      indices[indexOffset++] = d;
    }
  }

  for (let row = 0; row < ROWS; row += 1) {
    const v = row / (ROWS - 1);
    for (let column = 0; column < COLUMNS; column += 1) {
      const u = column / (COLUMNS - 1);
      const vertex = row * COLUMNS + column;
      const offset = vertex * 3;
      const bendA = u - (0.18 + 0.075 * Math.sin(v * 5.2 + 0.7));
      const bendB = u - (0.51 + 0.062 * Math.sin(v * 7.1 - 1.1));
      const bendC = u - (0.82 + 0.054 * Math.sin(v * 4.8 + 1.8));
      const ridgeA = Math.exp(-Math.pow(bendA / 0.045, 2));
      const ridgeB = Math.exp(-Math.pow(bendB / 0.062, 2));
      const ridgeC = Math.exp(-Math.pow(bendC / 0.038, 2));
      const crease =
        0.43 * Math.sin(u * 17.4 + v * 5.1) +
        0.29 * Math.sin(u * 7.8 - v * 10.5 + 0.8) +
        0.92 * ridgeA - 0.74 * ridgeB + 0.67 * ridgeC -
        0.34 * Math.exp(-Math.pow((bendA - 0.086) / 0.032, 2));
      const seededNoise = Math.sin((vertex + 1) * 12.9898) * 43758.5453;
      const jitter = (seededNoise - Math.floor(seededNoise)) - 0.5;
      const startingHeight = height * 0.16;
      const x = u * width;
      const y = v * startingHeight + 1.3 * Math.sin(u * 9.2 + v * 3.7);
      const z = crease * Math.min(46, height * 0.05) + jitter * 2.2;
      positions[offset] = x;
      positions[offset + 1] = y;
      positions[offset + 2] = z;
      previous[offset] = x - (row === 0 ? 0 : jitter * 0.46);
      previous[offset + 1] = y - (row === 0 ? 0 : Math.sin(u * 8 + v * 3) * 1.25);
      previous[offset + 2] = z - (row === 0 ? 0 : jitter * 3.2);
    }
  }

  return { columns: COLUMNS, rows: ROWS, count, positions, previous, vertices, indices, projected: new Float32Array(count * 3), width, height };
}

function pinEdges(mesh, targetHeight, progressValue, timeSeconds) {
  const { columns, rows, width, positions, previous } = mesh;
  const frontFade = 1 - smoothstep(0.34, 0.98, progressValue);
  for (let column = 0; column < columns; column += 1) {
    const u = column / (columns - 1);
    const x = u * width;
    const topOffset = column * 3;
    positions[topOffset] = x;
    positions[topOffset + 1] = 0;
    positions[topOffset + 2] = 0;
    previous[topOffset] = x;
    previous[topOffset + 1] = 0;
    previous[topOffset + 2] = 0;

    const edgeWave =
      0.62 * Math.sin(u * 7.5 + timeSeconds * 1.08) +
      0.27 * Math.sin(u * 15.2 - timeSeconds * 0.71 + 0.8) +
      0.11 * Math.sin(u * 24.5 + timeSeconds * 0.43);
    const edge = edgeWave * 26 * frontFade;
    const bottomOffset = (rows - 1) * columns * 3 + column * 3;
    positions[bottomOffset] = x;
    positions[bottomOffset + 1] = targetHeight + edge;
    positions[bottomOffset + 2] = edge * 0.5;
    previous[bottomOffset] = positions[bottomOffset];
    previous[bottomOffset + 1] = positions[bottomOffset + 1];
    previous[bottomOffset + 2] = positions[bottomOffset + 2];
  }
}

function solveSpring(mesh, firstVertex, secondVertex, restLength, stiffness) {
  const { positions } = mesh;
  const first = firstVertex * 3;
  const second = secondVertex * 3;
  const dx = positions[second] - positions[first];
  const dy = positions[second + 1] - positions[first + 1];
  const dz = positions[second + 2] - positions[first + 2];
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (length < 0.0001) return;

  const firstPinned = firstVertex < mesh.columns || firstVertex >= (mesh.rows - 1) * mesh.columns;
  const secondPinned = secondVertex < mesh.columns || secondVertex >= (mesh.rows - 1) * mesh.columns;
  if (firstPinned && secondPinned) return;
  const correction = ((length - restLength) / length) * stiffness;
  const firstShare = firstPinned ? 0 : secondPinned ? 1 : 0.5;
  const secondShare = secondPinned ? 0 : firstPinned ? 1 : 0.5;
  positions[first] += dx * correction * firstShare;
  positions[first + 1] += dy * correction * firstShare;
  positions[first + 2] += dz * correction * firstShare;
  positions[second] -= dx * correction * secondShare;
  positions[second + 1] -= dy * correction * secondShare;
  positions[second + 2] -= dz * correction * secondShare;
}

function simulate(mesh, targetHeight, progressValue, now, deltaSeconds) {
  const { columns, rows, positions, previous, width } = mesh;
  const dt = clamp(deltaSeconds, 0.001, 0.032);
  const damping = Math.pow(0.988, dt * 60);
  const windFade = 1 - smoothstep(0.08, 0.88, progressValue);
  const flattening = smoothstep(0.24, 0.99, progressValue);
  const t = now / 1000;

  pinEdges(mesh, targetHeight, progressValue, t);
  for (let row = 1; row < rows - 1; row += 1) {
    const v = row / (rows - 1);
    for (let column = 0; column < columns; column += 1) {
      const vertex = row * columns + column;
      const offset = vertex * 3;
      const u = column / (columns - 1);
      const phase = t * 1.52 + u * 6.7 + v * 5.1;
      const oldX = positions[offset];
      const oldY = positions[offset + 1];
      const oldZ = positions[offset + 2];
      const velocityX = (oldX - previous[offset]) * damping;
      const velocityY = (oldY - previous[offset + 1]) * damping;
      const velocityZ = (oldZ - previous[offset + 2]) * damping;
      const forceX = windFade * 74 * Math.sin(phase * 0.72 + 0.4);
      const forceY = windFade * 48 * Math.cos(phase * 0.54 + u * 3.1);
      const forceZ = windFade * (560 * Math.sin(phase) + 190 * Math.sin(phase * 0.47 + u * 12));

      previous[offset] = oldX;
      previous[offset + 1] = oldY;
      previous[offset + 2] = oldZ;
      positions[offset] = oldX + velocityX + forceX * dt * dt;
      positions[offset + 1] = oldY + velocityY + forceY * dt * dt;
      positions[offset + 2] = oldZ + velocityZ + forceZ * dt * dt;
      positions[offset + 2] *= 1 - flattening * dt * 0.22;
    }
  }

  const horizontal = width / (columns - 1);
  const vertical = targetHeight / (rows - 1);
  const diagonal = Math.hypot(horizontal, vertical);
  for (let pass = 0; pass < 4; pass += 1) {
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns - 1; column += 1) {
        solveSpring(mesh, row * columns + column, row * columns + column + 1, horizontal, 0.22);
      }
    }
    for (let row = 0; row < rows - 1; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        solveSpring(mesh, row * columns + column, (row + 1) * columns + column, vertical, 0.28);
      }
    }
    for (let row = 0; row < rows - 1; row += 1) {
      for (let column = 0; column < columns - 1; column += 1) {
        const first = row * columns + column;
        solveSpring(mesh, first, first + columns + 1, diagonal, 0.11);
        solveSpring(mesh, first + 1, first + columns, diagonal, 0.11);
      }
    }
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns - 2; column += 1) {
        solveSpring(mesh, row * columns + column, row * columns + column + 2, horizontal * 2, 0.035);
      }
    }
    pinEdges(mesh, targetHeight, progressValue, t);
  }
}

function makeFrameData(renderer, mesh, targetHeight, foldVisibility, width, height) {
  const { columns, rows, count, positions, vertices, projected, width: meshWidth } = mesh;
  const viewCenter = width * 0.5;
  const focalLength = Math.max(900, width * 1.25);

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const vertex = row * columns + column;
      const source = vertex * 3;
      const foldZ = positions[source + 2] * foldVisibility;
      const physicalX = positions[source] + foldZ * 0.18;
      const physicalY = positions[source + 1] - foldZ * 0.25;
      const perspective = focalLength / (focalLength - foldZ);
      projected[source] = viewCenter + (physicalX - viewCenter) * perspective;
      projected[source + 1] = physicalY * perspective;
      projected[source + 2] = foldZ;
    }
  }

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const vertex = row * columns + column;
      const left = row * columns + Math.max(0, column - 1);
      const right = row * columns + Math.min(columns - 1, column + 1);
      const above = Math.max(0, row - 1) * columns + column;
      const below = Math.min(rows - 1, row + 1) * columns + column;
      const txX = projected[right * 3] - projected[left * 3];
      const txY = projected[right * 3 + 1] - projected[left * 3 + 1];
      const txZ = projected[right * 3 + 2] - projected[left * 3 + 2];
      const tyX = projected[below * 3] - projected[above * 3];
      const tyY = projected[below * 3 + 1] - projected[above * 3 + 1];
      const tyZ = projected[below * 3 + 2] - projected[above * 3 + 2];
      let nx = txY * tyZ - txZ * tyY;
      let ny = txZ * tyX - txX * tyZ;
      let nz = txX * tyY - txY * tyX;
      const normalLength = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= normalLength;
      ny /= normalLength;
      nz /= normalLength;

      const out = vertex * 7;
      vertices[out] = projected[vertex * 3];
      vertices[out + 1] = projected[vertex * 3 + 1];
      vertices[out + 2] = nx;
      vertices[out + 3] = ny;
      vertices[out + 4] = nz;
      vertices[out + 5] = column / (columns - 1);
      vertices[out + 6] = 1 - row / (rows - 1);
    }
  }
  return { vertices, width, height };
}

function draw(renderer, mesh, targetHeight, foldVisibility, width, height, pixelRatio) {
  const { gl, program, locations } = renderer;
  const frameData = makeFrameData(renderer, mesh, targetHeight, foldVisibility, width, height);
  gl.viewport(0, 0, Math.round(width * pixelRatio), Math.round(height * pixelRatio));
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, renderer.pageTexture);
  gl.uniform2f(locations.viewport, width, height);
  gl.uniform1i(locations.page, 0);
  gl.uniform2f(locations.pageSize, renderer.pageWidth, renderer.pageHeight);

  gl.bindBuffer(gl.ARRAY_BUFFER, renderer.vertexBuffer);
  if (!renderer.vertexAllocated) {
    gl.bufferData(gl.ARRAY_BUFFER, frameData.vertices.byteLength, gl.DYNAMIC_DRAW);
    renderer.vertexAllocated = true;
  }
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, frameData.vertices);
  const stride = 7 * Float32Array.BYTES_PER_ELEMENT;
  gl.enableVertexAttribArray(locations.position);
  gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(locations.normal);
  gl.vertexAttribPointer(locations.normal, 3, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
  gl.enableVertexAttribArray(locations.uv);
  gl.vertexAttribPointer(locations.uv, 2, gl.FLOAT, false, stride, 5 * Float32Array.BYTES_PER_ELEMENT);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderer.indexBuffer);
  if (!renderer.indexUploaded) {
    const indices = new Uint16Array((COLUMNS - 1) * (ROWS - 1) * 6);
    let offset = 0;
    for (let row = 0; row < ROWS - 1; row += 1) {
      for (let column = 0; column < COLUMNS - 1; column += 1) {
        const a = row * COLUMNS + column;
        const b = a + 1;
        const c = a + COLUMNS;
        const d = c + 1;
        indices[offset++] = a;
        indices[offset++] = c;
        indices[offset++] = b;
        indices[offset++] = b;
        indices[offset++] = c;
        indices[offset++] = d;
      }
    }
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    renderer.indexUploaded = true;
  }
  gl.drawElements(gl.TRIANGLES, (COLUMNS - 1) * (ROWS - 1) * 6, gl.UNSIGNED_SHORT, 0);
}

function canUseWebGL() {
  const probe = document.createElement("canvas");
  const gl = probe.getContext("webgl", { alpha: true, powerPreference: "low-power" });
  if (!gl) return false;
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  return true;
}

function fadeStage(stage, signal) {
  if (signal.aborted) return Promise.resolve(false);
  return new Promise((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => finish(!signal.aborted), 620);
    function finish(completed) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      stage.removeEventListener("transitionend", onTransitionEnd);
      signal.removeEventListener("abort", onAbort);
      resolve(completed);
    }
    function onTransitionEnd(event) {
      if (event.target === stage && event.propertyName === "opacity") finish(!signal.aborted);
    }
    function onAbort() { finish(false); }
    stage.addEventListener("transitionend", onTransitionEnd);
    signal.addEventListener("abort", onAbort, { once: true });
    stage.classList.add("home-motion-cloth-leaving");
  });
}

export async function play({ signal, locale, onStatus, onProgress }) {
  if (!canUseWebGL()) return { result: "unsupported" };
  if (signal.aborted) return { result: "stopped" };
  let pageCanvas = null;
  let renderer = null;
  let stage = null;
  try {
    pageCanvas = await captureViewport(signal);
    if (signal.aborted) return { result: "stopped" };
    if (!pageCanvas) return { result: "failed" };

    const width = Math.max(1, document.documentElement.clientWidth || window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    const pixelRatio = pageCanvas.width / width;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * pixelRatio));
    canvas.height = Math.max(1, Math.round(height * pixelRatio));
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "home-motion-cloth-canvas";

    renderer = createRenderer(canvas, pageCanvas);
    if (!renderer) return { result: "unsupported" };
    pageCanvas.width = 1;
    pageCanvas.height = 1;

    stage = document.createElement("div");
    stage.id = "home-motion-cloth-stage";
    stage.setAttribute("aria-hidden", "true");
    stage.append(canvas);
    document.body.append(stage);

    const mesh = makeMesh(width, height);
    const startAt = performance.now();
    let lastFrameAt = startAt;
    let frame = 0;
    let done = false;

    const result = await new Promise((resolve) => {
      const finish = (result) => {
        if (done) return;
        done = true;
        cancelAnimationFrame(frame);
        signal.removeEventListener("abort", onAbort);
        canvas.removeEventListener("webglcontextlost", onContextLost);
        stage?.remove();
        stage = null;
        renderer?.destroy();
        renderer = null;
        resolve({ result });
      };
      const onAbort = () => finish("stopped");
      const onContextLost = (event) => {
        event.preventDefault();
        onStatus(locale === "en"
          ? "The fabric renderer stopped safely; the live page is visible again."
          : "Die Stoffdarstellung wurde sicher beendet; die aktuelle Seite ist wieder sichtbar.");
        finish("unsupported");
      };

      signal.addEventListener("abort", onAbort, { once: true });
      canvas.addEventListener("webglcontextlost", onContextLost, { once: true });

      try {
        const initialHeight = height * 0.16;
        simulate(mesh, initialHeight, 0, startAt, 1 / 60);
        draw(renderer, mesh, initialHeight, 1, width, height, pixelRatio);

        function tick(now) {
          if (done || signal.aborted) return finish("stopped");
          try {
            const progress = clamp((now - startAt) / DURATION, 0, 1);
            const eased = easeInOut(progress);
            const targetHeight = height * (0.16 + 0.84 * eased);
            const foldVisibility = 1 - smoothstep(0.42, 0.99, progress);
            const delta = (now - lastFrameAt) / 1000;
            lastFrameAt = now;

            simulate(mesh, targetHeight, progress, now, delta);
            draw(renderer, mesh, targetHeight, foldVisibility, width, height, pixelRatio);
            onProgress(progress * 100);
            if (progress > 0.24 && progress < 0.9) {
              onStatus(locale === "en" ? "The folds relax across this page…" : "Die Falten glätten sich über dieser Seite …");
            }
            if (progress < 1) frame = requestAnimationFrame(tick);
            else {
              void fadeStage(stage, signal).then((completed) => finish(completed ? "complete" : "stopped"));
            }
          } catch {
            onStatus(locale === "en"
              ? "The fabric view stopped safely; the live page is visible again."
              : "Die Stoffansicht wurde sicher beendet; die aktuelle Seite ist wieder sichtbar.");
            finish("failed");
          }
        }

        frame = requestAnimationFrame(tick);
      } catch {
        finish("failed");
      }
    });
    return result;
  } catch {
    return { result: signal.aborted ? "stopped" : "failed" };
  } finally {
    if (pageCanvas) {
      pageCanvas.width = 1;
      pageCanvas.height = 1;
    }
    stage?.remove();
    renderer?.destroy();
  }
}
