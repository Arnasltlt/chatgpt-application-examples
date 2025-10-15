import { baseURL } from "@/baseUrl";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

type CouncilMember = {
  name: string;
  role: string;
  opinion: string;
};

type CouncilResponse = {
  question: string;
  members: CouncilMember[];
};

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
        "openai/widgetPrefersBorder": true,
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
            "openai/widgetPrefersBorder": true,
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
      const structuredContent: CouncilResponse = {
        question,
        members: [
          {
            name: "Dr. Sarah Chen",
            role: "Strategic Advisor",
            opinion:
              "This is a great opportunity! Consider the long-term implications and stakeholder impact carefully.",
          },
          {
            name: "Marcus Rodriguez",
            role: "Technical Expert",
            opinion:
              "From a technical standpoint, this is feasible. Focus on implementation challenges and scalability.",
          },
          {
            name: "Alex Thompson",
            role: "User Experience Specialist",
            opinion:
              "Users will love this approach! Make sure it solves real problems and provides clear value.",
          },
        ],
      };

      return {
        content: [
          {
            type: "text",
            text: `Council opinion on: ${question}`,
          },
        ],
        structuredContent,
        _meta: {
          "openai/outputTemplate": templateUri,
          "openai/toolInvocation/invoking": "Consulting the AI Council",
          "openai/toolInvocation/invoked": "Council wisdom received",
          "openai/widgetAccessible": true,
          "openai/resultCanProduceWidget": true,
        },
      };
    }
  );
});

export const GET = handler;
export const POST = handler;
