import { baseURL } from "@/baseUrl";
import { z } from "zod";

export type CouncilMember = {
  name: string;
  role: string;
  advice: string;
  emoji: string;
  expertise?: number;
  ctaLabel?: string;
  ctaUrl?: string;
};

export type CouncilResponse = {
  question: string;
  members: CouncilMember[];
};

export type CouncilResult = {
  response: CouncilResponse;
  source: "live" | "fallback";
  reason?: string;
};

const memberSchema = z
  .object({
    name: z.string().min(1),
    role: z.string().min(1),
    advice: z.string().min(1),
    emoji: z.string().min(1),
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
    advice:
      "This is a great opportunity! Consider the long-term implications and stakeholder impact carefully.",
    emoji: "🧠",
  },
  {
    name: "Marcus Rodriguez",
    role: "Technical Expert",
    advice:
      "From a technical standpoint, this is feasible. Focus on implementation challenges and scalability.",
    emoji: "🛠️",
  },
  {
    name: "Alex Thompson",
    role: "User Experience Specialist",
    advice:
      "Users will love this approach! Make sure it solves real problems and provides clear value.",
    emoji: "🎨",
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

export async function getCouncilResult(question: string): Promise<CouncilResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      response: buildFallbackResponse(question),
      source: "fallback",
      reason: "Live council insights are unavailable because OPENROUTER_API_KEY is not configured.",
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
              "You convene an expert council of three personas. Provide concise, actionable advice tailored to the user's question. Each persona must include an emoji that reflects their role or energy. Respond ONLY with JSON matching the schema you are given.",
          },
          {
            role: "user",
            content: JSON.stringify({
              question,
              instructions:
                "Return exactly three distinct members with unique names and roles who give complementary advice. Pick an emoji for each member that fits their persona (no text, just a single emoji character). Keep advice under 90 words.",
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
                    required: ["name", "role", "advice", "emoji"],
                    properties: {
                      name: { type: "string" },
                      role: { type: "string" },
                      advice: {
                        type: "string",
                        description: "Concise, actionable advice from this council member."
                      },
                      emoji: {
                        type: "string",
                        minLength: 1,
                        description: "An emoji that represents the persona (single emoji character).",
                      },
                      expertise: {
                        type: "number",
                        minimum: 0,
                        maximum: 100,
                      },
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

    const normalized = normalizeCouncilPayload(content, question);

    if (normalized) {
      return {
        response: normalized,
        source: "live",
      };
    }

    throw new Error("OpenRouter response missing council members");
  } catch (error) {
    console.error("Failed to fetch council insights from OpenRouter", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return {
      response: buildFallbackResponse(question),
      source: "fallback",
      reason: `We encountered an issue retrieving live council insights (${message}). Displaying a fallback response.`,
    };
  }
}

function normalizeCouncilPayload(content: string, question: string): CouncilResponse | null {
  const json = safeJsonParse(content);

  if (!json) {
    return null;
  }

  const members = findMembersDeep(json);

  if (!members) {
    if (typeof json === "object" && json) {
      const preview = JSON.stringify(json).slice(0, 320);
      console.error("OpenRouter payload missing expected members", preview);
    }
    return null;
  }

  const resolvedQuestion = findQuestionDeep(json) ?? question;

  const parsed = councilResponseSchema.safeParse({
    question: resolvedQuestion,
    members,
  });

  if (!parsed.success) {
    console.error("OpenRouter payload failed schema validation", parsed.error.flatten());
    return null;
  }

  return {
    question: parsed.data.question,
    members: parsed.data.members.map((member) => ({ ...member })),
  };
}

function safeJsonParse(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to parse OpenRouter payload", {
      message: error instanceof Error ? error.message : error,
      preview: content.slice(0, 240),
    });
    return null;
  }
}

function findMembersDeep(node: unknown): unknown[] | null {
  const queue: unknown[] = [node];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      continue;
    }

    if (Array.isArray(current) && isCouncilMemberArray(current)) {
      return current;
    }

    if (typeof current === "object") {
      const values = Object.values(current as Record<string, unknown>);

      if (values.length === 3 && isCouncilMemberArray(values)) {
        return values;
      }

      for (const value of values) {
        queue.push(value);
      }
    }
  }

  return null;
}

function findQuestionDeep(node: unknown): string | null {
  const queue: unknown[] = [node];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      continue;
    }

    if (typeof current === "object") {
      const record = current as Record<string, unknown>;

      if (typeof record.question === "string" && record.question.trim().length > 0) {
        return record.question;
      }

      for (const value of Object.values(record)) {
        queue.push(value);
      }
    }
  }

  return null;
}

function isCouncilMemberArray(candidate: unknown[]): candidate is CouncilMember[] {
  return candidate.length === 3 && candidate.every(isCouncilMemberShape);
}

function isCouncilMemberShape(candidate: unknown): candidate is CouncilMember {
  return (
    !!candidate &&
    typeof candidate === "object" &&
    typeof (candidate as { name?: unknown }).name === "string" &&
    typeof (candidate as { role?: unknown }).role === "string" &&
    typeof (candidate as { advice?: unknown }).advice === "string" &&
    typeof (candidate as { emoji?: unknown }).emoji === "string"
  );
}
