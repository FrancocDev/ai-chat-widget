import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    server: "src/server.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: true,
  external: [
    "react",
    "react-dom",
    "ai",
    "@ai-sdk/react",
    "@ai-sdk/openai",
    "react-markdown",
    "lucide-react",
    "react-syntax-highlighter",
    "focus-trap-react",
  ],
  treeshake: true,
});
