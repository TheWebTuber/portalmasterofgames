# Local API Hub migration — 16 November 2026

No commit, push, publication or deployment was performed.

## Integration

- Feed: https://api.creatorpromote.com/data/portalmasterofgames.json
- Pinned verified channel: UCdOJvhjojFe3Z0yKeGEIERA
- Local js/creatorpromote-hub.js is an unchanged copy of the Hub client (SHA-256 1b3910649a46ebaffec5025e2e01b0264020a061e1630d096ac2a9d254bbe434).
- js/hub-feed.mjs checks identity before caching and on cached reads, manages page lifecycle, and retains fallback notices after a failed manual refresh.
- No runtime package dependency, browser API key or browser YouTube Data API request remains in this migration.
- Successful snapshots persist in memory/localStorage; bad responses cannot replace them. If storage is blocked, memory still works. Old browser-API cache formats are not imported because their live observations were not independently timestamped.
- LIVE expires after at most 45 minutes and is reevaluated while the page remains open. Unknown does not mean offline. The Hub scans recent public uploads; it cannot prove that no broadcast exists outside its scan.

## Features preserved

Subscriber/view/video counters, number animations, clock and original milestone thresholds. Existing live-ui.js continues to mirror the data. No live observation is presented as a proven offline state.

## Verification

Run from this directory: node --test tests/*.test.mjs (8 passing tests). All JavaScript syntax checks passed.
tests/fixtures/proposed.json contains explicitly synthetic data for the verified channel ID. It is not a real channel snapshot and is never loaded by the website.

The actual page scripts were exercised with a DOM implementation against normal, empty, offline and wrong-channel fixtures. API requests were recorded and constrained to the expected Hub endpoint. Manual refresh/fallback, LIVE expiry, applicable menus and page-specific interactions passed. These checks do not use a rendering engine and cannot certify responsive appearance or animation smoothness. Browser process launches failed; the computer-use tool then stopped because it could not determine the browser URL. No further UI automation was attempted.

## Deployment gate

The published feed returned HTTP 404. The local migration is prepared and fixture-tested but MUST NOT be deployed until the verified channel is separately approved, enabled and published by the Hub, then tested with real data. The Hub entry remains disabled.

