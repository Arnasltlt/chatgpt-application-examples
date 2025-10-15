"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useOpenAIGlobal, useOpenExternal, useWidgetProps } from "./hooks";

function createFallbackAvatar(initial: string, from: string, to: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='${from}'/><stop offset='100%' stop-color='${to}'/></linearGradient></defs><rect width='120' height='120' rx='60' fill='url(%23g)'/><text x='50%' y='58%' font-family='system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' font-size='56' fill='white' text-anchor='middle'>${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

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

const MOCK_RESPONSE: CouncilResponse = {
  question: "Should we expand into the EU market this quarter?",
  members: [
    {
      name: "Dr. Sarah Chen",
      role: "Strategic Advisor",
      opinion:
        "This is a great opportunity! Consider the long-term implications and stakeholder impact carefully. Timing is crucial—Q1 gives us runway to navigate regulatory compliance. Budget 8–12 weeks for market research and localization.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
      expertise: 92,
      ctaLabel: "View full assessment",
      ctaUrl: "https://example.com/assessment",
    },
    {
      name: "Marcus Rodriguez",
      role: "Technical Expert",
      opinion:
        "From a technical standpoint, this is feasible. Focus on implementation challenges and scalability. Our infrastructure can handle 3x traffic by May. Prioritize GDPR compliance and ensure all data residency requirements are met.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
      expertise: 88,
      ctaLabel: "Review technical spec",
      ctaUrl: "https://example.com/tech-spec",
    },
    {
      name: "Alex Thompson",
      role: "UX Specialist",
      opinion:
        "Users will love this approach if we prioritize solving real problems and delivering visible value. Conduct user testing in beta markets first. A phased rollout with strong localization will give us competitive advantage and reduce churn.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
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

function resolveAvatar(member: CouncilMember) {
  if (member.avatar) {
    return member.avatar;
  }
  return createFallbackAvatar(member.name.charAt(0).toUpperCase(), "#d9e2ff", "#9bb3ff");
}

function CouncilMemberCard({ member, tokens }: { member: CouncilMember; tokens: ThemeTokens }) {
  const openExternal = useOpenExternal();

  return (
    <article
      className={`flex h-full w-full max-w-[320px] flex-col overflow-hidden rounded-[28px] border ${tokens.cardBorder} ${tokens.cardBackground} shadow-[0_6px_18px_rgba(15,23,42,0.14)] transition-transform duration-200 hover:-translate-y-1`}
      aria-label={`${member.name}, ${member.role}`}
    >
      <div className="relative h-32 w-full flex-shrink-0">
        <Image
          src={member.avatar || resolveAvatar(member)}
          alt={`${member.name} portrait`}
          fill
          className="object-cover object-center"
          loading="lazy"
          unoptimized
        />
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

        <p className={`text-sm leading-relaxed ${tokens.secondaryText}`}>{member.opinion}</p>

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

export default function Home() {
  const toolOutput = useWidgetProps<ToolOutputShape>({});
  const theme = useOpenAIGlobal("theme") ?? "light";
  const maxHeight = useOpenAIGlobal("maxHeight") ?? 640;

  const data: CouncilResponse | null = useMemo(() => {
    if (!toolOutput) {
      if (process.env.NODE_ENV === "development") {
        return MOCK_RESPONSE;
      }
      return null;
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

    if (process.env.NODE_ENV === "development") {
      return MOCK_RESPONSE;
    }

    return null;
  }, [toolOutput]);

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
