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
      className={`flex h-full w-full max-w-[360px] flex-col rounded-3xl border ${tokens.cardBorder} ${tokens.cardBackground} overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.12)] transition-transform duration-200 hover:-translate-y-1`}
      aria-label={`${member.name}, ${member.role}`}
    >
      {/* Image Section */}
      <div className="relative h-40 w-full flex-shrink-0 overflow-hidden bg-gradient-to-b from-gray-200 to-gray-100">
        <Image
          src={member.avatar || resolveAvatar(member)}
          alt={`${member.name} portrait`}
          fill
          className="object-cover object-center"
          loading="lazy"
          unoptimized
        />
      </div>

      {/* Content Section */}
      <div className="flex flex-col gap-4 px-6 py-5">
        {/* Name + Role */}
        <div className="flex flex-col gap-2">
          <h3 className={`text-lg font-semibold ${tokens.primaryText}`}>{member.name}</h3>
          <div className="flex items-center justify-between gap-3">
            <span className={`rounded-full border ${tokens.badgeBorder} ${tokens.badgeBackground} px-3 py-1 text-xs font-medium ${tokens.badgeText}`}>
              {member.role}
            </span>
            {member.expertise && (
              <div className={`flex items-center gap-1.5 rounded-full ${tokens.expertiseBg} px-2.5 py-1`}>
                <span className="text-xs font-semibold text-blue-600">★</span>
                <span className={`text-xs font-semibold ${tokens.expertiseText}`}>{member.expertise}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Opinion */}
        <p className={`text-sm leading-relaxed ${tokens.secondaryText}`}>{member.opinion}</p>

        {/* CTA Button */}
        {member.ctaLabel && member.ctaUrl && (
          <button
            type="button"
            onClick={() => openExternal(member.ctaUrl!)}
            className={`mt-2 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(79,119,255,0.6)] ${tokens.buttonBackground} ${tokens.buttonText} ${tokens.buttonHover}`}
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
          cardBackground: "bg-[rgba(26,32,44,0.6)]",
          primaryText: "text-white",
          secondaryText: "text-[rgba(235,235,245,0.75)]",
          tertiaryText: "text-[rgba(235,235,245,0.6)]",
          badgeBorder: "border-[rgba(255,255,255,0.15)]",
          badgeBackground: "bg-[rgba(255,255,255,0.08)]",
          badgeText: "text-[rgba(235,235,245,0.9)]",
          buttonBackground: "bg-white/95",
          buttonHover: "hover:bg-white",
          buttonText: "text-[rgb(25,74,216)]",
          expertiseBg: "bg-[rgba(147,197,253,0.15)]",
          expertiseText: "text-[rgb(147,197,253)]",
        }
      : {
          cardBorder: "border-[rgb(229,232,235)]",
          cardBackground: "bg-white",
          primaryText: "text-[rgb(22,30,45)]",
          secondaryText: "text-[rgb(75,85,99)]",
          tertiaryText: "text-[rgb(107,114,128)]",
          badgeBorder: "border-[rgb(209,214,224)]",
          badgeBackground: "bg-[rgb(244,246,250)]",
          badgeText: "text-[rgb(80,90,110)]",
          buttonBackground: "bg-[rgb(35,99,255)]",
          buttonHover: "hover:bg-[rgb(27,85,226)]",
          buttonText: "text-white",
          expertiseBg: "bg-[rgb(219,234,254)]",
          expertiseText: "text-[rgb(37,99,235)]",
        };

  const isCompact = maxHeight < 600;

  return (
    <div className={`flex w-full justify-center px-4 ${isCompact ? "py-3" : "py-5"}`}>
      <div className="flex w-full max-w-[1120px] flex-col items-center gap-6 text-center">
        {/* Header */}
        <header className={`flex flex-col items-center gap-3 ${tokens.primaryText}`}>
          <p className="text-xs font-medium uppercase tracking-[0.15em] opacity-70">AI COUNCIL INSIGHTS</p>
          <h1 className="text-2xl font-bold">Three advisors weigh in on &quot;{data.question}&quot;</h1>
          <p className={`text-sm ${tokens.secondaryText}`}>Compare perspectives at a glance before you follow up in chat.</p>
        </header>

        {/* Carousel Section with Hidden Scrollbars */}
        <section aria-label="Council member perspectives" className="relative w-full">
          <ul
            className="flex w-full flex-col gap-5 pb-2 md:flex-row md:justify-center md:overflow-x-auto md:snap-x md:snap-mandatory md:[scrollbar-width:none] md:[-webkit-overflow-scrolling:touch] md:[-ms-overflow-style:none] md:[&::-webkit-scrollbar]:hidden"
            role="list"
          >
            {data.members?.map((member, index) => (
              <li
                key={`${member.name}-${index}`}
                className="flex w-full justify-center md:min-w-[360px] md:flex-none md:snap-center"
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
