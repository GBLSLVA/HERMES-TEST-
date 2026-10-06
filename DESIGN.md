# ZEUS AGENT — Design system

This file records the visual rules for the ZEUS AGENT console so future UI work stays consistent.

## Design intent

Calm, operational, and trustworthy. The interface should help people act quickly without making every surface compete for attention.

## Color

- App background: `#f6f7f9`
- Surface: `#ffffff`
- Primary text: `#1f2937`
- Strong text: `#111827`
- Muted text: `#667085`
- Border: `#dfe4ea`
- Accent: `#3158d4`
- Accent hover: `#284ab4`
- Accent soft: `#eef2ff`
- Sidebar: `#182230`
- Success: `#177a52`
- Warning: `#9a5b1f`
- Danger: `#b54755`

Use solid colors. Do not introduce decorative gradients, glow effects, or gradient text.

## Typography

Use the native system stack:

`"Segoe UI Variable", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif`

Scale:
- Page title: 28–36px / strong
- Section title: 16–18px / strong
- Body: 14–15px
- UI control: 13–14px
- Metadata: 11–12px

Do not use interface text below 11px. Use sentence case except for the ZEUS AGENT wordmark.

## Spacing

Base scale: 4, 8, 12, 16, 24, 32, 48px.

Keep related items close. Use larger separation between independent groups instead of identical gaps everywhere.

## Shape

- Small radius: 6px
- Control radius: 8px
- Surface radius: 12px

Use borders to define normal surfaces. Avoid combining a hairline border with a large soft shadow.

## Surfaces

Prefer one clear surface per task. Avoid cards nested inside cards.

Dashboard metrics may share one divided summary surface instead of four identical cards.

## Actions

- Primary button: one dominant action in a region.
- Secondary button: lower-priority action.
- Text button: navigation or tertiary action.
- Disabled controls must explain why the action is unavailable when context is needed.
- Minimum interactive target: about 40px tall.

## Status

Status colors communicate state, not decoration:
- ZEUS AGENT: accent soft
- Human takeover: warning
- Success/connected: success
- Failure/offline: danger

Do not rely on color alone; always include a text label.

## Inbox

The conversation list, conversation history, and human-control action are the core operational hierarchy.

- Search has a visible label.
- Active filters have text and count.
- Selected conversation uses a quiet background change, not an ornamental stripe.
- “Assumir conversa” is primary when ZEUS AGENT controls the thread.
- “Devolver ao ZEUS AGENT” becomes secondary when a human controls it.
- The unavailable manual-send state is explained as text rather than shown as a fake composer.

## Accessibility

- Keep visible keyboard focus.
- Preserve text contrast.
- Support narrow layouts without horizontal page overflow.
- Respect `prefers-reduced-motion`.
- Use explicit labels for search fields and status messages.
