# Repository Guidelines

## Project Structure & Module Organization

This is a static resume and interview-prep workspace. The root viewer uses `index.html`, `script.js`, and `styles.css` to render Markdown via `fetch()`. Resume variants live in `resumes/`, source material in `profile/`, interview notes in `wiki/`, company information resources in `resources/`, and assets in `assets/`. `demo/flighthub-lite/` is a standalone Three.js prototype. Guidance under `.agents/skills/` is skill-specific, not repo-wide policy.

`resources/` stores company/job-market information resources for reference and research only. Do not use files in `resources/` as source material when generating or customizing resumes unless the user explicitly asks for it.

`demo/` contains standalone prototype projects built to validate skills for specific job descriptions (JDs). These are interview demonstration projects, not production work. Do not use files in `demo/` as source material when generating or customizing resumes unless the user explicitly asks for it.

## Build, Test, and Development Commands

There is no package manager, build step, lint config, or automated test runner.

```bash
python3 -m http.server 8000
```

Run this from the repository root. Open `http://localhost:8000/` for the resume viewer and `http://localhost:8000/demo/flighthub-lite/` for the demo. Use HTTP preview because Markdown files are loaded with `fetch()`.

## Architecture & Routing Notes

`script.js` maps short `f` query parameters to Markdown files: `intro` -> `resumes/Introduction.md`, `sfe` -> `resumes/senior-frontend-engineer.md`, and `wiki_dj` -> `wiki/dj.md`. `intro` is the default; unknown keys fall back to it. The viewer uses CDN-loaded `marked` when available and a local fallback otherwise. Add new renderable Markdown files to `FILE_MAP`.

`demo/flighthub-lite/index.html` loads Three.js through a browser import map and runs `app.js` as an ES module. `app.js` owns scene setup, simulated telemetry, route/trail rendering, animation, `Raycaster` selection, controls, metrics, and fleet/detail updates.

## Coding Style & Naming Conventions

Use plain HTML, CSS, and modern JavaScript. Follow the existing style: `const`/`let`, small named functions, two-space HTML indentation, and readable object literals. Keep Markdown names descriptive and lowercase, for example `resumes/frontend-lead.md`.

## Testing Guidelines

Validate manually after starting the local server. Check the default route, new `?f=` routes, table-of-contents behavior, responsive layout, and console errors. For the demo, verify scene rendering, animation, drone selection, and panel updates.

## Commit & Pull Request Guidelines

Recent commits use short imperative messages, often with prefixes such as `feat:` and `deploy:`. Prefer `feat: add frontend lead resume` or `fix: correct markdown routing`. Pull requests should describe changed files, user-visible impact, related issues or interview targets, and screenshots for UI changes.

## Agent-Specific Instructions

Treat FlightHub Lite as an interview prototype for 3D rendering, realtime trajectories, picking/selection, state aggregation, and frontend performance. Do not describe it as a production Cesium/GIS project. For production direction, frame Cesium as likely for geospatial data, imagery, terrain, and 3D Tiles; Three.js validates rendering and interaction patterns here.

## Security & Configuration Tips

Do not commit local credentials or machine-specific config. Keep `.claude/settings.local.json` local-only. Document intentional changes to external scripts such as the `marked` CDN dependency.
