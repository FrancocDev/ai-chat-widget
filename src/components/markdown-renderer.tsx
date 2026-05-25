"use client";

import { type ReactNode, memo } from "react";
import ReactMarkdown from "react-markdown";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import ts from "react-syntax-highlighter/dist/esm/languages/hljs/typescript";
import py from "react-syntax-highlighter/dist/esm/languages/hljs/python";
import bash from "react-syntax-highlighter/dist/esm/languages/hljs/bash";
import json from "react-syntax-highlighter/dist/esm/languages/hljs/json";
import css from "react-syntax-highlighter/dist/esm/languages/hljs/css";
import xml from "react-syntax-highlighter/dist/esm/languages/hljs/xml";
import sql from "react-syntax-highlighter/dist/esm/languages/hljs/sql";
import docco from "react-syntax-highlighter/dist/esm/styles/hljs/docco";

SyntaxHighlighter.registerLanguage("javascript", js);
SyntaxHighlighter.registerLanguage("js", js);
SyntaxHighlighter.registerLanguage("jsx", js);
SyntaxHighlighter.registerLanguage("typescript", ts);
SyntaxHighlighter.registerLanguage("ts", ts);
SyntaxHighlighter.registerLanguage("tsx", ts);
SyntaxHighlighter.registerLanguage("python", py);
SyntaxHighlighter.registerLanguage("py", py);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("sh", bash);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("html", xml);
SyntaxHighlighter.registerLanguage("xml", xml);
SyntaxHighlighter.registerLanguage("sql", sql);

const MarkdownLink = ({ ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a {...props} target="_blank" rel="noopener noreferrer" />
);

interface CodeProps {
  className?: string;
  children?: ReactNode;
}

const MarkdownCode = ({ className, ...props }: CodeProps) => {
  const { children, ...rest } = props;
  const match = /language-(\w+)/.exec(className ?? "");
  const codeStr = String(children).replace(/\n$/, "");
  if (match) {
    return (
      <SyntaxHighlighter language={match[1]} style={docco}>
        {codeStr}
      </SyntaxHighlighter>
    );
  }
  return (
    <code className={className} {...rest}>
      {children}
    </code>
  );
};

interface MarkdownRendererProps {
  text: string;
}

export const MarkdownRenderer = memo(function MarkdownRenderer({ text }: MarkdownRendererProps) {
  return (
    <div className="acw-markdown">
      <ReactMarkdown
        components={{
          a: MarkdownLink,
          code: MarkdownCode,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
});
