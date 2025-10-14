# Repository Guidelines

## Project Structure & Module Organization
Each example app lives in its own root-level directory, for example `solar-system/`. Inside, place UI code under `src/<app-name>/` (entry point `index.jsx`), the MCP server in `<app-name>_server_python/`, and generated bundles under `assets/`. When you add a new widget, mirror this layout, document the setup in that app’s README, and append the widget name to `targets` inside `build-all.mts` so the shared build script picks it up.

## Build, Test, and Development Commands
- `pnpm install --filter <app-name>` installs UI dependencies for a specific widget.
- `pnpm run dev --filter <app-name>` launches the Vite dev server and hot reloads components in `src/<app-name>/`.
- `pnpm run build --filter <app-name>` emits hashed assets to `assets/`; commit only the files referenced in the widget manifest.
- `python -m venv .venv && source .venv/bin/activate` creates an isolated environment for the MCP server.
- `pip install -r <app-name>_server_python/requirements.txt` synchronises server dependencies.
- `fastmcp run <app-name>_server_python/main.py` starts the stateless HTTP server expected by ChatGPT Apps.

## Coding Style & Naming Conventions
Use functional React components with PascalCase filenames and keep JSX/TSX indented with two spaces (respect Prettier defaults if configured). Python modules follow PEP 8 (four-space indents, snake_case functions) and should include type hints plus Pydantic models for request payloads. Name new widgets, asset files, and DOM roots consistently (`<app-name>-root`) so hashed build outputs remain traceable.

## Testing Guidelines
Add Vitest suites near UI code (`src/<app-name>/__tests__/`) and run them with `pnpm run test --filter <app-name>`. For MCP servers, prefer `pytest` modules inside `<app-name>_server_python/tests/` and execute `pytest`. Always sideload the widget in ChatGPT after a build to confirm the assets load, tools register, and metadata behaves as documented in `Best Practices.md`.

## Commit & Pull Request Guidelines
Write short, imperative commit messages (e.g., “Add battle cards widget”), matching the concise history already in `git log`. Each pull request should summarise changes, list validation steps (tests, ChatGPT sideload run), link related issues, and include screenshots or screen recordings of the widget where visual changes occur.

## Security & Configuration Tips
Store secrets in environment files ignored by Git and document required variables in the widget README. Follow the CORS, tunneling, and privacy checklists in `Best Practices.md` before shipping a new example, and verify that generated assets exclude sensitive data.
