# Nexa Design System

## Foundations
- Canvas: `ivory`
- Primary text: `charcoal`
- Primary action: `nexa_purple`
- Warm accent: `nexa_orange`
- Subtle accent surface: `nexa_nude`

## Typography
- `DM Sans` for display text, page headings, section titles, and card titles
- `Inter` for body copy, labels, form fields, and UI controls

## Core Composition Rules
- Prefer white cards on ivory canvas with `shadow-soft`
- Use `rounded-2xl` for controls and buttons
- Use `rounded-3xl` for content cards and list items
- Use warm accent badges and links sparingly for emphasis and current state
- Keep public and admin components visually aligned unless behavior requires a difference

## V1 Primitives
- `Button`
- `Card` / `PanelCard` / `SubtleCard`
- `Badge`
- `Input` / `Textarea` / `Select` / `Checkbox`
- `FeedbackBanner`
- `SectionHeading`

## Adoption Rule
New shared UI patterns should be built from the design-system primitives first. Existing inline Tailwind compositions can remain temporarily, but repeated patterns should be migrated as they are touched.
