---
name: reexplain-frontend-principles
description: "Use when: designing, building, reviewing, or refactoring ReExplain frontend pages and components. Enforces the product typography roles for Clash Grotesk and Satoshi, plus supporting hierarchy and readability principles."
---

# ReExplain Frontend Principles

Use this skill for all user-facing ReExplain interface work.

## Typography Roles

- Use **Clash Grotesk** for brand text, page titles, section headings, prominent mottos, and short display labels.
- Use **Satoshi** for body copy, navigation, buttons, inputs, metadata, status messages, and other functional UI text.
- Apply `font-secondary` for Clash Grotesk. Satoshi is the global body default and normally needs no utility class.
- Keep display copy short. If text needs sustained reading, it belongs in Satoshi even when it is visually prominent.
- Use font weight and size before letter spacing to create hierarchy. Reserve widened tracking for short uppercase utility labels.

## Type Hierarchy

- Give each page one dominant heading. Do not let card or panel titles compete with it.
- Keep headings compact and intentional; use body copy to explain the product or action.
- Use sentence case for controls and supporting content.
- Never scale font size directly with viewport width. Use responsive breakpoints and stable line heights.

## Color

- Use **emerald** as ReExplain's primary accent family.
- Use `emerald-500` for primary emphasis, highlighted text, borders, and status accents.
- Use `emerald-600` for active, pressed, or intensified interaction states when additional contrast is needed.
- Do not introduce lime as a ReExplain brand accent. Prefer existing semantic design tokens for neutral surfaces, text, and standard component states.

## Interface Principles

- Make the page's primary task visually dominant in the first viewport.
- Prefer direct, active labels that describe what the user can do.
- Import product identity and shared product copy from `utils/constants.ts`. Never hard-code the app name, app description, tagline, or repeated workflow descriptions in components or metadata.
- Add a named constant when product copy is reused or represents canonical app-level language; derive copy containing the app name from `APP_NAME`.
- Keep operational surfaces restrained: clear borders, visible focus states, and limited decoration.
- Use the existing design tokens and components before introducing new patterns.
- Define component corner radii centrally through the Tailwind theme tokens in `app/globals.css`. Do not add `rounded-none` or other local non-full radius overrides; shadcn primitives inherit ReExplain's square corners from the theme. Reserve `rounded-full` for intentionally circular or pill-shaped controls.
- Never use `mt-*` or `mb-*` utilities in authored UI. Express vertical spacing with parent `gap-*` or `space-*` composition.
- Verify long text, keyboard focus, reduced motion, and mobile layouts before considering a page complete.

## Review Checklist

1. Clash Grotesk appears only in display or brand roles.
2. Satoshi carries all prose and interactive UI.
3. The main action is clear without instructional filler.
4. Text fits at mobile and desktop widths without overlap.
5. Keyboard focus and error states are visible.
6. Vertical spacing uses parent gaps instead of `mt-*` or `mb-*` utilities.
7. Brand names and canonical descriptions come from `utils/constants.ts`.
8. Brand accents use emerald, with `emerald-500` as the primary value.
9. Corner radii come from global Tailwind theme tokens, without local `rounded-none` overrides.