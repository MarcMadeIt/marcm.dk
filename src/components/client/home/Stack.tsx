"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import StackIcon from "tech-stack-icons";
type TechStack = {
  name: string;
  description: string;
  icon: React.ReactNode;
};

const primaryStacks: TechStack[] = [
  {
    name: "React",
    description: "Component architecture, hooks, performance patterns",
    icon: (
      <div className="w-12 h-12">
        <StackIcon name="react" />
      </div>
    ),
  },
  {
    name: "Next.js",
    description: "App Router, SSR/ISR, API routes, auth patterns",
    icon: (
      <div className="w-12 h-12 ">
        <StackIcon name="nextjs2" />
      </div>
    ),
  },
  {
    name: "TypeScript",
    description: "Type safety, scalable codebases, DX",
    icon: (
      <div className="w-12 h-12 ">
        <StackIcon name="typescript" />
      </div>
    ),
  },
  {
    name: "NestJS",
    description: "Modular backend, auth, background jobs",
    icon: (
      <div className="w-12 h-12 ">
        <StackIcon name="nestjs" />
      </div>
    ),
  },
  {
    name: "PostgreSQL",
    description: "Relational data modeling & performance",
    icon: (
      <div className="w-12 h-12 ">
        <StackIcon name="postgresql" />
      </div>
    ),
  },
  {
    name: "Tailwind CSS",
    description: "Utility-first styling for fast, consistent UI",
    icon: (
      <div className="w-12 h-12 ">
        <StackIcon name="tailwindcss" />
      </div>
    ),
  },
  {
    name: "AWS S3",
    description: "File storage, signed URLs, CDN-ready assets",
    icon: (
      <div className="w-12 h-12 ">
        <StackIcon name="aws" variant="dark" />
      </div>
    ),
  },
  {
    name: "CI / CD",
    description: "GitHub Actions, automated deployments",
    icon: (
      <div className="w-12 h-12  grayscale">
        <StackIcon name="github" variant="dark" />
      </div>
    ),
  },
];

const secondaryStacks: TechStack[] = [
  {
    name: "GraphQL",
    description: "Schemas, resolvers, API composition",
    icon: <span className="text-pink-500 font-bold">GQL</span>,
  },
  {
    name: "Prisma",
    description: "Schema design, migrations, typed queries",
    icon: <span className="text-slate-700 font-bold">PR</span>,
  },
  {
    name: "Supabase",
    description: "Auth, Postgres, storage, edge functions",
    icon: <span className="text-emerald-500 font-bold">SB</span>,
  },

  {
    name: "Turborepo",
    description: "Monorepo build orchestration and caching",
    icon: <span className="text-violet-600 font-bold">TR</span>,
  },
  {
    name: "Claude",
    description: "AI-assisted workflows for coding and content",
    icon: <span className="text-orange-500 font-bold">AI</span>,
  },
];

export default function Stack() {
  const { t } = useTranslation();

  return (
    <section className="py-16 md:py-24 px-4 bg-base-100">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-secondary">{t("Stack.titleProduction")}</span>{" "}
            <span className="text-base-content">
              {t("Stack.titleWebStack")}
            </span>
          </h2>
          <p className="text-base-content/70 text-lg md:text-xl max-w-3xl mx-auto">
            {t("Stack.subtitle")}
          </p>
        </div>

        {/* Primary stack */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {primaryStacks.map((stack) => (
            <div
              key={stack.name}
              className="bg-base-200 rounded-2xl p-6 flex flex-col items-center text-center shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="mb-4 flex items-center justify-center">
                {stack.icon}
              </div>
              <h3 className="font-bold text-lg mb-2">{stack.name}</h3>
              <p className="text-base-content/60 text-sm">
                {stack.description}
              </p>
            </div>
          ))}
        </div>

        {/* Secondary stack */}
        <div className="mt-14">
          <p className="text-sm uppercase tracking-wider text-base-content/50 mb-4 text-center">
            {t("Stack.alsoUsed")}
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {secondaryStacks.map((stack) => (
              <div
                key={stack.name}
                className="px-4 py-2 rounded-full bg-base-300 text-sm flex items-center gap-2"
              >
                {stack.icon}
                <span className="font-medium">{stack.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
