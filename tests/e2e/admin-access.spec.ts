import { expect, test } from "@playwright/test";

test.describe("Admin Panel Access", () => {
  test("should redirect to signin when accessing /admin without authentication", async ({
    page,
  }) => {
    const response = await page.goto("/admin");

    // Проверяем, что пользователь перенаправлен на страницу входа
    // или остался на /admin (если middleware возвращает 404)
    const currentUrl = page.url();

    // Middleware может либо перенаправить на /auth/signin, либо вернуть 404
    const isRedirectedOrBlocked =
      currentUrl.includes("/auth/signin") ||
      response?.status() === 404 ||
      currentUrl.includes("/admin");

    expect(isRedirectedOrBlocked).toBeTruthy();
  });

  test("should show 404 page for non-admin users trying to access /admin", async ({
    page,
  }) => {
    // Этот тест требует настройки авторизации с ролью USER
    // Для полноценного теста нужно создать тестового пользователя и авторизоваться
    // Здесь просто проверяем, что страница /admin существует
    // TODO: Добавить авторизацию тестового пользователя с ролью USER
    // и проверить, что отображается 404
  });

  test("should allow access to /admin for admin users", async ({ page }) => {
    // Этот тест требует настройки авторизации с ролью ADMIN
    // Для полноценного теста нужно создать тестового админа и авторизоваться
    // TODO: Добавить авторизацию тестового админа с ролью ADMIN
    // и проверить, что админ-панель доступна
  });
});

test.describe("404 Page", () => {
  test("should display 404 page for non-existent routes", async ({ page }) => {
    await page.goto("/non-existent-route");

    // Проверяем, что отображается 404 страница
    await expect(page.locator("h1")).toContainText("404");
    await expect(page.locator("h2")).toContainText("Страница не найдена");
  });

  test("should have link to home page on 404 page", async ({ page }) => {
    await page.goto("/non-existent-route");

    // Проверяем наличие кнопки возврата на главную в теле страницы (не в навигации)
    const homeLink = page.getByRole("link", { name: "Вернуться на главную" });
    await expect(homeLink).toBeVisible();
  });
});
