import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load homepage successfully", async ({ page }) => {
    await page.goto("/");

    // Check if the page loads without errors
    await expect(page).toHaveTitle(/Каталог металлопроката/);

    // Check if main content is visible
    await expect(
      page.locator("h1:has-text('Каталог металлопроката')")
    ).toBeVisible();
  });

  test("should display configuration status", async ({ page }) => {
    await page.goto("/");

    // Check if configuration status components are present
    await expect(
      page.locator('h3:has-text("Статус конфигурации")')
    ).toBeVisible();
    // Database status might be in loading or error state, so check for any database-related content
    await expect(page.locator('text="Статус базы данных"')).toBeVisible();
  });

  test("should handle navigation", async ({ page }) => {
    await page.goto("/");

    // Test navigation if navigation elements exist
    const nav = page.locator("nav");
    if ((await nav.count()) > 0) {
      await expect(nav).toBeVisible();
    }
  });

  test("should be responsive", async ({ page }) => {
    await page.goto("/");

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(
      page.locator("h1:has-text('Каталог металлопроката')")
    ).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(
      page.locator("h1:has-text('Каталог металлопроката')")
    ).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(
      page.locator("h1:has-text('Каталог металлопроката')")
    ).toBeVisible();
  });

  test("should have proper accessibility", async ({ page }) => {
    await page.goto("/");

    // Check for proper heading structure
    const headings = page.locator("h1, h2, h3, h4, h5, h6");
    await expect(headings.first()).toBeVisible();

    // Check that the page has proper semantic structure
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h2, h3")).toHaveCount(5);
  });
});

// API tests are temporarily disabled until database setup is complete
// test.describe("API Endpoints", () => {
//   test("should test database connection", async ({ page }) => {
//     // Test the database test endpoint
//     const response = await page.request.get("/api/database/test");
//     expect(response.status()).toBe(200);

//     const data = await response.json();
//     expect(data).toHaveProperty("success");
//     expect(data).toHaveProperty("message");
//     expect(data).toHaveProperty("stats");
//   });

//   test("should test configuration check", async ({ page }) => {
//     // Test the configuration check endpoint
//     const response = await page.request.get("/api/config/check");
//     expect(response.status()).toBe(200);

//     const data = await response.json();
//     expect(data).toHaveProperty("status");
//     expect(data).toHaveProperty("environment");
//     expect(data.environment).toHaveProperty("database");
//     expect(data.environment).toHaveProperty("auth");
//     expect(data.environment).toHaveProperty("aws");
//   });
// });
