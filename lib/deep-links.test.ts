import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { DEEP_LINK_ROUTES, universalLinkPaths } from "./deep-links";
import { BOTTOM_NAV_ITEMS } from "./nav";

const contentView = readFileSync(
  path.resolve(
    process.cwd(),
    "..",
    "athopia-ios",
    "AthopiaApp",
    "AthopiaApp",
    "ContentView.swift",
  ),
  "utf8",
);

test("every shareable deep link is dispatched by iOS", () => {
  for (const { prefix } of DEEP_LINK_ROUTES) {
    // iOS grupperar prefix i samma case ("profil", "konto"), så matcha per case-rad.
    const dispatched = new RegExp(`^\\s*case\\b.*"${prefix}"`, "m").test(contentView);
    assert.ok(
      dispatched,
      `ContentView.handleUniversalLink saknar case "${prefix}" — web-URL:en /${prefix} skulle öppna fel yta`,
    );
  }
});

test("every primary destination is reachable as a deep link", () => {
  const prefixes = new Set(DEEP_LINK_ROUTES.map((route) => route.prefix));
  for (const { href } of BOTTOM_NAV_ITEMS) {
    assert.ok(
      prefixes.has(href.slice(1)),
      `${href} är en topp-flik men saknas i DEEP_LINK_ROUTES`,
    );
  }
});

test("AASA exposes a wildcard path for every detail route", () => {
  const paths = universalLinkPaths();
  for (const { prefix, hasDetail, standalone } of DEEP_LINK_ROUTES) {
    if (hasDetail) assert.ok(paths.includes(`/${prefix}/*`));
    if (standalone) assert.ok(paths.includes(`/${prefix}`));
  }
});
