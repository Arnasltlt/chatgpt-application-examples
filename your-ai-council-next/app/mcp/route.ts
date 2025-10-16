import { baseURL } from "@/baseUrl";
import { getCouncilResult } from "@/server/council";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const handler = createMcpHandler(async (server) => {
  const templateUri = "ui://your-ai-council.html";

  server.registerResource(
    "your-ai-council",
    templateUri,
    {
      title: "Your AI Council",
      description: "Self-contained widget bundle",
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": "Render the AI Council widget",
        "openai/widgetPrefersBorder": false,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: await fetch(`${baseURL}/`).then((res) => res.text()),
          _meta: {
            "openai/widgetDescription": "Render the AI Council widget",
            "openai/widgetPrefersBorder": false,
          },
        },
      ],
    })
  );

  server.registerTool(
    "ask_council",
    {
      title: "Ask AI Council",
      description:
        "Get expert advice from three AI council members with different perspectives",
      inputSchema: {
        question: z
          .string()
          .min(1)
          .describe("The question to ask the AI council"),
      },
      _meta: {
        "openai/outputTemplate": templateUri,
        "openai/toolInvocation/invoking": "Consulting the AI Council",
        "openai/toolInvocation/invoked": "Council wisdom received",
        "openai/widgetAccessible": true,
        "openai/resultCanProduceWidget": true,
      },
    },
    async ({ question }) => {
      const baseMeta = {
        "openai/outputTemplate": templateUri,
        "openai/toolInvocation/invoking": "Consulting the AI Council",
        "openai/toolInvocation/invoked": "Council wisdom received",
        "openai/widgetAccessible": true,
        "openai/resultCanProduceWidget": true,
      } as const;

      const result = await getCouncilResult(question);
      const content: Array<{ type: "text"; text: string }> = [
        {
          type: "text",
          text: `Council opinion on: ${result.response.question}`,
        },
      ];

      if (result.source === "fallback" && result.reason) {
        content.push({
          type: "text",
          text: result.reason,
        });
      }

      return {
        content,
        structuredContent: result.response,
        _meta: baseMeta,
      };
    }
  );
});

export const GET = handler;
export const POST = handler;
