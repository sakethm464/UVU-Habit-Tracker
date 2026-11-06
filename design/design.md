# UVU — Design Reference

The sample screens in `uvu-sample-screens.html` are **visual reference, not spec**. Match the look, spacing, and type — exact HTML/CSS isn't prescriptive. Anywhere the mocks disagree with this file, this file wins.

## Scope

**Light mode and dark mode apply to the entire app** — onboarding, auth, and all signed-in screens. The user's system preference is the default; a manual toggle lives in Settings.

## Navigation

Sidebar order (both themes):

1. Today
2. Manage Habits
3. Timeline
4. Settings

## Typography

**Font:** SF Pro (SF Pro Display for headings, SF Pro Text for body). Stack:

```
-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif
```

**Weights:** 500 body, 600 UI labels, 700 headings, 800 display/numerals.

## Color palette

Gold is the only accent in both themes. Semantic habit colors (teal, coral, lilac, green, amber, pink) are shared.

### Dark mode

| Role | Hex |
|---|---|
| Background base | `#0A0908` |
| Background tint (gradient end) | `#140F08` |
| Surface | `#141211` |
| Surface raised | `#1E1A14` |
| Border | `#2A2520` |
| Border subtle | `#1E1A14` |
| Text primary | `#F5F1E8` |
| Text secondary | `#8E8578` |
| Text muted | `#6B6354` |
| Gold (gradient start) | `#F5D76E` |
| Gold (gradient end) | `#D4A94A` |
| Gold deep | `#A6822C` |

Primary gradient: `linear-gradient(135deg, #F5D76E 0%, #D4A94A 100%)` on `#0A0908`.

### Light mode

| Role | Hex |
|---|---|
| Background base | `#FFFEF9` |
| Background tint (gradient end) | `#FDF8EC` |
| Surface | `#FFFFFF` |
| Surface raised | `#FBF8EF` |
| Border | `#E8DFC5` |
| Border subtle | `#EFE6CD` |
| Text primary | `#1A1612` |
| Text secondary | `#6B6354` |
| Text muted | `#9C9079` |
| Gold (gradient start) | `#D4A94A` |
| Gold (gradient end) | `#A6822C` |
| Gold text (on light) | `#8A6A1F` |

Primary gradient on light: `linear-gradient(135deg, #D4A94A 0%, #A6822C 100%)` with white text — the pale `#F5D76E` loses contrast on an ivory ground.

### Habit accent colors (shared)

| Name | Dark hex | Light hex (darker for contrast) |
|---|---|---|
| Teal | `#4FB0A5` | `#3A8780` |
| Coral | `#E87461` | `#C14F3C` |
| Lilac | `#9E85D1` | `#6A52A3` |
| Green | `#7BC48B` | `#4D9460` |
| Amber | `#E8A94A` | `#A6822C` |
| Pink | `#D96B8E` | `#B04972` |
| Blue | `#6B8CDE` | `#4A6BC0` |

Habit cards tint the surface at ~10% of the accent and stroke at ~25%.

## Radii & spacing

- Radius: 10 (controls), 12 (inputs/buttons), 16 (cards), 20 (large surfaces), 24 (modals), 999px (chips).
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 48.
