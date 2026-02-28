---
description: Default conventions when building any website or web app for Choco Li
---

# Web Project Defaults

Apply these rules automatically on every web project:

## 1. Copyright Footer
- Add `© Choco Li {year}` to the bottom of every page.
- Style: `text-xs text-slate-400`, centered, with top margin.

## 2. Soft Delete
- Never hard-delete records from the database.
- Use a `deleted: true` flag on the document instead.
- Provide a "Show Deleted" toggle and a "Restore" action in the UI.

## 3. Theme Selection
- Before building, offer at least 3 style/colour theme options and let the user choose.
- Examples: dark mode, light mode, pastel, vibrant, glassmorphism, etc.
- Apply the chosen theme consistently across all pages.

## 4. Remind and guide me to write tests first.