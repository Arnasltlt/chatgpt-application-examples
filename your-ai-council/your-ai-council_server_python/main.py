"""Your AI Council MCP server."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List

import mcp.types as types
import orjson
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field, ValidationError

ASSETS_DIR = Path(__file__).parent.parent / "assets"
WIDGET_IDENTIFIER = "your-ai-council"
HTML_ROOT_ID = f"{WIDGET_IDENTIFIER}-root"
MIME_TYPE = "text/html+skybridge"


class GreetingInput(BaseModel):
  """Input schema for the hello world greeting."""

  greeting: str = Field(
    default="Hello from Your AI Council!",
    description="Greeting message shown in the widget.",
  )
  description: str = Field(
    default="Your council is ready to assist.",
    description="Short description displayed below the greeting.",
  )


def _load_asset_text(extension: str) -> str:
  for path in ASSETS_DIR.glob(f"{WIDGET_IDENTIFIER}-*.{extension}"):
    return path.read_text(encoding="utf-8")
  return ""


def _render_widget_html() -> str:
  css = _load_asset_text("css")
  js = _load_asset_text("js")
  
  logging.info(f"Rendering widget HTML - CSS: {len(css)} bytes, JS: {len(js)} bytes")
  
  return f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your AI Council</title>
    <style>{css}</style>
  </head>
  <body>
    <div id="{HTML_ROOT_ID}"></div>
    <script type="module">{js}</script>
  </body>
</html>"""


def _embedded_widget(widget_props: Dict[str, Any]) -> types.EmbeddedResource:
  html = _render_widget_html()
  # Embed props via data attribute so the widget can read them client-side.
  serialized_props = orjson.dumps(widget_props).decode("utf-8")
  html = html.replace(
    f'id="{HTML_ROOT_ID}"',
    f'id="{HTML_ROOT_ID}" data-widget-props="{serialized_props}"',
  )
  return types.EmbeddedResource(
    type="resource",
    resource=types.TextResourceContents(
      uri=f"app://{WIDGET_IDENTIFIER}.html",
      mimeType=MIME_TYPE,
      text=html,
      title="Your AI Council",
    ),
  )


mcp = FastMCP(
  name="your-ai-council",
  sse_path="/mcp",
  message_path="/mcp/messages",
  stateless_http=True,
)

app = mcp.streamable_http_app()

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_methods=["*"],
  allow_headers=["*"],
  allow_credentials=False,
)


@mcp._mcp_server.list_tools()
async def _list_tools() -> List[types.Tool]:
  return [
    types.Tool(
      name="hello-your-ai-council",
      title="Your AI Council Greeting",
      description="Returns a friendly greeting rendered by the Your AI Council widget.",
      inputSchema=GreetingInput.model_json_schema(),
    )
  ]


@mcp._mcp_server.list_resources()
async def _list_resources() -> List[types.Resource]:
  return [
    types.Resource(
      uri=f"app://{WIDGET_IDENTIFIER}.html",
      mimeType=MIME_TYPE,
      name="Your AI Council Widget",
      description="Interactive greeting widget for Your AI Council",
    )
  ]


async def _read_resource(req: types.ReadResourceRequest) -> types.ServerResult:
  logging.info(f"Reading resource: {req.params.uri}")
  
  if req.params.uri == f"app://{WIDGET_IDENTIFIER}.html":
    html = _render_widget_html()
    return types.ServerResult(
      types.ReadResourceResult(
        contents=[
          types.TextResourceContents(
            uri=req.params.uri,
            mimeType=MIME_TYPE,
            text=html,
          )
        ]
      )
    )
  
  return types.ServerResult(
    types.ReadResourceResult(
      contents=[],
      isError=True,
    )
  )


async def _call_tool_request(req: types.CallToolRequest) -> types.ServerResult:
  logging.info("Handling Your AI Council greeting request", extra={"arguments": req.params.arguments})

  try:
    payload = GreetingInput.model_validate(req.params.arguments or {})
  except ValidationError as exc:
    logging.warning("Validation failed for Your AI Council greeting", extra={"errors": exc.errors()})
    return types.ServerResult(
      types.CallToolResult(
        content=[
          types.TextContent(
            type="text",
            text="We could not understand the request. Please provide a greeting and description.",
          )
        ],
        isError=True,
      )
    )
  except Exception as exc:  # noqa: BLE001
    logging.exception("Unexpected error handling Your AI Council greeting")
    return types.ServerResult(
      types.CallToolResult(
        content=[types.TextContent(type="text", text="An unexpected error occurred. Please try again.")],
        isError=True,
      )
    )

  logging.info(
    "Your AI Council greeting prepared",
    extra={"greeting": payload.greeting, "description": payload.description},
  )

  content = [
    types.TextContent(
      type="text",
      text=f"Your AI Council greets you: {payload.greeting}",
    )
  ]

  return types.ServerResult(
    types.CallToolResult(
      content=content,
      isError=False,
    )
  )


mcp._mcp_server.request_handlers[types.CallToolRequest] = _call_tool_request
mcp._mcp_server.request_handlers[types.ReadResourceRequest] = _read_resource


@app.middleware("http")
async def log_request(request: Request, call_next):
  logging.debug(
    "Incoming HTTP request",
    extra={"method": request.method, "url": str(request.url)},
  )
  response = await call_next(request)
  logging.debug(
    "Outgoing HTTP response",
    extra={"status_code": response.status_code, "method": request.method, "url": str(request.url)},
  )
  return response


if __name__ == "__main__":
  import uvicorn

  logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
  uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)

