import { ThemeProvider } from "@/shared/lib/theme-context";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "../ThemeToggle";

// Мокаем localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Мокаем matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const renderWithTheme = (children: React.ReactNode) => {
  return render(<ThemeProvider>{children}</ThemeProvider>);
};

describe("ThemeToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders theme toggle button", () => {
    renderWithTheme(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /переключить тему/i });
    expect(button).toBeInTheDocument();
  });

  it("shows sun icon in light mode", () => {
    renderWithTheme(<ThemeToggle />);

    const sunIcon = screen.getByTestId("sun-icon");
    expect(sunIcon).toBeInTheDocument();
  });

  it("toggles theme when clicked", async () => {
    const user = userEvent.setup();
    renderWithTheme(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /переключить тему/i });
    await user.click(button);

    // Проверяем, что localStorage.setItem был вызван
    expect(localStorageMock.setItem).toHaveBeenCalledWith("theme", "dark");
  });

  it("has proper accessibility attributes", () => {
    renderWithTheme(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /переключить тему/i });
    expect(button).toHaveAttribute("aria-label", "Переключить тему");
  });
});
