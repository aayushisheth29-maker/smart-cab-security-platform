import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("assessment-headline")).toHaveText(
    "No warning detected",
  );
});

test("preview is explicitly synthetic and has no horizontal overflow", async ({
  page,
}) => {
  await expect(
    page.getByText("All GPS data is synthetic.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Automatic actions", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("detour, stop, and low-quality data produce different observations", async ({
  page,
}) => {
  await page.getByRole("button", { name: /A route detour/ }).click();
  await expect(page.getByTestId("assessment-headline")).toHaveText(
    "A check-in may help",
  );
  await expect(
    page.getByText("Sustained route deviation", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /An extended stop/ }).click();
  await expect(
    page.getByText("An extended stop", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: /Weak GPS signal/ }).click();
  await expect(page.getByTestId("assessment-headline")).toHaveText(
    "Waiting for usable location data",
  );
  await expect(page.getByText("Not assessed", { exact: true })).toBeVisible();
  await expect(page.getByText("ASSESSMENT PAUSED")).toBeVisible();
});

test("check-in only acknowledges a simulation", async ({ page }) => {
  const posts = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  await page.getByRole("button", { name: /Try a check-in/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: /I’m okay/ }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("No messages were sent");
  expect(posts).toHaveLength(0);
});

test("replay can start, pause, scrub, and restart", async ({ page }) => {
  const slider = page.getByRole("slider", { name: "Replay timeline" });
  await page.getByRole("button", { name: "Play replay" }).click();
  await expect
    .poll(async () => Number(await slider.inputValue()))
    .toBeGreaterThan(18);
  await page.getByRole("button", { name: "Pause replay" }).click();
  await slider.fill("30");
  await expect(slider).toHaveValue("30");
  await page.getByRole("button", { name: "Restart replay" }).click();
  await expect(slider).toHaveValue("0");
  await expect(page.getByTestId("assessment-headline")).toHaveText(
    "Waiting for usable location data",
  );
});

test("model card and mobile guide are usable without making release claims", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Open the model lab" }).click();
  await expect(
    page.getByRole("heading", { name: "A model. Not a crystal ball." }),
  ).toBeVisible();
  await expect(
    page.getByText("No — experimental", { exact: true }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download model card" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe(
    "smartcab-synthetic-model-card.json",
  );
  await page.getByRole("button", { name: "Open the build guide" }).click();
  await page.getByRole("button", { name: "iPhone", exact: true }).click();
  await expect(
    page.getByText("Use a Mac with Xcode", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("API failure clears old assessments instead of showing stale reassurance", async ({
  page,
}) => {
  await page.route("**/api/preview/analyze", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"detail":"unavailable"}',
    }),
  );
  await page.getByRole("button", { name: /A route detour/ }).click();
  await expect(page.getByTestId("assessment-headline")).toHaveText(
    "No assessment available",
  );
  await expect(
    page.getByRole("button", { name: /Try a check-in/ }),
  ).toBeDisabled();
});

test("rapid scenario switching does not display a stale response", async ({
  page,
}) => {
  await page.route("**/api/preview/analyze", async (route) => {
    if (route.request().postDataJSON().scenario === "detour")
      await new Promise((resolve) => setTimeout(resolve, 500));
    await route.continue();
  });
  await page.getByRole("button", { name: /A route detour/ }).click();
  await page.getByRole("button", { name: /Weak GPS signal/ }).click();
  await expect(page.getByTestId("assessment-headline")).toHaveText(
    "Waiting for usable location data",
  );
  await page.waitForTimeout(600);
  await expect(page.getByTestId("assessment-headline")).toHaveText(
    "Waiting for usable location data",
  );
});

test("runtime never contacts the production backend or a map provider", async ({
  page,
}) => {
  const external = [];
  page.on("request", (request) => {
    if (new URL(request.url()).origin !== new URL(page.url()).origin)
      external.push(request.url());
  });
  await page.reload();
  await expect(page.getByTestId("assessment-headline")).toHaveText(
    "No warning detected",
  );
  await page.getByRole("button", { name: /A route detour/ }).click();
  await expect(page.getByTestId("assessment-headline")).toHaveText(
    "A check-in may help",
  );
  expect(external).toHaveLength(0);
});
