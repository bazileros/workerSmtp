# @workerSmtp/ui

Shared UI component library built on [shadcn/ui](https://ui.shadcn.com) with [Base UI](https://base-ui.com) primitives and Tailwind CSS v4.

## Components

| Component | Source | Description |
|---|---|---|
| `button` | Base UI | Variants: default, outline, secondary, ghost, destructive |
| `card` | HTML | Container with header, content, footer |
| `input` | Base UI | Text input with validation states |
| `textarea` | HTML | Resizable text area |
| `password-input` | Custom | Input with visibility toggle |
| `select` | Base UI | Dropdown select with popup |
| `checkbox` | Base UI | Checkbox with indicator |
| `radio-group` | Custom | Toggle button group |
| `badge` | Custom | Status badges (success, error, warning, etc.) |
| `table` | HTML | Responsive data table |
| `alert` | Custom | Contextual alert banners |
| `sidebar` | Custom | Collapsible sidebar with navigation |
| `dropdown-menu` | Base UI | Context menus with submenus |
| `separator` | Base UI | Horizontal/vertical divider |
| `skeleton` | CSS | Loading placeholders |
| `empty` | Custom | Empty state display |
| `sonner` | sonner | Toast notifications |

## Design Tokens

Defined in `globals.css` using CSS custom properties with Catppuccin-inspired colors. Supports light and dark mode via the `.dark` class.

## Usage

```tsx
import { Button } from "@workerSmtp/ui/components/button";
import { Card } from "@workerSmtp/ui/components/card";
```
