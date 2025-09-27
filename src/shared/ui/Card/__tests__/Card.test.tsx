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

    it("renders card with only header and content", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Simple Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Simple content</p>
          </CardContent>
        </Card>
      );

      expect(screen.getByText("Simple Card")).toBeInTheDocument();
      expect(screen.getByText("Simple content")).toBeInTheDocument();
    });

    it("renders card with only content", () => {
      render(
        <Card>
          <CardContent>
            <p>Content only</p>
          </CardContent>
        </Card>
      );

      expect(screen.getByText("Content only")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper semantic structure", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Accessible Card</CardTitle>
            <CardDescription>This card is accessible</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Content with proper semantics</p>
          </CardContent>
        </Card>
      );

      const title = screen.getByRole("heading", { name: /accessible card/i });
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe("H3");
    });

    it("supports custom ARIA attributes", () => {
      render(
        <Card role="article" aria-labelledby="card-title">
          <CardHeader>
            <CardTitle id="card-title">ARIA Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Content with ARIA support</p>
          </CardContent>
        </Card>
      );

      const card = screen.getByRole("article");
      expect(card).toHaveAttribute("aria-labelledby", "card-title");
    });
  });

  describe("Custom Styling", () => {
    it("applies custom className to individual card components", () => {
      render(
        <Card>
          <CardHeader className="custom-header">
            <CardTitle className="custom-title">Custom Styled</CardTitle>
            <CardDescription className="custom-description">
              Custom description
            </CardDescription>
          </CardHeader>
          <CardContent className="custom-content">
            <p>Custom content</p>
          </CardContent>
          <CardFooter className="custom-footer">
            <button>Custom action</button>
          </CardFooter>
        </Card>
      );

      // Check CardHeader component
      expect(screen.getByText("Custom Styled").closest("div")).toHaveClass(
        "custom-header"
      );

      // Check CardTitle component
      expect(screen.getByText("Custom Styled")).toHaveClass("custom-title");

      // Check CardDescription component
      expect(screen.getByText("Custom description")).toHaveClass(
        "custom-description"
      );

      // Check CardContent component
      expect(screen.getByText("Custom content").closest("div")).toHaveClass(
        "custom-content"
      );

      // Check CardFooter component
      expect(screen.getByRole("button").closest("div")).toHaveClass(
        "custom-footer"
      );
    });
  });

  describe("Edge Cases", () => {
    it("handles empty content", () => {
      render(<Card />);
      const cards = screen.getAllByRole("generic");
      expect(cards[0]).toBeInTheDocument();
    });

    it("handles nested cards", () => {
      render(
        <Card>
          <CardContent>
            <Card>
              <CardContent>
                <p>Nested card content</p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      );

      expect(screen.getByText("Nested card content")).toBeInTheDocument();
    });

    it("handles multiple children in content", () => {
      render(
        <Card>
          <CardContent>
            <p>First paragraph</p>
            <p>Second paragraph</p>
            <div>Div content</div>
          </CardContent>
        </Card>
      );

      expect(screen.getByText("First paragraph")).toBeInTheDocument();
      expect(screen.getByText("Second paragraph")).toBeInTheDocument();
      expect(screen.getByText("Div content")).toBeInTheDocument();
    });
  });
});
