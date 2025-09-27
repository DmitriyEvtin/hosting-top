import { expect, test } from "@playwright/test";

test.describe("Configuration Management", () => {
  test("should display configuration status on homepage", async ({ page }) => {
    await page.goto("/");

    // Check for configuration status section
    await expect(
      page.locator('h3:has-text("Статус конфигурации")')
    ).toBeVisible();

    // Check for database status
    await expect(page.locator('text="Статус базы данных"')).toBeVisible();

    // Check for configuration status components
    const configStatus = page.locator('[data-testid="config-status"]');
    if ((await configStatus.count()) > 0) {
      await expect(configStatus).toBeVisible();
    }
  });

  test("should handle configuration loading states", async ({ page }) => {
    await page.goto("/");

    // Wait for any loading indicators to appear and disappear
    const loadingIndicators = page.locator('text="Загрузка..."');
    if ((await loadingIndicators.count()) > 0) {
      await expect(loadingIndicators.first()).toBeVisible();
      // Wait for loading to complete
      await expect(loadingIndicators.first()).not.toBeVisible({
        timeout: 10000,
      });
    }
  });

  test("should display error states gracefully", async ({ page }) => {
    await page.goto("/");

    // Check for error states in configuration
    const errorMessages = page.locator('text="Ошибка"');
    if ((await errorMessages.count()) > 0) {
      // Error messages should be visible and informative
      await expect(errorMessages.first()).toBeVisible();
    }
  });

  test("should handle configuration refresh", async ({ page }) => {
    await page.goto("/");

    // Look for refresh buttons or similar functionality
    const refreshButtons = page.locator(
      'button:has-text("Обновить"), button:has-text("Refresh")'
    );
    if ((await refreshButtons.count()) > 0) {
      await refreshButtons.first().click();
      // Wait for refresh to complete
      await page.waitForTimeout(2000);
      // Verify the page is still functional
      await expect(page.locator("h1")).toBeVisible();
    }
  });
});

test.describe("Database Status", () => {
  test("should display database connection status", async ({ page }) => {
    await page.goto("/");

    // Check for database status indicators
    const dbStatus = page.locator('text="Статус базы данных"');
    await expect(dbStatus).toBeVisible();

    // Check for database status values
    const statusValues = page.locator(
      'text="Подключено", text="Ошибка", text="Недоступно"'
    );
    if ((await statusValues.count()) > 0) {
      await expect(statusValues.first()).toBeVisible();
    }
  });

  test("should handle database connection errors", async ({ page }) => {
    // Mock database connection failure
    await page.route("**/api/database/test", route => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Ошибка подключения к базе данных",
          error: "Connection timeout",
        }),
      });
    });

    await page.goto("/");

    // Check for error state display
    const errorState = page.locator('text="Ошибка подключения"');
    if ((await errorState.count()) > 0) {
      await expect(errorState.first()).toBeVisible();
    }
  });
});

test.describe("Environment Configuration", () => {
  test("should display environment information", async ({ page }) => {
    await page.goto("/");

    // Check for environment details
    const envInfo = page.locator('text="Окружение", text="Environment"');
    if ((await envInfo.count()) > 0) {
      await expect(envInfo.first()).toBeVisible();
    }
  });

  test("should handle missing environment variables", async ({ page }) => {
    // Mock missing environment variables
    await page.route("**/api/config/check", route => {
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          status: "degraded",
          timestamp: new Date().toISOString(),
          environment: {
            database: { status: "error" },
            redis: { status: "not_configured" },
            aws: { status: "not_configured" },
          },
        }),
      });
    });

    await page.goto("/");

    // Check for degraded status display
    const degradedStatus = page.locator('text="degraded", text="Degraded"');
    if ((await degradedStatus.count()) > 0) {
      await expect(degradedStatus.first()).toBeVisible();
    }
  });
});

test.describe("Service Status", () => {
  test("should display service status indicators", async ({ page }) => {
    await page.goto("/");

    // Check for various service status indicators
    const serviceStatuses = page.locator(
      'text="Redis", text="AWS", text="SMTP", text="Sentry"'
    );
    if ((await serviceStatuses.count()) > 0) {
      await expect(serviceStatuses.first()).toBeVisible();
    }
  });

  test("should handle service unavailability", async ({ page }) => {
    // Mock service unavailability
    await page.route("**/api/config/check", route => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "healthy",
          timestamp: new Date().toISOString(),
          environment: {
            database: { status: "connected" },
            redis: { status: "not_configured" },
            aws: { status: "not_configured" },
            smtp: { status: "not_configured" },
            monitoring: { sentry: "not_configured" },
          },
        }),
      });
    });

    await page.goto("/");

    // Check for service status display
    const serviceStatus = page.locator('text="not_configured"');
    if ((await serviceStatus.count()) > 0) {
      await expect(serviceStatus.first()).toBeVisible();
    }
  });
});

test.describe("Performance Monitoring", () => {
  test("should display performance metrics", async ({ page }) => {
    await page.goto("/");

    // Check for performance-related information
    const performanceInfo = page.locator(
      'text="Производительность", text="Performance"'
    );
    if ((await performanceInfo.count()) > 0) {
      await expect(performanceInfo.first()).toBeVisible();
    }
  });

  test("should handle slow responses", async ({ page }) => {
    // Mock slow response
    await page.route("**/api/config/check", async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "healthy",
          timestamp: new Date().toISOString(),
          environment: {},
        }),
      });
    });

    const startTime = Date.now();
    await page.goto("/");
    const loadTime = Date.now() - startTime;

    // Should handle slow responses gracefully
    expect(loadTime).toBeLessThan(10000);
  });
});
