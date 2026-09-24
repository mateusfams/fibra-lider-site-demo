# Theme Builder Tests

Start the local server from `app/` on port 8080, then run:

```powershell
py tests/theme-builder-smoke.py
py tests/theme-builder-parity.py
```

The smoke test uses an isolated Edge profile and verifies registry rendering, page migration, insertion, undo, live preview, computed alignment, security allowlists, validation, publication, dark mode, coupons, the manual WhatsApp campaign audience, mobile navigation and the public lead flow.

The parity test captures the complete canonical and published Home on desktop and mobile, compares section order and dimensions, and verifies stale draft/release migration. Set `FIBRA_TEST_URL` to test another local origin.
