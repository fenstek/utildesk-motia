import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "../../../scripts/sharp.mjs";

function compareVersions(actual, minimum) {
  const parse = (version) => {
    assert.match(version, /^\d+\.\d+\.\d+$/, `Expected a stable semantic version, got ${version}`);
    return version.split(".").map(Number);
  };
  const actualParts = parse(actual);
  const minimumParts = parse(minimum);

  for (let index = 0; index < minimumParts.length; index += 1) {
    if (actualParts[index] !== minimumParts[index]) {
      return actualParts[index] > minimumParts[index] ? 1 : -1;
    }
  }
  return 0;
}

test("sharp and its prebuilt codecs meet the patched minimums", () => {
  assert.ok(compareVersions(sharp.versions.sharp, "0.35.5") >= 0, `sharp ${sharp.versions.sharp} is below 0.35.5`);
  assert.ok(compareVersions(sharp.versions.heif ?? "", "1.23.2") >= 0, `libheif ${sharp.versions.heif ?? "(missing)"} is below 1.23.2`);
  if (sharp.versions.rsvg !== undefined) {
    assert.ok(compareVersions(sharp.versions.rsvg, "2.63.2") >= 0, `librsvg ${sharp.versions.rsvg} is below 2.63.2`);
  }
});

test("rasterizes an ordinary SVG when the prebuilt includes SVG support", { skip: sharp.versions.rsvg === undefined }, async () => {
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="3" height="2"><rect width="3" height="2" fill="#2577cc"/></svg>');
  const metadata = await sharp(svg).metadata();
  assert.equal(metadata.format, "svg");
  assert.equal(metadata.width, 3);
  assert.equal(metadata.height, 2);

  const decoded = await sharp(svg).raw().toBuffer({ resolveWithObject: true });
  assert.equal(decoded.info.width, 3);
  assert.equal(decoded.info.height, 2);
  assert.ok(decoded.data.length > 0, "SVG yields decoded pixel data");
});

test("decodes valid PNG, JPEG, WebP, and AVIF image contents", async () => {
  const png = await sharp({
    create: {
      width: 3,
      height: 2,
      channels: 3,
      background: { r: 37, g: 119, b: 204 },
    },
  }).png().toBuffer();
  const avif = await sharp(png).avif({ quality: 50 }).toBuffer();
  const images = [
    { name: "PNG", bytes: png, format: "png" },
    { name: "JPEG", bytes: await sharp(png).jpeg().toBuffer(), format: "jpeg" },
    { name: "WebP", bytes: await sharp(png).webp().toBuffer(), format: "webp" },
    { name: "AVIF", bytes: avif, format: "heif" },
  ];

  for (const image of images) {
    const metadata = await sharp(image.bytes).metadata();
    assert.equal(metadata.format, image.format, `${image.name} format detection`);

    const decoded = await sharp(image.bytes).raw().toBuffer({ resolveWithObject: true });
    assert.equal(decoded.info.width, 3, `${image.name} decoded width`);
    assert.equal(decoded.info.height, 2, `${image.name} decoded height`);
    assert.ok(decoded.data.length > 0, `${image.name} decoded pixel data`);
  }

  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "utildesk-avif-content-"));
  const misleadingExtensionPath = path.join(tempDirectory, "image.jpg");
  try {
    await writeFile(misleadingExtensionPath, avif);
    const metadata = await sharp(misleadingExtensionPath).metadata();
    assert.equal(metadata.format, "heif", "AVIF content is recognized under a .jpg extension");

    const decoded = await sharp(misleadingExtensionPath).raw().toBuffer({ resolveWithObject: true });
    assert.equal(decoded.info.width, 3);
    assert.equal(decoded.info.height, 2);
    assert.ok(decoded.data.length > 0, "misnamed AVIF yields decoded pixel data");
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
