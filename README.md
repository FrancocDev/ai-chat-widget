# @francocdev/ai-chat-widget

Drop-in AI chat widget for React apps. Configurable, themeable, with Markdown support. Built on the [Vercel AI SDK v6](https://sdk.vercel.ai/).

```bash
npm install @francocdev/ai-chat-widget
```

## Quick Start

```tsx
// 1. Import styles (once, in your root layout)
import "@francocdev/ai-chat-widget/styles.css";

// 2. Wrap your app with the provider
import { ChatWidgetProvider, ChatTrigger } from "@francocdev/ai-chat-widget";

function App() {
  return (
    <ChatWidgetProvider
      config={{
        apiEndpoint: "/api/chat",
        title: "Ask me anything",
        subtitle: "Powered by Groq + Llama",
      }}
    >
      <YourApp />
      <ChatTrigger />
    </ChatWidgetProvider>
  );
}
```

```ts
// 3. Create your API route (Next.js App Router)
// app/api/chat/route.ts
import { createChatRoute } from "@francocdev/ai-chat-widget/server";

export const POST = createChatRoute({
  apiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-4o-mini",
  systemPrompt: "You are a helpful assistant.",
});
```

### Astro

```astro
---
// src/pages/api/chat.ts
import { createChatRoute } from "@francocdev/ai-chat-widget/server";

export const POST = createChatRoute({
  apiKey: import.meta.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
  model: "llama-3.3-70b-versatile",
  systemPrompt: "You are Franco's portfolio assistant.",
});
```

## Configuration

```tsx
<ChatWidgetProvider
  config={{
    apiEndpoint: "/api/chat",          // default
    title: "Ask me anything",           // default
    subtitle: "Powered by AI",           // default
    placeholder: "Type a message...",    // default
    emptyStateMessage: "Ask me anything!", // default
    storageKey: "ai-chat-widget",        // localStorage prefix
    theme: { /* see below */ },
  }}
>
```

## Theming

Override CSS custom properties to match your brand. All values use HSL format.

```css
:root {
  --acw-primary: hsl(220 20% 10%);
  --acw-primary-foreground: hsl(0 0% 98%);
  --acw-muted: hsl(220 15% 95%);
  --acw-card: hsl(0 0% 100%);
  --acw-border: hsl(220 13% 91%);
  --acw-foreground: hsl(220 20% 10%);
  --acw-muted-foreground: hsl(220 9% 46%);
  --acw-background: hsl(0 0% 100%);
  --acw-destructive: hsl(0 84% 60%);
  --acw-ring: hsl(220 20% 10%);
}
```

## Server API

### `createChatRoute(config)` — Returns a standard `Request → Response` handler.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | — | API key for the provider |
| `baseURL` | `string` | `https://api.openai.com/v1` | Custom provider base URL |
| `model` | `string` | `gpt-4o-mini` | Model ID |
| `systemPrompt` | `string \| () => string \| Promise<string>` | — | Static prompt or async builder |

**Async system prompt** — fetch data at request time:

```ts
export const POST = createChatRoute({
  apiKey: process.env.OPENAI_API_KEY!,
  systemPrompt: async () => {
    const products = await db.product.findMany();
    return `You are a store assistant. Products: ${JSON.stringify(products)}`;
  },
});
```

## Exports

| Export | Kind | Description |
|--------|------|-------------|
| `ChatWidgetProvider` | Component | Context provider for configuration |
| `ChatTrigger` | Component | Floating button + panel (drop-in) |
| `ChatWidget` | Component | Chat panel only (no trigger button) |
| `useChatWidgetConfig` | Hook | Read config from context |
| `createChatRoute` | Function | Server route factory |
| `ChatWidgetConfig` | Type | Config shape |
| `ChatRouteConfig` | Type | Server config shape |
| `ChatWidgetTheme` | Type | Theme shape |

## Peer Dependencies

This package expects your project to already have:

| Package | Version |
|---------|---------|
| `ai` | `^6.0.0` |
| `@ai-sdk/react` | `^3.0.0` |
| `@ai-sdk/openai` | `^3.0.0` |
| `react` | `^18 \|\| ^19` |
| `react-dom` | `^18 \|\| ^19` |

Any OpenAI-compatible provider works (Groq, Together, Fireworks, etc.) by setting `baseURL` and `apiKey`.

## License

MIT
