import { render, screen } from "@testing-library/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../Card";

describe("Card Components", () => {
  describe("Card", () => {
    it("renders with default props", () => {
      render(<Card>Card content</Card>);

      const card = screen.getByText("Card content");
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass("rounded-lg border bg-card");
    });

    it("applies custom className", () => {
      render(<Card className="custom-card">Custom card</Card>);

      const card = screen.getByText("Custom card");
      expect(card).toHaveClass("custom-card");
    });
  });

  describe("CardHeader", () => {
    it("renders with default props", () => {
      render(
        <Card>
          <CardHeader>Header content</CardHeader>
        </Card>
      );

      const header = screen.getByText("Header content");
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("flex flex-col space-y-1.5 p-6");
    });
  });

  describe("CardTitle", () => {
    it("renders with default props", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
        </Card>
      );

      const title = screen.getByText("Card Title");
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass(
        "text-2xl font-semibold leading-none tracking-tight"
      );
    });
  });

  describe("CardDescription", () => {
    it("renders with default props", () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
        </Card>
      );

      const description = screen.getByText("Card description");
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass("text-sm text-muted-foreground");
    });
  });

  describe("CardContent", () => {
    it("renders with default props", () => {
      render(
        <Card>
          <CardContent>Card content</CardContent>
        </Card>
      );

      const content = screen.getByText("Card content");
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass("p-6 pt-0");
    });
  });

  describe("CardFooter", () => {
    it("renders with default props", () => {
      render(
        <Card>
          <CardFooter>Footer content</CardFooter>
        </Card>
      );

      const footer = screen.getByText("Footer content");
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass("flex items-center p-6 pt-0");
    });
  });

  describe("Complete Card Structure", () => {
    it("renders a complete card with all components", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Product Name</CardTitle>
            <CardDescription>Product description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Product details</p>
          </CardContent>
          <CardFooter>
            <button>Add to cart</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText("Product Name")).toBeInTheDocument();
      expect(screen.getByText("Product description")).toBeInTheDocument();
      expect(screen.getByText("Product details")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /add to cart/i })
      ).toBeInTheDocument();
    });
  });
});
