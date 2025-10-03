import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { signOut, useSession } from "next-auth/react";
import { UserMenu } from "../UserMenu";

// Мокаем next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

describe("UserMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows sign in and sign up buttons when user is not authenticated", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    });

    render(<UserMenu />);

    expect(screen.getByRole("link", { name: "Войти" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Регистрация" })
    ).toBeInTheDocument();
  });

  it("shows loading state when session is loading", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "loading",
      update: jest.fn(),
    });

    render(<UserMenu />);

    // В состоянии загрузки показывается div с анимацией
    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });

  it("shows user menu when user is authenticated", () => {
    const mockSession = {
      user: {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "USER",
        image: null,
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<UserMenu />);

    expect(screen.getByText("Test User")).toBeInTheDocument();
  });

  it("shows user avatar when user has image", () => {
    const mockSession = {
      user: {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "USER",
        image: "https://example.com/avatar.jpg",
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<UserMenu />);

    const avatar = screen.getByAltText("Test User");
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  it("shows user initials when user has no image", () => {
    const mockSession = {
      user: {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "USER",
        image: null,
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<UserMenu />);

    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("shows user email as initials when user has no name", () => {
    const mockSession = {
      user: {
        id: "1",
        email: "test@example.com",
        name: null,
        role: "USER",
        image: null,
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<UserMenu />);

    expect(screen.getByText("U")).toBeInTheDocument();
  });

  it("opens dropdown menu when clicked", async () => {
    const mockSession = {
      user: {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "USER",
        image: null,
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<UserMenu />);

    const userButton = screen.getByText("Test User");
    fireEvent.click(userButton);

    await waitFor(() => {
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
      expect(screen.getByText("Роль: USER")).toBeInTheDocument();
      expect(screen.getByText("Профиль")).toBeInTheDocument();
      expect(screen.getByText("Выйти")).toBeInTheDocument();
    });
  });

  it("shows admin panel link for admin users", async () => {
    const mockSession = {
      user: {
        id: "1",
        email: "admin@example.com",
        name: "Admin User",
        role: "ADMIN",
        image: null,
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<UserMenu />);

    const userButton = screen.getByText("Admin User");
    fireEvent.click(userButton);

    await waitFor(() => {
      expect(screen.getByText("Админ-панель")).toBeInTheDocument();
    });
  });

  it("handles sign out", async () => {
    const mockSession = {
      user: {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "USER",
        image: null,
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: jest.fn(),
    });

    mockSignOut.mockResolvedValue(undefined);

    render(<UserMenu />);

    const userButton = screen.getByText("Test User");
    fireEvent.click(userButton);

    await waitFor(() => {
      const signOutButton = screen.getByText("Выйти");
      fireEvent.click(signOutButton);
    });

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/" });
  });

  it("closes dropdown when clicking outside", async () => {
    const mockSession = {
      user: {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "USER",
        image: null,
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<UserMenu />);

    const userButton = screen.getByText("Test User");
    fireEvent.click(userButton);

    await waitFor(() => {
      expect(screen.getByText("Профиль")).toBeInTheDocument();
    });

    // Click outside using mousedown (as implemented in the component)
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText("Профиль")).not.toBeInTheDocument();
    });
  });
});
