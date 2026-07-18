"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpenCheck, History, LayoutDashboard, Network } from "lucide-react";
import AuthControls from "@/components/common/AuthControls";
import { APP_NAME } from "@/constants/app";

const navigation = [
  { href: "#overview", label: "Overview", icon: LayoutDashboard },
  { href: "#mastery-graph", label: "Mastery map", icon: Network },
  { href: "#practice", label: "Practice", icon: BookOpenCheck },
  { href: "#saved-sessions", label: "Sessions", icon: History },
];

const DashboardSidebar = () => {
  const [activeHref, setActiveHref] = useState("#overview");

  return (
    <aside className="border bg-background shadow-xl sticky top-4 lg:top-6 lg:flex lg:h-[calc(100dvh-3rem)] lg:w-64 lg:shrink-0 lg:flex-col z-100">
      <div className="flex items-center justify-between gap-4 border-b px-4 py-4 lg:px-5">
        <Link className="flex min-w-0 items-center gap-3" href="/dashboard">
          <Image
            alt={`${APP_NAME} logo`}
            className="size-8"
            height={32}
            src="/logo.svg"
            width={32}
          />
          <span className="truncate font-secondary text-xl font-medium">{APP_NAME}</span>
        </Link>
        <div className="lg:hidden">
          <AuthControls isAuthenticated />
        </div>
      </div>

      <nav aria-label="Dashboard navigation" className="overflow-x-auto lg:flex-1">
        <ul className="flex min-w-max p-2 lg:min-w-0 lg:flex-col lg:gap-1 lg:p-3">
          {navigation.map(({ href, icon: Icon, label }) => {
            const isActive = activeHref === href;

            return (
              <li key={href}>
                <Link
                  aria-current={isActive ? "location" : undefined}
                  className={
                    isActive
                      ? "flex items-center gap-3 border-l-2 border-emerald-500 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      : "flex items-center gap-3 border-l-2 border-transparent px-3 py-2.5 text-sm text-foreground/65 outline-none hover:bg-emerald-50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-emerald-500"
                  }
                  href={href}
                  onClick={() => setActiveHref(href)}
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.8} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="hidden border-t p-3 lg:block [&_button]:w-full [&_button]:justify-center">
        <AuthControls isAuthenticated />
      </div>
    </aside>
  );
};

export default DashboardSidebar;