import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownRenderer } from "../components/markdown-renderer";

describe("MarkdownRenderer", () => {
  it("renders plain text", () => {
    render(<MarkdownRenderer text="Hello world" />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders bold text", () => {
    render(<MarkdownRenderer text="**bold**" />);
    expect(screen.getByText("bold")).toBeInTheDocument();
    const strong = document.querySelector("strong");
    expect(strong).toBeInTheDocument();
  });

  it("renders links with target blank", () => {
    render(<MarkdownRenderer text="[link](https://example.com)" />);
    const link = screen.getByText("link");
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders inline code", () => {
    render(<MarkdownRenderer text="`code`" />);
    const code = document.querySelector("code");
    expect(code).toBeInTheDocument();
    expect(code).toHaveTextContent("code");
  });

  it("renders code blocks", () => {
    render(<MarkdownRenderer text={'```js\nconst x = 1;\n```'} />);
    const pre = document.querySelector("pre");
    expect(pre).toBeInTheDocument();
  });

  it("renders lists", () => {
    render(<MarkdownRenderer text={`- item 1
- item 2`} />);
    expect(screen.getByText("item 1")).toBeInTheDocument();
    expect(screen.getByText("item 2")).toBeInTheDocument();
    const list = document.querySelector("ul");
    expect(list).toBeInTheDocument();
  });
});
