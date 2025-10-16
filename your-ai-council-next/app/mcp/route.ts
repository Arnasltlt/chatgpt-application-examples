import { baseURL } from "@/baseUrl";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

type CouncilMember = {
  name: string;
  role: string;
  opinion: string;
  avatar?: string;
  expertise?: number;
  ctaLabel?: string;
  ctaUrl?: string;
};

type CouncilResponse = {
  question: string;
  members: CouncilMember[];
};

const memberSchema = z
  .object({
    name: z.string().min(1),
    role: z.string().min(1),
    opinion: z.string().min(1),
    avatar: z.string().optional(),
    expertise: z.number().min(0).max(100).optional(),
    ctaLabel: z.string().optional(),
    ctaUrl: z.string().optional(),
  })
  .passthrough();

const councilResponseSchema = z.object({
  question: z.string().min(1),
  members: z.array(memberSchema).length(3),
});

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "anthropic/claude-3.5-sonnet";

const FALLBACK_MEMBERS: CouncilMember[] = [
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
];

function buildFallbackResponse(question: string): CouncilResponse {
  return {
    question,
    members: FALLBACK_MEMBERS.map((member) => ({ ...member })),
  };
}

function extractMessageContent(data: unknown): string | undefined {
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const firstChoice = (data as { choices?: Array<{ message?: unknown }> }).choices?.[0];
  const message = firstChoice?.message as
    | { content?: string | Array<{ text?: string }> }
    | undefined;

  if (!message) {
    return undefined;
  }

  if (typeof message.content === "string") {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("");
  }

  return undefined;
}

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

      const apiKey = process.env.OPENROUTER_API_KEY;

      if (!apiKey) {
        const fallback = buildFallbackResponse(question);
        return {
          content: [
            {
              type: "text",
              text: `Council opinion on: ${question}`,
            },
            {
              type: "text",
              text: "Live council insights are unavailable because OPENROUTER_API_KEY is not configured.",
            },
          ],
          structuredContent: fallback,
          _meta: baseMeta,
        };
      }

      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        };

        const referer = process.env.OPENROUTER_REFERRER ?? baseURL;
        if (referer) {
          headers["HTTP-Referer"] = referer;
        }

        const title = process.env.OPENROUTER_TITLE ?? "Your AI Council";
        if (title) {
          headers["X-Title"] = title;
        }

        const response = await fetch(OPENROUTER_ENDPOINT, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages: [
              {
                role: "system",
                content:
                  "You convene an expert council of three personas. Provide concise, actionable opinions tailored to the user's question. Respond ONLY with JSON matching the schema you are given.",
              },
              {
                role: "user",
                content: JSON.stringify({
                  question,
                  instructions:
                    "Return exactly three distinct members with unique names and roles who give complementary advice. Keep opinions under 90 words.",
                }),
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "council_response",
                schema: {
                  type: "object",
                  required: ["question", "members"],
                  properties: {
                    question: {
                      type: "string",
                      description: "Restate the user's question in natural language.",
                    },
                    members: {
                      type: "array",
                      minItems: 3,
                      maxItems: 3,
                      items: {
                        type: "object",
                        required: ["name", "role", "opinion"],
                        properties: {
                          name: { type: "string" },
                          role: { type: "string" },
                          opinion: { type: "string" },
                          expertise: {
                            type: "number",
                            minimum: 0,
                            maximum: 100,
                          },
                          avatar: { type: "string" },
                          ctaLabel: { type: "string" },
                          ctaUrl: { type: "string" },
                        },
                        additionalProperties: true,
                      },
                    },
                  },
                },
              },
            },
          }),
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`OpenRouter responded with status ${response.status}`);
        }

        const data = await response.json();
        const content = extractMessageContent(data);

        if (!content) {
          throw new Error("OpenRouter response did not include content");
        }

        const parsed = JSON.parse(content);
        const validated = councilResponseSchema.parse({
          question: parsed.question ?? question,
          members: parsed.members,
        });

        const structuredContent: CouncilResponse = {
          question: validated.question ?? question,
          members: validated.members.map((member) => ({ ...member })) as CouncilMember[],
        };

        return {
          content: [
            {
              type: "text",
              text: `Council opinion on: ${structuredContent.question}`,
            },
          ],
          structuredContent,
          _meta: baseMeta,
        };
      } catch (error) {
        console.error("Failed to fetch council insights from OpenRouter", error);
        const fallback = buildFallbackResponse(question);
        return {
          content: [
            {
              type: "text",
              text: `Council opinion on: ${question}`,
            },
            {
              type: "text",
              text: "We encountered an issue retrieving live council insights. Displaying a fallback response.",
            },
          ],
          structuredContent: fallback,
          _meta: baseMeta,
        };
      }
    }
  );
});

export const GET = handler;
export const POST = handler;
