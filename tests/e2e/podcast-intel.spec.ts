import { test, expect } from "@playwright/test";

const MISSING = "00000000-0000-4000-8000-000000000000";

async function firstEpisodeId(request: import("@playwright/test").APIRequestContext) {
  const list = await request.get("/api/podcasts?limit=1");
  expect(list.ok()).toBeTruthy();
  const body = (await list.json()) as { episodes?: { id: string }[] };
  return body.episodes?.[0]?.id;
}

test("avsnittssidan visar sammanfattningsytan utan transkript eller rå spelare", async ({ page }) => {
  const id = await firstEpisodeId(page.request);
  test.skip(!id, "inga poddavsnitt i databasen");

  const summaryRes = page.waitForResponse((r) => r.url().includes("/api/elite/podcast-summary"));
  await page.goto(`/podcast/${id}`);
  await expect(page.getByRole("heading", { name: "Sammanfattning" })).toBeVisible();
  await expect(page.locator("audio")).toHaveCount(0);

  const res = await summaryRes;
  const json = (await res.json()) as Record<string, unknown>;
  // Utloggad: låst, ingen PRO-text, inga transkriptfält i svaret.
  expect(json.unlocked).toBe(false);
  expect(json.headline).toBeNull();
  expect(json.bullets).toEqual([]);
  expect(JSON.stringify(json)).not.toMatch(/transcript|chunk/i);
  if (typeof json.teaser === "string") expect(json.teaser.length).toBeLessThanOrEqual(200);
});

test("poddchatten kräver session", async ({ request }) => {
  const id = (await firstEpisodeId(request)) ?? MISSING;
  const chat = await request.post("/api/elite/podcast-chat", {
    data: { episodeId: id, messages: [{ role: "user", content: "hej" }] },
  });
  expect(chat.status()).toBe(401);
});

test("sammanfattningen kan inte genereras från web — os äger LLM-vägen", async ({ request }) => {
  const id = (await firstEpisodeId(request)) ?? MISSING;
  const gen = await request.post("/api/elite/podcast-summary", { data: { episodeId: id } });
  expect(gen.status()).toBe(405);
});

test("sammanfattnings-GET validerar id och ger 404 för okänt avsnitt", async ({ request }) => {
  expect((await request.get("/api/elite/podcast-summary?episodeId=nej")).status()).toBe(400);
  expect((await request.get(`/api/elite/podcast-summary?episodeId=${MISSING}`)).status()).toBe(404);
});
