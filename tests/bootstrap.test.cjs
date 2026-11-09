const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

test("Expo app metadata has a name and a valid slug", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
  assert.equal(typeof manifest.expo.name, "string");
  assert.ok(manifest.expo.name.trim().length > 0);
  assert.match(manifest.expo.slug, /^[a-z0-9-]+$/);
});

test("Expo Router is the configured application entry point", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(manifest.main, "expo-router/entry");
});

test("Expo Updates uses the same project as EAS Build", () => {
  const { expo } = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
  assert.ok(expo.extra?.eas?.projectId);
  assert.equal(expo.updates.url, `https://u.expo.dev/${expo.extra.eas.projectId}`);
});
