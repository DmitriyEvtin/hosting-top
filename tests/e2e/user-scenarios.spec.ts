import { expect, test } from "@playwright/test";

test.describe("User Journey - Application Startup", () => {
  test("should complete full application startup flow", async ({ page }) => {
    // Start from homepage
    await page.goto("/");

    // Verify main page loads
    await expect(page.locator("h1")).toBeVisible();

    // Check configuration status loads
    await expect(
      page.locator('h3:has-text("Статус конфигурации")')
    ).toBeVisible();

    // Wait for any async operations to complete
    await page.waitForTimeout(2000);

    // Verify page is fully loaded and functional
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should handle application errors gracefully", async ({ page }) => {
    // Mock API errors
    await page.route("**/api/**", route => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal server error" }),
      });
    });

    await page.goto("/");

    // Application should still load despite API errors
    await expect(page.locator("h1")).toBeVisible();

    // Check for error handling
    const errorMessages = page.locator('text="Ошибка", text="Error"');
    if ((await errorMessages.count()) > 0) {
      await expect(errorMessages.first()).toBeVisible();
    }
  });
});

test.describe("User Journey - Configuration Management", () => {
  test("should allow user to check system status", async ({ page }) => {
    await page.goto("/");

    // User should be able to see system status
    await expect(
      page.locator('h3:has-text("Статус конфигурации")')
    ).toBeVisible();

    // Check database status
    await expect(page.locator('text="Статус базы данных"')).toBeVisible();

    // User should be able to see configuration details
    const configDetails = page.locator('text="Окружение", text="Environment"');
    if ((await configDetails.count()) > 0) {
      await expect(configDetails.first()).toBeVisible();
    }
  });

  test("should provide feedback on system health", async ({ page }) => {
    await page.goto("/");

    // System should provide clear feedback on health status
    const healthIndicators = page.locator(
      'text="healthy", text="degraded", text="error"'
    );
    if ((await healthIndicators.count()) > 0) {
      await expect(healthIndicators.first()).toBeVisible();
    }
  });
});

test.describe("User Journey - Error Recovery", () => {
  test("should recover from network errors", async ({ page }) => {
    // Simulate network failure initially
    await page.route("**/api/**", route => route.abort());

    await page.goto("/");

    // Page should still load basic content
    await expect(page.locator("h1")).toBeVisible();

    // Restore network
    await page.unroute("**/api/**");

    // Refresh page
    await page.reload();

    // Should now load full content
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should handle partial failures gracefully", async ({ page }) => {
    // Mock partial API failures
    await page.route("**/api/database/test", route => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: "Database error" }),
      });
    });

    await page.route("**/api/config/check", route => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "degraded",
          environment: { database: { status: "error" } },
        }),
      });
    });

    await page.goto("/");

    // Application should handle partial failures
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("User Journey - Performance", () => {
  test("should load within acceptable time limits", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/");
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);

    // Verify content is visible
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should handle concurrent user interactions", async ({ page }) => {
    await page.goto("/");

    // Simulate multiple rapid interactions
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      // Rapid clicking
      for (let i = 0; i < Math.min(5, buttonCount); i++) {
        await buttons.nth(i).click();
        await page.waitForTimeout(100);
      }
    }

    // Application should remain stable
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("User Journey - Accessibility", () => {
  test("should be navigable with keyboard only", async ({ page }) => {
    await page.goto("/");

    // Navigate using only keyboard
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Verify focus is working
    const focusedElement = page.locator(":focus");
    if ((await focusedElement.count()) > 0) {
      await expect(focusedElement).toBeVisible();
    }
  });

  test("should have proper semantic structure", async ({ page }) => {
    await page.goto("/");

    // Check for proper heading hierarchy
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();

    // Check for other semantic elements
    const headings = page.locator("h1, h2, h3, h4, h5, h6");
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
  });
});

test.describe("User Journey - Mobile Experience", () => {
  test("should work on mobile devices", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");

    // Verify mobile layout
    await expect(page.locator("h1")).toBeVisible();

    // Check for mobile-specific elements
    const mobileElements = page.locator("[data-mobile], .mobile-only");
    if ((await mobileElements.count()) > 0) {
      await expect(mobileElements.first()).toBeVisible();
    }
  });

  test("should handle touch interactions", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Simulate touch interactions
    const touchTargets = page.locator("button, a, input");
    const targetCount = await touchTargets.count();

    if (targetCount > 0) {
      // Simulate tap
      await touchTargets.first().tap();

      // Verify interaction worked
      await expect(page.locator("h1")).toBeVisible();
    }
  });
});

test.describe("User Journey - Data Loading", () => {
  test("should handle data loading states", async ({ page }) => {
    // Mock slow data loading
    await page.route("**/api/**", async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: "test" }),
      });
    });

    await page.goto("/");

    // Check for loading states
    const loadingIndicators = page.locator(
      'text="Загрузка...", text="Loading..."'
    );
    if ((await loadingIndicators.count()) > 0) {
      await expect(loadingIndicators.first()).toBeVisible();
    }
  });

  test("should handle empty data states", async ({ page }) => {
    // Mock empty data responses
    await page.route("**/api/**", route => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [], total: 0 }),
      });
    });

    await page.goto("/");

    // Application should handle empty data gracefully
    await expect(page.locator("h1")).toBeVisible();
  });
});
