"use client";

import type { CouncilMember, CouncilResponse, CouncilResult } from "@/server/council";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useOpenAIGlobal, useOpenExternal, useWidgetProps } from "./hooks";
import DOMPurify from "isomorphic-dompurify";

const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

const MOCK_RESPONSE: CouncilResponse = {
  question: "Should we expand into the EU market this quarter?",
  members: [
    {
      name: "Dr. Sarah Chen",
      role: "Strategic Advisor",
      advice:
        "This is a great opportunity! Consider the long-term implications and stakeholder impact carefully. Timing is crucial—Q1 gives us runway to navigate regulatory compliance. Budget 8–12 weeks for market research and localization.",
      emoji: "🧠",
      expertise: 92,
      ctaLabel: "View full assessment",
      ctaUrl: "https://example.com/assessment",
    },
    {
      name: "Marcus Rodriguez",
      role: "Technical Expert",
      advice:
        "From a technical standpoint, this is feasible. Focus on implementation challenges and scalability. Our infrastructure can handle 3x traffic by May. Prioritize GDPR compliance and ensure all data residency requirements are met.",
      emoji: "🛠️",
      expertise: 88,
      ctaLabel: "Review technical spec",
      ctaUrl: "https://example.com/tech-spec",
    },
    {
      name: "Alex Thompson",
      role: "UX Specialist",
      advice:
        "Users will love this approach if we prioritize solving real problems and delivering visible value. Conduct user testing in beta markets first. A phased rollout with strong localization will give us competitive advantage and reduce churn.",
      emoji: "🎨",
      expertise: 85,
      ctaLabel: "See UX roadmap",
      ctaUrl: "https://example.com/ux-roadmap",
    },
  ],
};

type ThemeTokens = {
  cardBorder: string;
  cardBackground: string;
  primaryText: string;
  secondaryText: string;
  tertiaryText: string;
  badgeBorder: string;
  badgeBackground: string;
  badgeText: string;
  portraitBackground: string;
  portraitText: string;
  buttonBackground: string;
  buttonHover: string;
  buttonText: string;
  expertiseBg: string;
  expertiseText: string;
  ctaBorder: string;
  ctaBackground: string;
  ctaText: string;
  ctaHover: string;
};

function LoadingState() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <h2 className="text-xl font-semibold text-gray-900">Consulting the AI Council</h2>
          <p className="text-sm text-gray-600">Gathering wisdom from our expert members...</p>
        </div>
      </div>
    </div>
  );
}

