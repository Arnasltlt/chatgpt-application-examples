# ChatGPT Apps SDK + MCP Best Practices

> A living playbook for building and shipping ChatGPT Apps with the OpenAI Apps SDK and Model Context Protocol (MCP).

**Last Updated:** October 10, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure & Naming](#project-structure--naming)
3. [Server (MCP) Best Practices](#server-mcp-best-practices)
4. [UI (Widget) Best Practices](#ui-widget-best-practices)
5. [Asset Delivery & CORS](#asset-delivery--cors)
6. [Tunnels & Stable URLs](#tunnels--stable-urls)
7. [Build & Dev Loop](#build--dev-loop)
8. [Security & Privacy](#security--privacy)
9. [Testing in ChatGPT](#testing-in-chatgpt)
10. [Troubleshooting](#troubleshooting)
11. [Checklists](#checklists)
12. [Templates & Snippets](#templates--snippets)
13. [References](#references)

---

## Overview

This document synthesizes lessons learned from:
- Building the **Solar System** example app (Python)
- Building the **Battle Cards** comparison app from scratch
- Deep-diving the [OpenAI Apps SDK examples](https://github.com/openai/openai-apps-sdk-examples)
- Following [App Developer Guidelines](https://developers.openai.com/apps-sdk/app-developer-guidelines) and [Design Guidelines](https://developers.openai.com/apps-sdk/concepts/design-guidelines)

**When to use this doc:**
- Starting a new ChatGPT App + MCP project
- Debugging asset loading, CORS, or widget rendering issues
- Ensuring your app follows OpenAI's best practices
- Creating a pre-release checklist

**Quick Reference:**
- Official Examples: [openai-apps-sdk-examples](https://github.com/openai/openai-apps-sdk-examples)
- Developer Guidelines: [App Developer Guidelines](https://developers.openai.com/apps-sdk/app-developer-guidelines)
- Design Guidelines: [Design Guidelines](https://developers.openai.com/apps-sdk/concepts/design-guidelines)

---

## Project Structure & Naming

### Directory Layout

Mirror the structure of the official examples repository:

```
your-repo/
├── src/
│   └── your-widget/
│       ├── index.jsx          # React UI component
│       ├── Image1.png         # Static assets (imported)
│       └── Image2.png
├── your-widget_server_python/
│   ├── main.py                # MCP server
│   ├── requirements.txt       # Python dependencies
│   └── README.md
├── assets/                    # Build output (generated)
│   ├── your-widget-2d2b.css
│   ├── your-widget-2d2b.js
│   └── your-widget-2d2b.html
├── build-all.mts              # Vite build script
├── package.json
└── Best Practices.md          # This document
```

### Naming Conventions

- **Widget directory:** `src/<widget-name>/`
- **Server directory:** `<widget-name>_server_python/`
- **Asset files:** Built with hash suffix (e.g., `battle-cards-2d2b.js`)
- **HTML root div:** `<div id="<widget-name>-root"></div>`

### Adding a New Widget to the Build

In `build-all.mts`, add your widget name to the `targets` array:

```typescript
const targets: string[] = [
  "todo",
  "solar-system",
  "battle-cards",  // Your new widget
];
```

This ensures your UI component is bundled during `pnpm run build`.

---

## Server (MCP) Best Practices

### FastMCP Setup

Use FastMCP with stateless HTTP for ChatGPT integration:

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP(
    name="your-widget-python",
    sse_path="/mcp",
    message_path="/mcp/messages",
    stateless_http=True,  # Required for ChatGPT
)
```

### Tool Design

#### 1. Clear Metadata

Provide rich metadata for ChatGPT to understand your tool:

```python
def _tool_meta(widget) -> Dict[str, Any]:
    return {
        "openai/outputTemplate": widget.template_uri,
        "openai/toolInvocation/invoking": "Preparing the battle arena",
        "openai/toolInvocation/invoked": "Battle cards ready",
        "openai/widgetAccessible": True,
        "openai/resultCanProduceWidget": True,
        "annotations": {
            "destructiveHint": False,      # Does it modify external state?
            "openWorldHint": False,        # Does it access the internet?
            "readOnlyHint": True,          # Is it safe/read-only?
        },
    }
```

#### 2. Input Validation with Pydantic

Define a clear input schema with validation:

```python
from pydantic import BaseModel, Field, ConfigDict

class BattleInput(BaseModel):
    """Schema for battle comparison request."""
    
    fighter1_name: str = Field(
        ...,
        alias="fighter1Name",
        description="Name of the first fighter",
        min_length=1,
    )
    fighter2_name: str = Field(
        ...,
        alias="fighter2Name",
        description="Name of the second fighter",
        min_length=1,
    )
    
    model_config = ConfigDict(populate_by_name=True, extra="forbid")
```

#### 3. UI Handoff Metadata

When you register a React UI layer with your MCP server, give the agent a single, copy-pastable instruction block so it always returns the right widget metadata:

> After producing your normal text output, include an additional metadata block that tells ChatGPT which UI component to render. Return a tool result shaped like `{ type: "tool_result", content: [{ type: "text", text: "your message" }], _meta: { "openai.ui": "my-interface" } }`. Make sure that `"my-interface"` exactly matches the resource you registered in your MCP server with `server.resource("my-interface", { uri: "ui://my-interface", mimeType: "text/html+skybridge", content: () => fs.readFileSync("./dist/my-interface.html","utf8") })`. The HTML bundle (built from your React code) must be served over HTTPS, have no inline scripts, and be fully self-contained so ChatGPT can sandbox and render it safely. Once this is in place, the agent’s job is simply to return structured JSON plus the `_meta.openai.ui` pointer—ChatGPT handles the rest of the rendering automatically.

Drop this note alongside your server setup docs so teammates remember to pass the guidance to the agent implementation.

Use it in your tool handler:

```python
async def _call_tool_request(req: types.CallToolRequest):
    try:
        payload = BattleInput.model_validate(req.params.arguments or {})
    except ValidationError as exc:
        return types.ServerResult(
            types.CallToolResult(
                content=[types.TextContent(type="text", text=f"Validation error: {exc.errors()}")],
                isError=True,
            )
        )
    # ... handle valid input
```

#### 4. Structured Content

Return both text and structured data for the UI:

```python
structured = {
    "fighter1": {"name": "Arnoldas", "stats": {"strength": 85, "speed": 90}},
    "fighter2": {"name": "Dovydas", "stats": {"strength": 88, "speed": 87}},
    "winnerKey": "fighter1",
    "winnerName": "Arnoldas",
    "summary": "Battle complete! Arnoldas wins this round!",
}

return types.ServerResult(
    types.CallToolResult(
        content=[types.TextContent(type="text", text="Battle complete!")],
        structuredContent=structured,  # Widget reads this
        _meta=meta,
    )
)
```

### Embedding Widgets with Dynamic Data

**Do NOT** use static HTML with hard-coded widget data. Instead, embed data dynamically:

```python
def _embedded_widget_resource(widget, widget_props: Dict[str, Any]):
    """Create embedded widget resource with dynamic props."""
    html_with_props = _render_widget_html(widget, widget_props)
    
    return types.EmbeddedResource(
        type="resource",
        resource=types.TextResourceContents(
            uri=widget.template_uri,
            mimeType="text/html+skybridge",
            text=html_with_props,
            title=widget.title,
        ),
    )
```

Attach it to the tool result metadata:

```python
widget_resource = _embedded_widget_resource(WIDGET, widget_props)

meta = {
    "openai.com/widget": widget_resource.model_dump(mode="json"),
    # ... other metadata
}
```

### CORS Configuration

Enable CORS to allow ChatGPT's sandbox to access your server:

```python
from starlette.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # ChatGPT sandbox origin
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)
```

### Serving Static Assets (Optional)

If you choose to serve assets separately (not inline):

```python
from starlette.staticfiles import StaticFiles
from pathlib import Path

assets_dir = Path(__file__).parent.parent / "assets"
app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
```

**Important:** With ngrok's free tier, serving assets separately can cause issues (see [Asset Delivery & CORS](#asset-delivery--cors)).

---

## UI (Widget) Best Practices

### Use `useWidgetProps()` for Data

The Apps SDK provides `useWidgetProps()` to access data from the MCP server:

```jsx
import { useWidgetProps } from "../use-widget-props";

function App() {
  const data = useWidgetProps();
  
  if (!data) {
    return <LoadingState />;
  }
  
  // Use data.fighter1, data.fighter2, etc.
}
```

**Key points:**
- Always handle the `!data` case with a loading UI
- Data comes from `structuredContent` in the server response
- Use safe property access (`data?.property`) to avoid crashes

### Loading State Pattern

Always show a friendly loading state while waiting for server data:

```jsx
if (!data) {
  return (
    <div className="antialiased w-full text-black p-4 border border-black/10 rounded-2xl bg-white">
      <div className="flex flex-col items-center justify-center gap-2 py-6">
        <Zap className="h-6 w-6 text-orange-500" strokeWidth={2} />
        <h2 className="text-lg font-semibold">Get ready to fight!</h2>
        <p className="text-sm text-black/60">Preparing battle data…</p>
      </div>
    </div>
  );
}
```

### Safe Property Access

Always use optional chaining and provide fallbacks:

```jsx
function normalizeFighter(raw) {
  if (!raw) return null;
  if (typeof raw === "string") {
    return { name: raw, stats: { strength: 80, speed: 80, intelligence: 80 } };
  }
  
  return {
    name: raw.name ?? "Unknown",
    stats: raw.stats ?? { strength: 80, speed: 80, intelligence: 80 },
  };
}
```

### Importing Assets

Import images directly so they're bundled by Vite:

```jsx
import arnoldasImg from "./Arnoldas.png";
import dovydasImg from "./Dovydas.png";

const getFighterImage = (name) => {
  const normalized = name.toLowerCase();
  if (normalized === "arnoldas") return arnoldasImg;
  if (normalized === "dovydas") return dovydasImg;
  return null;
};
```

**Why?** Images imported this way are:
- Bundled into the JS as data URIs (for small images) or hashed assets
- Available without external HTTP requests
- Not subject to CORS issues

### Accessibility & Design

Follow [OpenAI Design Guidelines](https://developers.openai.com/apps-sdk/concepts/design-guidelines):

- Use semantic HTML (`<h2>`, `<p>`, etc.)
- Provide `alt` text for images
- Use appropriate color contrast
- Support both light/dark themes if applicable
- Ensure keyboard navigation works
- Use `aria-*` attributes where needed

---

## Asset Delivery & CORS

**This was the biggest pain point during development.** Here's what we learned:

### The Problem

ChatGPT renders widgets in a sandboxed iframe (`https://web-sandbox.oaiusercontent.com`). When your widget tries to load CSS/JS from an external URL:

1. **CORS errors** if the server doesn't allow cross-origin requests
2. **404 errors** if ngrok's free tier shows a browser warning page
3. **Changing URLs** if you restart ngrok without a persistent subdomain

### Solution 1: Inline Assets (Recommended)

**Embed CSS and JS directly into the HTML** returned by your MCP server:

```python
def _render_widget_html(widget, widget_props: Dict[str, Any]) -> str:
    from pathlib import Path
    
    assets_dir = Path(__file__).parent.parent / "assets"
    css_path = assets_dir / f"{widget.identifier}-2d2b.css"
    js_path = assets_dir / f"{widget.identifier}-2d2b.js"
    
    css = css_path.read_text(encoding="utf-8") if css_path.exists() else ""
    js = js_path.read_text(encoding="utf-8") if js_path.exists() else ""
    
    return f"""
<div id="{widget.identifier}-root"></div>
<style>{css}</style>
<script type="module">{js}</script>
"""
```

**Pros:**
- No external asset requests → no CORS issues
- No ngrok URL changes → stable deployments
- Single HTTP response with everything bundled

**Cons:**
- Larger HTML payload (usually fine for small widgets)
- No browser caching of assets across invocations

### Solution 2: Same-Origin Assets

Serve assets from the **same server** as your MCP endpoint:

```python
# In main.py
assets_dir = Path(__file__).parent.parent / "assets"
app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
```

Reference them with **relative paths**:

```python
html = f"""
<div id="battle-cards-root"></div>
<link rel="stylesheet" href="/assets/battle-cards-2d2b.css">
<script type="module" src="/assets/battle-cards-2d2b.js"></script>
"""
```

**Pros:**
- Browser can cache assets
- Same origin → no CORS complexity

**Cons:**
- Still requires stable ngrok URL (or paid ngrok plan)
- ngrok free tier browser warning can block asset loading

### Solution 3: CDN (Production Only)

For production, host assets on a CDN (e.g., Cloudflare, Vercel):

```python
html = f"""
<div id="battle-cards-root"></div>
<link rel="stylesheet" href="https://cdn.example.com/battle-cards-2d2b.css">
<script type="module" src="https://cdn.example.com/battle-cards-2d2b.js"></script>
"""
```

**Pros:**
- Fast, globally distributed
- Stable URLs
- Browser caching

**Cons:**
- Requires separate deployment step
- More complex setup

### Avoid Hard-Coded Localhost URLs

**Never** use `http://localhost:4444` in production HTML. ChatGPT's cloud-based sandbox cannot reach your local machine.

---

## Tunnels & Stable URLs

### ngrok Setup

1. **Install ngrok:**
   ```bash
   brew install ngrok/ngrok/ngrok
   ```

2. **Authenticate** (get authtoken from [ngrok dashboard](https://dashboard.ngrok.com)):
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN
   ```

3. **Start tunnel:**
   ```bash
   ngrok http 8001 --log stdout
   ```

4. **Note the public URL:**
   ```
   https://d9b40f766251.ngrok-free.app
   ```

### Stable URL Strategy

**Problem:** ngrok free tier changes URLs on every restart.

**Solutions:**

1. **Keep tunnel running:** Don't restart ngrok unnecessarily during development.
2. **Paid ngrok plan:** Get a persistent subdomain (e.g., `your-app.ngrok-free.app`).
3. **Alternative tunnels:** Cloudflare Tunnel, fly.io, Railway (all offer stable URLs).
4. **Inline assets:** Avoids URL changes affecting widget rendering (see above).

### Config File (Optional)

Create `~/.config/ngrok/ngrok.yml`:

```yaml
version: 2
authtoken: YOUR_AUTHTOKEN
tunnels:
  mcp:
    proto: http
    addr: 8001
```

Start with:
```bash
ngrok start --all
```

### Connector Update Policy

When you **must** change the MCP URL:
1. Update ChatGPT connector settings
2. Test with a simple prompt
3. Confirm widget renders correctly
4. Document the new URL in your README

**Minimize URL changes** to avoid reconfiguring connectors repeatedly.

---

## Build & Dev Loop

### Initial Setup

```bash
# 1. Clone the examples repo (or start fresh)
git clone https://github.com/openai/openai-apps-sdk-examples.git
cd openai-apps-sdk-examples

# 2. Install Node dependencies
pnpm install

# 3. Set up Python environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# 4. Install Python dependencies for your server
cd your-widget_server_python
pip install -r requirements.txt
cd ..
```

### Building UI Components

```bash
# Build all widgets (defined in build-all.mts targets)
pnpm run build

# Output: assets/your-widget-2d2b.{css,js,html}
```

**Note:** The hash (`2d2b`) is based on `package.json` version.

### Development Workflow

**Terminal 1: UI hot reload (optional)**
```bash
pnpm run dev
# Vite dev server on http://localhost:4444
# Hot-reloads on file changes
```

**Terminal 2: MCP server**
```bash
source .venv/bin/activate
cd your-widget_server_python
uvicorn main:app --port 8001 --reload
```

**Terminal 3: ngrok tunnel**
```bash
ngrok http 8001 --log stdout
```

### Full Build & Deploy Cycle

```bash
# 1. Make UI changes in src/your-widget/index.jsx
# 2. Build assets
pnpm run build

# 3. Update server if needed (main.py)
# 4. Restart server
# (If using --reload, it auto-restarts)

# 5. Test in ChatGPT
# Use connector with ngrok URL
```

---

## Security & Privacy

Follow [OpenAI App Developer Guidelines](https://developers.openai.com/apps-sdk/app-developer-guidelines):

### 1. Purpose & Transparency

- Tools should have a **clear, singular purpose**
- Describe what the tool does in the `description` field
- Use accurate `title` and `name` fields

### 2. Data Minimization

- Only request data you **actually need**
- Don't store user data unless necessary
- Mark tools as `readOnlyHint: true` if they don't modify state

### 3. Destructive vs. Read-Only

Set annotations correctly:

```python
"annotations": {
    "destructiveHint": False,      # True if tool modifies external state
    "openWorldHint": False,        # True if tool accesses the internet
    "readOnlyHint": True,          # True if tool is safe/read-only
}
```

### 4. Error Handling

Don't leak sensitive information in error messages:

```python
except Exception as exc:
    return types.ServerResult(
        types.CallToolResult(
            content=[types.TextContent(type="text", text="An error occurred. Please try again.")],
            isError=True,
        )
    )
```

### 5. CORS Security

Use specific origins in production:

```python
# Development
allow_origins=["*"]

# Production
allow_origins=["https://chatgpt.com", "https://web-sandbox.oaiusercontent.com"]
```

---

## Testing in ChatGPT

### 1. Set Up Connector

1. Open ChatGPT → **Settings** → **Personalization** → **Apps**
2. Click **Add App**
3. Enter connector details:
   - **Name:** Your Widget Name
   - **Description:** What it does
   - **MCP URL:** `https://YOUR_NGROK_URL.ngrok-free.app/mcp`
4. Save

### 2. Smoke Test Prompts

Test your tool with simple prompts:

**Example (Battle Cards):**
```
Compare Arnoldas vs Dovydas
```

**Expected behavior:**
1. ChatGPT calls `compare-fighters` tool
2. Server returns structured data + widget HTML
3. Widget renders with cards, stats, and winner highlight
4. Text response matches the UI

### 3. Verify Widget Rendering

Check browser console (F12) for:
- ✅ No 404 errors for assets
- ✅ No CORS errors
- ✅ `useWidgetProps()` returns data
- ✅ Loading state appears briefly, then transitions to content

### 4. Edge Cases to Test

- Empty/invalid input (e.g., blank names)
- Special characters in input
- Very long names
- Rapid repeated calls
- Different user agents/browsers

---

## Troubleshooting

### Common Errors

| Symptom | Cause | Fix |
|---------|-------|-----|
| **404 on `/assets/widget.js`** | Asset path mismatch or ngrok tunnel not serving assets | Use inline assets or verify `/assets` mount + CORS |
| **CORS error on asset load** | ChatGPT sandbox blocked by CORS policy | Add `CORSMiddleware` with `allow_origins=["*"]` |
| **Widget shows loading forever** | `useWidgetProps()` returns `null` or `undefined` | Check `structuredContent` in server response |
| **`Cannot read properties of undefined`** | UI accessing props before data loads | Add `if (!data) return <Loading />` guard |
| **ngrok browser warning blocks assets** | ngrok free tier shows interstitial page | Inline assets or upgrade to paid ngrok |
| **MCP URL changed, connector broken** | Restarted ngrok without persistent subdomain | Update connector URL or use stable tunnel |
| **JSON validation error** | Input doesn't match Pydantic schema | Check `alias` fields and required params |
| **`message` variable not found (Python)** | Variable used before assignment | Define variable before referencing it |
| **Images not loading** | Images not imported or CORS blocking external URLs | Import images in JSX (`import img from "./Image.png"`) |

### Debugging Widget Rendering

1. **Check server logs:** Look for validation errors or exceptions
2. **Check browser console:** Look for JS errors, 404s, CORS
3. **Inspect network tab:** Verify asset requests succeed (200 OK)
4. **Add console.log in widget:**
   ```jsx
   const data = useWidgetProps();
   console.log("Widget data:", data);
   ```
5. **Verify HTML structure:** Inspect the iframe in browser DevTools

### ngrok Troubleshooting

**Tunnel not starting:**
```bash
# Check if port is already in use
lsof -i :8001
# Kill process if needed
kill -9 <PID>
```

**Authentication failed:**
```bash
# Reconfigure authtoken
ngrok config add-authtoken YOUR_AUTHTOKEN
```

**Rate limiting:**
- ngrok free tier has connection limits
- Consider paid plan or alternative tunnel

---

## Checklists

### Pre-Commit Checklist

- [ ] Widget has clear `title` and `description`
- [ ] Input schema is validated with Pydantic
- [ ] Metadata includes `readOnlyHint`, `destructiveHint`, `openWorldHint`
- [ ] UI handles loading state (`!data` case)
- [ ] Safe property access with optional chaining (`data?.prop`)
- [ ] Assets are inlined or served same-origin with CORS enabled
- [ ] No hard-coded `localhost` URLs in production code
- [ ] Error messages don't leak sensitive data
- [ ] Accessibility: semantic HTML, alt text, color contrast
- [ ] Tested with sample prompts

### Pre-Release Checklist

- [ ] Stable tunnel URL configured (ngrok paid or alternative)
- [ ] Connector URL updated and tested in ChatGPT
- [ ] Smoke tests pass (see [Testing](#testing-in-chatgpt))
- [ ] Browser console shows no errors (404, CORS, JS errors)
- [ ] Widget renders correctly on first load
- [ ] Loading state transitions smoothly to content
- [ ] Multiple consecutive calls work without issues
- [ ] README includes setup instructions
- [ ] Code follows [OpenAI guidelines](https://developers.openai.com/apps-sdk/app-developer-guidelines)
- [ ] Security annotations are accurate

---

## Templates & Snippets

### Minimal FastMCP Server

```python
"""Your Widget MCP server - Brief description."""

from typing import Any, Dict, List
import mcp.types as types
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field

MIME_TYPE = "text/html+skybridge"

class YourInput(BaseModel):
    """Input schema."""
    param: str = Field(..., description="Description of param")

mcp = FastMCP(
    name="your-widget-python",
    sse_path="/mcp",
    message_path="/mcp/messages",
    stateless_http=True,
)

@mcp._mcp_server.list_tools()
async def _list_tools() -> List[types.Tool]:
    return [
        types.Tool(
            name="your-tool",
            title="Your Tool Title",
            description="What your tool does",
            inputSchema=YourInput.model_json_schema(),
        )
    ]

async def _call_tool_request(req: types.CallToolRequest):
    payload = YourInput.model_validate(req.params.arguments or {})
    
    # Your logic here
    result = f"Processed: {payload.param}"
    
    return types.ServerResult(
        types.CallToolResult(
            content=[types.TextContent(type="text", text=result)],
        )
    )

mcp._mcp_server.request_handlers[types.CallToolRequest] = _call_tool_request
app = mcp.streamable_http_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
```

### Widget Boilerplate with Loading State

```jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { useWidgetProps } from "../use-widget-props";

function App() {
  const data = useWidgetProps();
  
  if (!data) {
    return (
      <div className="p-4 border rounded-2xl bg-white">
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 border rounded-2xl bg-white">
      <h2 className="text-xl font-bold">{data.title}</h2>
      <p>{data.description}</p>
    </div>
  );
}

createRoot(document.getElementById("your-widget-root")).render(<App />);
```

### ngrok Config Template

`~/.config/ngrok/ngrok.yml`:

```yaml
version: 2
authtoken: YOUR_AUTHTOKEN_HERE
region: us
tunnels:
  mcp:
    proto: http
    addr: 8001
    inspect: true
```

Start with:
```bash
ngrok start mcp
```

---

## References

### Official Documentation

- [OpenAI Apps SDK Examples](https://github.com/openai/openai-apps-sdk-examples)
- [App Developer Guidelines](https://developers.openai.com/apps-sdk/app-developer-guidelines)
- [Design Guidelines](https://developers.openai.com/apps-sdk/concepts/design-guidelines)
- [Model Context Protocol (MCP) Spec](https://spec.modelcontextprotocol.io/)

### Tools & Libraries

- [FastMCP](https://github.com/jlowin/fastmcp) - Python MCP server framework
- [Vite](https://vitejs.dev/) - Frontend build tool
- [pnpm](https://pnpm.io/) - Fast, disk space efficient package manager
- [ngrok](https://ngrok.com/) - Secure tunnels to localhost
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

### Alternative Tunnels (ngrok alternatives)

- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) - Free, stable URLs
- [fly.io](https://fly.io/) - Deploy apps globally
- [Railway](https://railway.app/) - Simple infrastructure

---

## Open Questions / Future Additions

- Hosting alternatives to ngrok (Cloudflare Tunnel, fly.io)
- CI for lint/build checks before commits
- Packaging servers as containers for stability
- Multi-language server examples (Node.js, Go)
- Advanced widget patterns (forms, interactive charts)
- Performance optimization for large data sets
- WebSocket support for real-time updates

---

**Contributions welcome!** Update this document as you learn new patterns or encounter new issues.


