import { getCouncilResult } from "@/server/council";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function missingQuestionResponse() {
  return NextResponse.json(
    { error: "A non-empty question is required." },
    { status: 400 }
  );
}

async function handleQuestion(question: string) {
  const trimmed = question.trim();
  if (!trimmed) {
    return missingQuestionResponse();
  }

  const result = await getCouncilResult(trimmed);
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  const question = request.nextUrl.searchParams.get("question");
  if (!question) {
    return missingQuestionResponse();
  }

  try {
    return await handleQuestion(question);
  } catch (error) {
    console.error("Failed to process GET /api/council", error);
    return NextResponse.json(
      { error: "Unable to retrieve council insights." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    console.error("Failed to parse POST /api/council payload", error);
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const question =
    typeof body === "object" && body && "question" in body
      ? (body as { question?: unknown }).question
      : undefined;

  if (typeof question !== "string") {
    return missingQuestionResponse();
  }

  try {
    return await handleQuestion(question);
  } catch (error) {
    console.error("Failed to process POST /api/council", error);
    return NextResponse.json(
      { error: "Unable to retrieve council insights." },
      { status: 500 }
    );
  }
}
