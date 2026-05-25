# Changelog

## [0.5.5] - 2026-05-25

### Fixed
- **Removed experimental tool support from `createChatRoute`**: The `tools` option on `ChatRouteConfig` was causing `MissingToolResultsError` with `ai` v6 `streamText`. `createChatRoute` now performs simple text streaming without tools. For tool-based workflows, implement your own server route using `generateText` or `streamText` with `maxSteps` directly.

## [0.5.4] - 2026-05-25

### Fixed
- **Client-side tool support for `ai` v6**: `createChatRoute` now automatically wraps tools without an `execute` function (client-side UI tools) with a proxy `execute` that returns `{ __client_tool: true, args }`. This prevents `MissingToolResultsError` from `streamText` in `ai` v6, which requires all tools passed to it to have an `execute` function. Server-side tools (with `execute`) continue to work as before.

## [0.5.1] - 2026-05-24

### Fixed
- **CSS injection survives Astro View Transitions**: Replaced module-level `cssInjected` singleton flag with DOM check (`document.querySelector("style[data-acw]")`). When using frameworks with client-side navigation (e.g., Astro ClientRouter, Next.js App Router), the `<head>` may be swapped, removing the injected `<style>` tag. The widget now correctly re-injects CSS on remount if the style element is missing.

## [0.4.0] - 2026-05-19

### Added
- **i18n support**: New `labels` config option replaces all hardcoded English strings (`thinking`, `error`, `toggleChat`, `clearChat`, `close`, `stop`).
- **Syntax highlighting**: Built-in code highlighting for AI code responses via `react-syntax-highlighter`. Supports JS/TS, Python, Bash, JSON, CSS, HTML, SQL.
- **`className` and `style` props** on both `ChatWidget` and `ChatTrigger` for quick styling overrides.
- **`renderMessage` slot**: Customize how each chat message renders with full control over JSX.
- **Stop generation button**: Visible during streaming, calls `stop()` from `useChat`.
- **Accessibility**: Full a11y pass — focus trap, `Escape` to close, `role="dialog"`, `aria-modal`, `aria-live="polite"`, `aria-label` on all buttons, auto-focus input on open, focus return to trigger on close.
- **Cross-tab storage sync**: Messages stay in sync across browser tabs via `storage` event listener.
- **Lazy-load feedback**: Loading spinner shown while the chat widget chunk loads, both in the fallback panel and the trigger button.
- **`ChatWidgetLabels` type** exported for custom label definitions.
- **`ResolvedChatWidgetConfig` type** exported for type-safe resolved config.
- **`sideEffects: false`** in package.json for better tree-shaking.
- **`engines.node >= 18`** in package.json.
- **CI/CD**: GitHub Actions workflows for test+build on push/PR and automated npm publish on version tags.
- **Extended test suite**: A11y tests with `jest-axe`, integration tests with `msw`, extended unit tests for new features.

### Changed
- **CSS variables now scoped** to `.acw-chat-panel` instead of `:root`, preventing global collisions with host styles.
- **`lucide-react` moved to `peerDependencies`** to avoid duplicate icon bundles when the host already uses it.
- **Default chat transport fixed**: Uses `DefaultChatTransport<UIMessage>` from `ai` instead of untyped constructor (lazy-initialized ref avoids creating a new instance on every render).
- **Server error handling improved**: Malformed JSON now returns `400 Bad Request` instead of `500`.

### Fixed
- **`Required<ChatWidgetConfig>` type bug**: `DEFAULT_CONFIG.theme = {}` now correctly typed with `ResolvedChatWidgetConfig`.
- **Duplicated `<style>` injection**: CSS now injected once via `useInsertionEffect` with module-level singleton guard.
- **Provider caching**: `createOpenAI` now cached once instead of on every request.
- **`any` type removed** from ReactMarkdown `code` component — now properly typed.

### Removed
- **`convertToModelMessages`** no longer called manually in server route — `streamText` handles message conversion natively.

## [0.3.6] - 2026-03-RELEASE_DATE
- Initial public release with `ChatWidgetProvider`, `ChatTrigger`, `ChatWidget`, `createChatRoute`.