function CouncilMemberCard({ member, tokens }: { member: CouncilMember; tokens: ThemeTokens }) {
  const openExternal = useOpenExternal();
  const emoji = (member.emoji || "🤖").trim() || "🤖";
  
  // Sanitize HTML content to prevent XSS attacks
  const sanitizedAdvice = useMemo(() => {
    return DOMPurify.sanitize(member.advice, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
    });
  }, [member.advice]);

  return (
    <article
      className={`flex h-full w-full max-w-[320px] flex-col overflow-hidden rounded-[28px] border ${tokens.cardBorder} ${tokens.cardBackground} shadow-[0_6px_18px_rgba(15,23,42,0.14)] transition-transform duration-200 hover:-translate-y-1`}
      aria-label={`${member.name}, ${member.role}`}
    >
      <div className={`flex h-32 w-full flex-shrink-0 items-center justify-center ${tokens.portraitBackground}`}>
        <span className={`text-6xl ${tokens.portraitText}`} role="img" aria-label={`${member.name} emoji portrait`}>
          {emoji}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 py-4 text-left">
        <div className="flex flex-col gap-2">
          <h3 className={`text-base font-semibold leading-5 ${tokens.primaryText}`}>{member.name}</h3>
          <div className="flex items-center justify-between gap-3">
            <span className={`inline-flex items-center rounded-full border ${tokens.badgeBorder} ${tokens.badgeBackground} px-3 py-1 text-xs font-medium ${tokens.badgeText}`}>
              {member.role}
            </span>
            {member.expertise && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tokens.expertiseBg} ${tokens.expertiseText}`}>
                <span aria-hidden>★</span>
                <span>{member.expertise}%</span>
              </span>
            )}
          </div>
        </div>

        <p className={`text-sm leading-relaxed ${tokens.secondaryText}`} dangerouslySetInnerHTML={{ __html: sanitizedAdvice }} />

        {member.ctaLabel && member.ctaUrl && (
          <button
            type="button"
            onClick={() => openExternal(member.ctaUrl!)}
            className={`mt-1 inline-flex w-full items-center justify-center rounded-xl border ${tokens.ctaBorder} ${tokens.ctaBackground} px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ${tokens.ctaText} ${tokens.ctaHover}`}
          >
            {member.ctaLabel}
          </button>
        )}
      </div>
    </article>
  );
}

type ToolOutputShape = {
  question?: string;
  members?: CouncilMember[];
  structuredContent?: CouncilResponse;
  result?: {
    structuredContent?: CouncilResponse;
  };
};

function HomeContent() {
  const toolOutput = useWidgetProps<ToolOutputShape>({});
  const theme = useOpenAIGlobal("theme") ?? "light";
  const maxHeight = useOpenAIGlobal("maxHeight") ?? 640;
  const searchParams = useSearchParams();

  const initialDevQuestion = searchParams.get("question") ?? MOCK_RESPONSE.question;
  const [devQuestion, setDevQuestion] = useState(initialDevQuestion);
  const [devResult, setDevResult] = useState<CouncilResult | null>(null);
  const [devError, setDevError] = useState<string | null>(null);
  const [devLoading, setDevLoading] = useState(false);
  const autoFetchTriggered = useRef(false);

  useEffect(() => {
    if (!IS_DEVELOPMENT) {
      return;
    }

    const paramQuestion = searchParams.get("question");
    if (paramQuestion && paramQuestion !== devQuestion) {
      setDevQuestion(paramQuestion);
    }
  }, [searchParams, devQuestion]);

  const fetchLiveCouncil = useCallback(
    async (question: string) => {
      if (!IS_DEVELOPMENT) {
        return;
      }

      const trimmed = question.trim();

      if (!trimmed) {
        setDevError("Enter a question to fetch live data.");
        return;
      }

      setDevLoading(true);
      setDevError(null);

      try {
        const response = await fetch("/api/council", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question: trimmed }),
        });

        const payload = (await response.json().catch(() => null)) as
          | (CouncilResult & { error?: string })
          | { error?: string }
          | null;

        if (!response.ok) {
          const message =
            payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
              ? payload.error
              : `Request failed with status ${response.status}`;
          throw new Error(message);
        }

        if (!payload || typeof payload !== "object" || !("response" in payload)) {
          throw new Error("Malformed response from /api/council.");
        }

        const typedPayload = payload as CouncilResult;

        setDevResult({
          response: typedPayload.response,
          source: typedPayload.source ?? "live",
          reason: typedPayload.reason,
        });
        setDevError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch council data.";
        setDevError(message);
      } finally {
        setDevLoading(false);
      }
    },
    []
  );

  const handleDevSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!IS_DEVELOPMENT) {
        return;
      }

      fetchLiveCouncil(devQuestion);
    },
    [devQuestion, fetchLiveCouncil]
  );

  useEffect(() => {
    if (!IS_DEVELOPMENT || autoFetchTriggered.current) {
      return;
    }

    const shouldAutoFetch = searchParams.get("auto") === "1";
    const questionParam = searchParams.get("question");

    if (shouldAutoFetch && questionParam) {
      autoFetchTriggered.current = true;
      setDevQuestion(questionParam);
      fetchLiveCouncil(questionParam);
    }
  }, [fetchLiveCouncil, searchParams]);

  const data: CouncilResponse | null = useMemo(() => {
    if (devResult?.response) {
      return devResult.response;
    }

    if (!toolOutput) {
      return IS_DEVELOPMENT ? MOCK_RESPONSE : null;
    }

    if (toolOutput?.result?.structuredContent) {
      return toolOutput.result.structuredContent as CouncilResponse;
    }

    if (toolOutput?.structuredContent) {
      return toolOutput.structuredContent as CouncilResponse;
    }

    if (toolOutput?.question && toolOutput?.members) {
      return {
        question: toolOutput.question,
        members: toolOutput.members,
      };
    }

    return IS_DEVELOPMENT ? MOCK_RESPONSE : null;
  }, [devResult, toolOutput]);

  if (!data) {
    return <LoadingState />;
  }

  const tokens: ThemeTokens =
    theme === "dark"
      ? {
          cardBorder: "border-[rgba(255,255,255,0.08)]",
          cardBackground: "bg-[rgba(30,34,48,0.88)]",
          primaryText: "text-white",
          secondaryText: "text-[rgba(235,235,245,0.78)]",
          tertiaryText: "text-[rgba(235,235,245,0.6)]",
          badgeBorder: "border-[rgba(255,255,255,0.15)]",
          badgeBackground: "bg-[rgba(255,255,255,0.08)]",
          badgeText: "text-[rgba(235,235,245,0.85)]",
          portraitBackground: "bg-[rgba(52,63,94,0.85)]",
          portraitText: "text-white",
          buttonBackground: "bg-white/95",
          buttonHover: "hover:bg-white",
          buttonText: "text-[rgb(25,74,216)]",
          expertiseBg: "bg-[rgba(79,126,255,0.12)]",
          expertiseText: "text-[rgba(168,198,255,0.95)]",
          ctaBorder: "border-[rgba(255,255,255,0.18)]",
          ctaBackground: "bg-[rgba(255,255,255,0.04)]",
          ctaText: "text-white",
          ctaHover: "hover:bg-[rgba(255,255,255,0.12)]",
        }
      : {
          cardBorder: "border-[rgba(219,223,231,0.8)]",
          cardBackground: "bg-white",
          primaryText: "text-[rgb(22,30,45)]",
          secondaryText: "text-[rgb(79,88,104)]",
          tertiaryText: "text-[rgb(107,114,128)]",
          badgeBorder: "border-[rgba(210,217,228,0.9)]",
          badgeBackground: "bg-[rgba(241,244,250,0.9)]",
          badgeText: "text-[rgb(78,86,104)]",
          portraitBackground: "bg-[rgba(241,244,250,0.9)]",
          portraitText: "text-[rgb(34,43,62)]",
          buttonBackground: "bg-[rgb(35,99,255)]",
          buttonHover: "hover:bg-[rgb(27,85,226)]",
          buttonText: "text-white",
          expertiseBg: "bg-[rgba(35,99,255,0.12)]",
          expertiseText: "text-[rgb(35,99,255)]",
          ctaBorder: "border-[rgba(210,217,228,0.9)]",
          ctaBackground: "bg-white",
          ctaText: "text-[rgb(25,74,216)]",
          ctaHover: "hover:bg-[rgba(231,237,254,0.6)]",
        };

  const isCompact = maxHeight < 540;

  return (
    <div className={`flex w-full justify-center px-3 ${isCompact ? "py-2.5" : "py-4"}`}>
      <div className="flex w-full max-w-[1080px] flex-col items-center gap-5">
        {IS_DEVELOPMENT && (
          <section className="w-full rounded-2xl border border-dashed border-[rgba(35,99,255,0.35)] bg-[rgba(35,99,255,0.08)] p-4 text-left shadow-sm dark:border-[rgba(148,163,184,0.45)] dark:bg-[rgba(30,34,48,0.85)]">
            <h2 className="text-sm font-semibold text-[rgb(22,30,45)] dark:text-white">Local council tester</h2>
            <p className="mt-1 text-xs text-[rgb(79,88,104)] dark:text-[rgba(235,235,245,0.78)]">
              Run the OpenRouter-powered council locally. Set OPENROUTER_API_KEY before fetching.
            </p>
            <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={handleDevSubmit}>
              <input
                value={devQuestion}
                onChange={(event) => setDevQuestion(event.target.value)}
                placeholder="Ask the council something…"
                className="w-full rounded-xl border border-[rgba(210,217,228,0.9)] bg-white px-3 py-2 text-sm text-[rgb(22,30,45)] shadow-sm focus:border-[rgb(35,99,255)] focus:outline-none focus:ring-2 focus:ring-[rgba(35,99,255,0.25)] dark:border-[rgba(255,255,255,0.14)] dark:bg-[rgba(18,23,43,0.92)] dark:text-white dark:focus:border-[rgba(148,163,184,0.8)] dark:focus:ring-[rgba(148,163,184,0.35)]"
              />
              <button
                type="submit"
                disabled={devLoading || !devQuestion.trim()}
                className="w-full rounded-xl bg-[rgb(35,99,255)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[rgb(27,85,226)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:bg-[rgb(59,130,246)] dark:hover:bg-[rgb(37,99,235)]"
              >
                {devLoading ? "Fetching…" : "Fetch live advice"}
              </button>
            </form>
            {devLoading && (
              <p className="mt-2 text-xs text-[rgb(35,99,255)] dark:text-[rgb(96,165,250)]">Consulting the council…</p>
            )}
            {devError && (
              <p className="mt-2 text-xs text-[rgb(220,38,38)] dark:text-[rgb(248,113,113)]">{devError}</p>
            )}
            {!devError && devResult?.source === "fallback" && devResult.reason && (
              <p className="mt-2 text-xs text-[rgb(217,119,6)] dark:text-[rgb(251,191,36)]">{devResult.reason}</p>
            )}
            {!devError && devResult?.source === "live" && (
              <p className="mt-2 text-xs text-[rgb(34,197,94)] dark:text-[rgb(134,239,172)]">Live council insights loaded.</p>
            )}
          </section>
        )}

        <header className={`flex w-full flex-col items-start gap-1 text-left ${tokens.primaryText}`}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] opacity-70">AI COUNCIL INSIGHTS</p>
          <h1 className="text-xl font-semibold leading-tight sm:text-[22px]">
            Three advisors weigh in on <span className="text-[rgb(35,99,255)]">{data.question}</span>
          </h1>
          <p className={`text-sm ${tokens.secondaryText}`}>Compare perspectives at a glance before you follow up in chat.</p>
        </header>

        <section aria-label="Council member perspectives" className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[rgba(0,0,0,0.08)] to-transparent md:pointer-events-none md:from-transparent" aria-hidden />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[rgba(0,0,0,0.08)] to-transparent md:pointer-events-none md:from-transparent" aria-hidden />
          <ul
            className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pt-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            role="list"
          >
            {data.members?.map((member, index) => (
              <li
                key={`${member.name}-${index}`}
                className="flex w-full shrink-0 snap-center justify-center md:w-auto md:shrink"
              >
                <CouncilMemberCard member={member} tokens={tokens} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingState />}>
      <HomeContent />
    </Suspense>
  );
}
