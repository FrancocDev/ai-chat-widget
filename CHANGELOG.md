# Changelog

## [0.6.0] - 2026-05-25

### Changed
- **Discriminated union for message parts**: `ChatWidgetMessagePart` is now a proper discriminated union (`ChatWidgetTextPart | ChatWidgetToolPart`) instead of an interface with `[key: string]: unknown`. This restores type safety and eliminates the need for duck-typing helpers.
- **Input label separated from placeholder**: Added `messageInputLabel` to `ChatWidgetLabels` (default: `"Message input"`). The input's `<label>` no longer duplicates the placeholder text, improving screen reader experience.
- **Transport reacts to `apiEndpoint` changes**: The chat transport is now recreated when `apiEndpoint` changes at runtime.
- **Error boundary retry**: `LazyErrorBoundary` now uses a `retryKey` to force clean remount on retry, making error recovery more reliable.
- **Single-pass message rendering**: `MessageList` now iterates message parts once instead of twice.

### Fixed
- **CHANGELOG accuracy**: v0.5.6 and v0.4.0 entries corrected to match actual code (no `safeConvertMessages`, `convertToModelMessages` is still called).
- **Type safety**: Removed unsafe `as any[]` cast in server validation; added proper type guards.
- **Accessibility**: Added `aria-hidden="true"` to all decorative SVG icons (trigger button, message input, empty state).
- **Semantic HTML**: Code blocks now render with `<pre>` instead of `<div>`.
- **Server validation**: `validateMessages` now properly checks for pending tool invocations.
- **Dead type declarations**: Removed `src/types/react-syntax-highlighter.d.ts` which had wrong module paths.

### Added
- **`sideEffects` field** in package.json to help bundlers with tree-shaking.
- **Test coverage**: Improved from 83% to 91.7% statements by adding behavior-based tests for error boundaries, server validation, legacy storage, and tool rendering edge cases.
- **`@vitest/coverage-v8`** as dev dependency.

## [0.5.6] - 2026-05-25

### Fixed
- **Request validation in `createChatRoute`**: Added `validateMessages` to reject requests containing pending tool invocations before passing them to `convertToModelMessages`, preventing `MissingToolResultsError` from `streamText` in `ai` v6. Client-side tools (without `execute`) are automatically wrapped with a proxy.

## [0.5.5] - 2026-05-25

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
- **Internal `convertToModelMessages` refactored**: Conversion still runs in server route but is now preceded by `validateMessages` to catch pending tool invocations early.

## [0.3.6] - 2026-03-RELEASE_DATE
- Initial public release with `ChatWidgetProvider`, `ChatTrigger`, `ChatWidget`, `createChatRoute`.
