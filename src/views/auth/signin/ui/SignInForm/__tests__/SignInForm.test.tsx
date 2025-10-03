import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SignInForm } from "../SignInForm";

// Мокаем next-auth/react
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  getSession: jest.fn(),
}));

// Мокаем next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe("SignInForm", () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
      back: jest.fn(),
      forward: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
    jest.clearAllMocks();
  });

  it("renders sign in form", () => {
    render(<SignInForm />);

    expect(screen.getByText("Вход в систему")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Пароль")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Войти" })).toBeInTheDocument();
  });

  it("handles form submission with valid credentials", async () => {
    mockSignIn.mockResolvedValue({
      error: null,
      ok: true,
      status: 200,
      url: null,
    });

    render(<SignInForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "test@example.com",
        password: "password123",
        redirect: false,
      });
    });
  });

  it("displays error message for invalid credentials", async () => {
    mockSignIn.mockResolvedValue({
      error: "Invalid credentials",
      ok: false,
      status: 401,
      url: null,
    });

    render(<SignInForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "wrongpassword" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => {
      expect(screen.getByText("Неверный email или пароль")).toBeInTheDocument();
    });
  });

  it("handles Google sign in", async () => {
    render(<SignInForm />);

    fireEvent.click(screen.getByRole("button", { name: "Войти через Google" }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("google", { callbackUrl: "/" });
    });
  });

  it("handles GitHub sign in", async () => {
    render(<SignInForm />);

    fireEvent.click(screen.getByRole("button", { name: "Войти через GitHub" }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("github", { callbackUrl: "/" });
    });
  });

  it("shows loading state during form submission", async () => {
    mockSignIn.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<SignInForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    expect(screen.getByText("Вход...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Вход..." })).toBeDisabled();
  });

  it("validates required fields", async () => {
    render(<SignInForm />);

    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Пароль")).toBeRequired();
  });

  it("shows link to sign up page", () => {
    render(<SignInForm />);

    const signUpLink = screen.getByRole("link", { name: "Зарегистрироваться" });
    expect(signUpLink).toHaveAttribute("href", "/auth/signup");
  });
});
