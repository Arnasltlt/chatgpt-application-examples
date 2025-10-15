"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useOpenExternal, useWidgetProps } from "./hooks";

function createFallbackAvatar(initial: string, from: string, to: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='112' height='112' viewBox='0 0 112 112'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='${from}'/><stop offset='100%' stop-color='${to}'/></linearGradient></defs><rect width='112' height='112' rx='56' fill='url(%23g)'/><text x='50%' y='58%' font-family='system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' font-size='48' fill='white' text-anchor='middle'>${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const FALLBACK_AVATARS: Record<string, string> = {
  "Dr. Elara Quinn": createFallbackAvatar("E", "#5a78ff", "#7865ff"),
  "Professor Milo Tan": createFallbackAvatar("M", "#2693ff", "#40c4ff"),
  "Strategist Reva Sol": createFallbackAvatar("R", "#f97794", "#f7b26a"),
};

type CouncilMember = {
  name: string;
  role: string;
  opinion: string;
  avatar?: string;
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
      name: "Dr. Elara Quinn",
      role: "Ethics & Compliance",
      opinion:
        "Regulation is tightening—budget at least eight weeks so compliance and privacy reviews do not stall launch.",
      ctaLabel: "View compliance checklist",
      ctaUrl: "https://example.com/compliance",
    },
    {
      name: "Professor Milo Tan",
      role: "Data Science",
      opinion:
        "Demand curves look strong; projections show breakeven within two quarters if we fund localized onboarding now.",
      ctaLabel: "Open forecasting model",
      ctaUrl: "https://example.com/forecast",
    },
    {
      name: "Strategist Reva Sol",
      role: "Growth Strategy",
      opinion:
        "Pilot in two markets first so we can iterate with real feedback without overextending commercial teams.",
      ctaLabel: "See pilot playbook",
      ctaUrl: "https://example.com/pilot",
    },
  ],
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
  return FALLBACK_AVATARS[member.name] ?? createFallbackAvatar(member.name.charAt(0).toUpperCase(), "#d9e2ff", "#9bb3ff");
}

function CouncilMemberCard({ member }: { member: CouncilMember }) {
  const initial = useMemo(() => member.name.charAt(0), [member.name]);
  const hasCta = Boolean(member.ctaLabel && member.ctaUrl);
  const resolvedAvatar = resolveAvatar(member);
  const openExternal = useOpenExternal();

  return (
    <article
      className="flex h-full w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-[rgb(229,232,235)] bg-white p-6 text-center shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-transform duration-200 hover:-translate-y-1"
      aria-label={`${member.name}, ${member.role}`}
    >
      <div className="flex flex-col items-center gap-3">
        {resolvedAvatar ? (
          <Image
            src={resolvedAvatar}
            alt={`${member.name} portrait`}
            width={56}
            height={56}
            className="h-14 w-14 rounded-full object-cover"
            loading="lazy"
            unoptimized
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(228,235,255)] text-base font-semibold text-[rgb(55,95,255)]">
            {initial}
          </div>
        )}
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-base font-semibold text-[rgb(22,30,45)]">{member.name}</h3>
          <span className="rounded-full border border-[rgb(209,214,224)] bg-[rgb(244,246,250)] px-3 py-1 text-xs font-medium text-[rgb(80,90,110)]">
            {member.role}
          </span>
        </div>
      </div>
      <p className="text-sm leading-6 text-[rgb(71,82,105)]">{member.opinion}</p>
      {hasCta && (
        <div className="mt-2 w-full">
          <button
            type="button"
            onClick={() => openExternal(member.ctaUrl!)}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[rgb(35,99,255)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[rgb(27,85,226)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(144,180,255)]"
          >
            {member.ctaLabel}
          </button>
        </div>
      )}
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

  return (
    <div className="flex w-full justify-center px-4 py-6">
      <div className="flex w-full max-w-[1120px] flex-col items-center gap-6 text-center">
        <header className="flex flex-col items-center gap-2 text-[rgb(22,30,45)]">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[rgb(108,118,139)]">
            AI COUNCIL INSIGHTS
          </p>
          <h1 className="text-2xl font-semibold">
            Three advisors weigh in on “{data.question}”
          </h1>
          <p className="text-sm text-[rgb(88,98,116)]">Compare perspectives at a glance before you follow up in chat.</p>
        </header>

        <section aria-label="Council member perspectives" className="relative">
          <ul
            className="flex w-full flex-col gap-4 pb-2 md:flex-row md:justify-center md:overflow-x-auto md:snap-x md:snap-mandatory"
            role="list"
          >
            {data.members?.map((member, index) => (
              <li
                key={`${member.name}-${index}`}
                className="flex w-full justify-center md:min-w-[280px] md:max-w-[340px] md:flex-1 md:snap-center"
              >
                <CouncilMemberCard member={member} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
