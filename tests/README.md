# Theme Builder Tests

Start the local server from `app/` on port 8080, then run:

```powershell
py tests/theme-builder-smoke.py
```

The smoke test uses an isolated Edge profile and verifies registry rendering, page migration, insertion, undo, security allowlists, validation, publication and the public lead flow. Set `FIBRA_TEST_URL` to test another local origin.
