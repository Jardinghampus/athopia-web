/**
 * Regression: link_only payloads must never carry third-party body/teaser.
 * Run: pnpm exec tsx --test lib/provenance.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  articlePublicPath,
  canPublishBody,
  publicPayloadLeaksThirdPartyBody,
  resolveRightsStatus,
  sanitizeArticleForPublic,
  sourceDomain,
} from "./provenance";

describe("provenance", () => {
  it("defaults unknown rows to link_only", () => {
    assert.equal(resolveRightsStatus({}), "link_only");
    assert.equal(resolveRightsStatus({ is_athopia_generated: true }), "owned");
  });

  it("routes owned to /artikel and link_only to /nyhet", () => {
    assert.equal(
      articlePublicPath({ slug: "ai-brief", rightsStatus: "owned" }),
      "/artikel/ai-brief",
    );
    assert.equal(
      articlePublicPath({ slug: "aftonbladet-signal", rights_status: "link_only" }),
      "/nyhet/aftonbladet-signal",
    );
  });

  it("strips content and summary for link_only public payloads", () => {
    const clean = sanitizeArticleForPublic({
      slug: "x",
      rightsStatus: "link_only" as const,
      content: "<p>Scrapad brödtext från källan</p>",
      summary: "RSS-teaser som inte får publiceras",
      sourceUrl: "https://example.com/a",
    });
    assert.equal(clean.content, null);
    assert.equal(clean.summary, null);
    assert.equal(publicPayloadLeaksThirdPartyBody(clean), false);
    assert.equal(
      publicPayloadLeaksThirdPartyBody({
        rightsStatus: "link_only",
        content: "leak",
        summary: null,
      }),
      true,
    );
  });

  it("keeps owned body", () => {
    assert.equal(canPublishBody("owned"), true);
    const owned = sanitizeArticleForPublic({
      rightsStatus: "owned" as const,
      content: "<p>Athopia original</p>",
      summary: "Egen analys",
    });
    assert.equal(owned.content, "<p>Athopia original</p>");
    assert.equal(owned.summary, "Egen analys");
  });

  it("extracts domain without www", () => {
    assert.equal(sourceDomain("https://www.fotbollskanalen.se/a/1"), "fotbollskanalen.se");
  });
});
