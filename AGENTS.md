<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Athopia Web Agent Guide

Read `CLAUDE.md` before changing product behavior.

## Role

`athopia-web` is the public product and UX reference for Athopia.

## Data Rules

- Do not call Sportmonks directly.
- Consume normalized data through Supabase/API contracts.
- `athopia-os` owns ingestion and sync.
- xG/pressure may be shown only when real synced values exist.
- Hide missing expected-data fields instead of showing placeholder zeroes.

## gstack

- Product/design changes: `/plan-design-review`.
- Data-heavy UI: `/investigate` first, then `/review`.
- Visible stats or match pages: `/qa` before shipping.
