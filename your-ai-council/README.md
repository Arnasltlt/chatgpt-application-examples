# Your AI Council

Simple hello-world ChatGPT app showcasing the repository structure.

## Structure

```
your-ai-council/
├── assets/                     # Generated Vite build output
├── package.json                # Widget dependencies and scripts
├── src/your-ai-council/
│   ├── index.css
│   ├── index.jsx
│   ├── main.jsx
│   └── widget.js
├── tsconfig.json
├── vite.config.mts             # Vite configuration scoped to this widget
└── your-ai-council_server_python/
    ├── main.py                 # FastMCP server
    └── requirements.txt        # Python dependencies
```

## Setup

### UI

```bash
pnpm install --filter your-ai-council
pnpm run build --filter your-ai-council
```

### MCP Server

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r your-ai-council_server_python/requirements.txt
uvicorn your-ai-council_server_python.main:app --port 8001 --reload
```

### Widget Rendering in ChatGPT

1. Start an ngrok tunnel: `ngrok http 8001`
2. Add the connector in ChatGPT with the ngrok URL and `/mcp`
3. Invoke the tool with: “Say hello with the Your AI Council app.”

### Key Learnings

**Start Simple - Text First, Widgets Later**
- For hello-world examples, implement text-only tool responses first
- Widgets require deep ChatGPT backend integration (`/backend-api/ecosystem/widget`)
- Text responses are reliable and sufficient for learning MCP basics

**Architecture That Works**
- FastMCP + FastAPI with CORS middleware handles stateless HTTP perfectly
- Pydantic input schemas provide clean validation
- Logging at key points (`CallToolRequest`, `ReadResourceRequest`) is essential
- ngrok tunneling works reliably for local development

**Future Widget Work**
- Widget assets are built and ready in `assets/` for future exploration
- Full HTML document structure is required (not fragments)
- Inline CSS/JS embedding pattern is implemented and ready

