## Overhaul the Jobs Page

Fix all 5 priority issues from the impeccable audit:

### Issues to fix:
1. **P0: Error messages silently truncated** — ✅ DONE — `.job-error` now uses `-webkit-line-clamp: 2` with `attr(title)` tooltip for full error text on hover
2. **P0: No search or filter** — ✅ DONE — Search input filters by filename; status filter pills (All / Queued / Processing / Completed / Failed) with counts
3. **P1: Dense meta information** — ✅ DONE — Cleaned up meta line with `·` separators, added `meta-divider` class, grouped related data, added `formatDuration()` helper
4. **P1: No bulk actions** — ✅ DONE — Checkbox on each card, select-all with indeterminate state, bulk delete bar, clear selection button
5. **P2: Status badges lack icons** — ✅ DONE — Clock (queued), spinner (processing), check (completed), X (failed) via inline SVG with `innerHTML`

### Files modified:
- `web/src/app/pages/jobs-page/jobs-page.ts` — Search/filter state, bulk selection, helper methods, status icons, duration formatter
- `web/src/app/pages/jobs-page/jobs-page.html` — Search bar, status pills, checkboxes, bulk delete bar, improved card layout, error tooltips
- `web/src/app/pages/jobs-page/jobs-page.scss` — All new element styles, error text clamp, responsive improvements

### Constraints:
- ✅ Follow DESIGN.md (dark theme, purple accent, mono for data)
- ✅ No box-shadows (tonal layering only)
- ✅ No pure white (#fff), no gradients
- ✅ Existing card structure and responsive behavior preserved
- ✅ `Math` property exposure removed (replaced with `formatDuration()` helper)
- ✅ Dead `formatSize()` code removed

### Implementation order:
1. ✅ Update the TS
2. ✅ Update the HTML
3. ✅ Update the SCSS

### Commits:
- `b623f31` feat(jobs): complete overhaul — search, filters, bulk delete, status icons
- `3fd464a` fix(api): add 10s timeout to listJobs to prevent stuck loading state

**Status: COMPLETE** — All 5 issues fixed, 0 diagnostics, pushed to `frontend-angular`.
