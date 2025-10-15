#!/usr/bin/env python3
"""
Your AI Council MCP Server

A FastAPI server that provides council advice through three AI personas.
Takes a question and returns three different perspectives from council members.
Follows OpenAI Apps SDK best practices for proper MCP tool registration and UI handoff.
"""

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import mcp.types as types
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Pydantic models for input validation
class CouncilQuestionInput(BaseModel):
    """Input model for council question requests."""
    question: str = Field(..., description="The question to ask the AI council", min_length=1)

class CouncilMember(BaseModel):
    """Model representing a council member's response."""
    name: str = Field(..., description="Name of the council member")
    role: str = Field(..., description="Role/title of the council member")
    opinion: str = Field(..., description="The council member's opinion on the question")

class CouncilResponse(BaseModel):
    """Model representing the complete council response."""
    question: str = Field(..., description="The original question")
    members: List[CouncilMember] = Field(..., description="List of council member responses")

# Initialize FastAPI app
app = FastAPI(title="Your AI Council", description="AI Council providing multiple perspectives")

# Configure CORS for ChatGPT sandbox
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ChatGPT sandbox
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMPLATE_PATH = Path(__file__).resolve().parent.parent / "assets" / "your-ai-council.html"


def _load_widget_html() -> str:
    if not TEMPLATE_PATH.exists():
        raise FileNotFoundError(
            "Widget template not found. Please ensure assets/your-ai-council.html exists."
        )

    return TEMPLATE_PATH.read_text(encoding="utf-8")


def _get_tool_metadata():
    """Get proper tool metadata for ChatGPT UI handoff."""
    return {
        "openai/outputTemplate": "app://your-ai-council.html",
        "openai/toolInvocation/invoking": "Consulting the AI Council",
        "openai/toolInvocation/invoked": "Council wisdom received",
        "openai/widgetAccessible": True,
        "openai/resultCanProduceWidget": True,
        "openai/toolEnabled": True,       # Explicitly enable the tool
        "annotations": {
            "destructiveHint": False,      # Safe, read-only operation
            "openWorldHint": False,        # No external calls
            "readOnlyHint": True,          # Doesn't modify external state
        },
    }

@app.post("/mcp")
async def handle_mcp_request(request: Dict[str, Any]):
    """
    Handle MCP protocol requests.
    This implements the basic MCP protocol for ChatGPT integration.
    """
    logger.info(f"MCP request received: {request}")

    try:
        method = request.get("method")
        params = request.get("params", {})

        if method == "initialize":
            # Handle MCP initialization
            protocol_version = params.get("protocolVersion", "2025-03-26")
            response = {
                "jsonrpc": "2.0",
                "result": {
                    "protocolVersion": protocol_version,
                    "capabilities": {
                        "tools": {
                            "call": True
                        },
                        "resources": {
                            "list": True,
                            "read": True
                        }
                    },
                    "serverInfo": {
                        "name": "Your AI Council",
                        "version": "0.1.0"
                    }
                }
            }

            # Add id if present in request
            if "id" in request:
                response["id"] = request["id"]

            return response

        elif method == "notifications/initialized":
            # Handle initialization notification (no response needed)
            logger.info("MCP client initialized")
            return None

        elif method == "resources/read":
            # Handle resource reading for UI widgets
            uri = params.get("uri")
            if uri == "app://your-ai-council.html":
                html_content = _load_widget_html()
                response = {
                    "jsonrpc": "2.0",
                    "id": request.get("id"),
                    "result": {
                        "contents": [
                            {
                                "uri": uri,
                                "mimeType": "text/html",
                                "text": html_content
                            }
                        ]
                    }
                }
                return response
            else:
                return {
                    "jsonrpc": "2.0",
                    "id": request.get("id"),
                    "error": {
                        "code": -32602,
                        "message": f"Resource '{uri}' not found"
                    }
                }

        elif method == "tools/list":
            # Return available tools
            return {
                "jsonrpc": "2.0",
                "id": request.get("id"),
                "result": {
                    "tools": [
                        {
                            "name": "ask_council",
                            "title": "Ask AI Council",
                            "description": "Get expert advice from three AI council members with different perspectives. Use this when you need strategic, technical, or user experience guidance on any question or decision.",
                            "inputSchema": CouncilQuestionInput.model_json_schema(),
                            "_meta": _get_tool_metadata(),
                            "openai": {
                                "result": {
                                    "structured": True
                                }
                            }
                        }
                    ]
                }
            }

        elif method == "tools/call":
            # Handle tool execution
            tool_name = params.get("name")
            tool_args = params.get("arguments", {})

            if tool_name == "ask_council":
                # Validate and process the question
                input_data = CouncilQuestionInput(**tool_args)

                # Generate simple hardcoded responses
                members = [
                    CouncilMember(
                        name="Dr. Sarah Chen",
                        role="Strategic Advisor",
                        opinion="This is a great opportunity! Consider the long-term implications and stakeholder impact carefully."
                    ),
                    CouncilMember(
                        name="Marcus Rodriguez",
                        role="Technical Expert",
                        opinion="From a technical standpoint, this is feasible. Focus on implementation challenges and scalability."
                    ),
                    CouncilMember(
                        name="Alex Thompson",
                        role="User Experience Specialist",
                        opinion="Users will love this approach! Make sure it solves real problems and provides clear value."
                    )
                ]

                response = CouncilResponse(
                    question=input_data.question,
                    members=members
                )

                logger.info(f"Council response generated with {len(members)} members")

                # Return structured content for both text and UI
                structured_content = response.model_dump()

                return {
                    "jsonrpc": "2.0",
                    "id": request.get("id"),
                    "result": {
                        "content": [
                            {
                                "type": "text",
                                "text": f"Your AI Council considered the question: {input_data.question}",
                            }
                        ],
                        "structuredContent": structured_content,
                        "_meta": _get_tool_metadata(),
                    },
                }
            else:
                return {
                    "jsonrpc": "2.0",
                    "id": request.get("id"),
                    "error": {
                        "code": -32601,
                        "message": f"Method '{tool_name}' not found"
                    }
                }

        else:
            # Handle unknown methods gracefully
            logger.warning(f"Unknown MCP method received: {method}")
            return {
                "jsonrpc": "2.0",
                "id": request.get("id"),
                "error": {
                    "code": -32601,
                    "message": f"Method '{method}' not found"
                }
            }

    except Exception as e:
        logger.error(f"Error processing MCP request: {e}")
        return {
            "jsonrpc": "2.0",
            "id": request.get("id"),
            "error": {
                "code": -32603,
                "message": "Internal error"
            }
        }

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "Your AI Council Server is running"}

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "your-ai-council"}

if __name__ == "__main__":
    logger.info("Starting Your AI Council Server")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")