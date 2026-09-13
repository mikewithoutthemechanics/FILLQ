# Palette's Journal

## 2026-09-13 - Dashboard Refresh Async Feedback & Accessibility
**Learning:** Interactive action buttons with async data fetching can leave users uncertain if data is actively loading or frozen if loading visual states and disabled interaction are omitted.
**Action:** Always provide loading feedback (e.g. icon rotation/spinner, dynamic label text, disabled attribute) and accessible ARIA attributes (`aria-label`) on manual refresh buttons.
