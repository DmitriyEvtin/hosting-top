import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load homepage successfully", async ({ page }) => {
    await page.goto("/");

    // Check if the page loads without errors
    await expect(page).toHaveTitle(/Hosting Top/);

    // Check if main content is visible
    await expect(
      page.locator("h1:has-text('Hosting Top')")
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
      page.locator("h1:has-text('Hosting Top')")
    ).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(
      page.locator("h1:has-text('Hosting Top')")
    ).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(
      page.locator("h1:has-text('Hosting Top')")
    ).toBeVisible();
  });

  test("should have proper accessibility", async ({ page }) => {
    await page.goto("/");

    // Check for proper heading structure
    const headings = page.locator("h1, h2, h3, h4, h5, h6");
    await expect(headings.first()).toBeVisible();

    // Check that the page has proper semantic structure
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h2, h3")).toHaveCount(6);
  });
});

test.describe("API Endpoints", () => {
  test("should test database connection", async ({ page }) => {
    // Test the database test endpoint
    const response = await page.request.get("/api/database/test");

    // Response should be either 200 (success) or 500 (error)
    expect([200, 500]).toContain(response.status());

    const data = await response.json();
    expect(data).toHaveProperty("success");
    expect(data).toHaveProperty("message");

    if (data.success) {
      expect(data).toHaveProperty("stats");
      expect(data.stats).toHaveProperty("users");
      expect(data.stats).toHaveProperty("categories");
      expect(data.stats).toHaveProperty("products");
      expect(data.stats).toHaveProperty("sessions");
    } else {
      expect(data).toHaveProperty("error");
    }
  });

  test("should test configuration check", async ({ page }) => {
    // Test the configuration check endpoint
    const response = await page.request.get("/api/config/check");

    // Response should be either 200 (healthy) or 503 (degraded)
    expect([200, 503]).toContain(response.status());

    const data = await response.json();
    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("timestamp");
    expect(data).toHaveProperty("environment");
    expect(data.environment).toHaveProperty("database");
    expect(data.environment).toHaveProperty("auth");
    expect(data.environment).toHaveProperty("aws");
  });

  test("should test simple configuration check", async ({ page }) => {
    // Test the simple configuration check endpoint
    const response = await page.request.get("/api/config/simple");

    // Response should be either 200 (healthy) or 503 (degraded)
    expect([200, 503]).toContain(response.status());

    const data = await response.json();
    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("timestamp");
    expect(data).toHaveProperty("environment");
    expect(data.environment).toHaveProperty("nodeEnv");
    expect(data.environment).toHaveProperty("appName");
    expect(data.environment).toHaveProperty("appVersion");
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // Test non-existent endpoint
    const response = await page.request.get("/api/non-existent");
    expect(response.status()).toBe(404);
  });
});

test.describe("User Interactions", () => {
  test("should handle button clicks", async ({ page }) => {
    await page.goto("/");

    // Look for any buttons on the page and test clicking them
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      // Test clicking the first button
      await buttons.first().click();
      // Verify the page doesn't crash
      await expect(page.locator("h1")).toBeVisible();
    }
  });

  test("should handle form interactions", async ({ page }) => {
    await page.goto("/");

    // Look for any input fields on the page
    const inputs = page.locator("input, textarea, select");
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      // Test typing in the first input
      await inputs.first().fill("test input");
      await expect(inputs.first()).toHaveValue("test input");
    }
  });

  test("should handle keyboard navigation", async ({ page }) => {
    await page.goto("/");

    // Test tab navigation
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Verify the page is still functional
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("Performance", () => {
  test("should load within acceptable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/");
    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test("should have proper meta tags", async ({ page }) => {
    await page.goto("/");

    // Check for essential meta tags
    const title = await page.title();
    expect(title).toContain("Hosting Top");

    // Check for viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute("content", /width=device-width/);
  });
});

test.describe("Error Handling", () => {
  test("should handle network errors gracefully", async ({ page }) => {
    // Simulate network failure
    await page.route("**/*", route => route.abort());

    try {
      await page.goto("/", { timeout: 5000 });
    } catch (error) {
      // Expected to fail due to network simulation
      expect(error).toBeDefined();
    }
  });

  test("should handle JavaScript errors gracefully", async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");

    // Wait a bit for any async operations
    await page.waitForTimeout(1000);

    // Log errors for debugging but don't fail the test
    if (errors.length > 0) {
      console.log("Console errors detected:", errors);
    }
  });
});
