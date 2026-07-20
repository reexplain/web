"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpenCheck, History, LayoutDashboard, Network } from "lucide-react";
import AuthControls from "@/components/common/AuthControls";
import ThemeToggle from "@/components/common/ThemeToggle";
import { APP_NAME } from "@/constants/app";
import type { DashboardSidebarProps } from "@/types/dashboard";

const navigation = [
  { href: "#overview", label: "Overview", icon: LayoutDashboard },
  { href: "#mastery-graph", label: "Mastery map", icon: Network },
  { href: "#practice", label: "Practice", icon: BookOpenCheck },
  { href: "#saved-sessions", label: "Sessions", icon: History },
];

const userInitials = (name: string, email: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 0) {
    return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }
  return email.slice(0, 1).toUpperCase();
};

const DashboardSidebar = ({ user }: DashboardSidebarProps) => {
  const [activeHref, setActiveHref] = useState("#overview");
  const [imageFailed, setImageFailed] = useState(false);
  const showProfileImage = Boolean(user.image) && !imageFailed;

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
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-50 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            {showProfileImage ? (
              <Image
                alt={`${user.name} profile photo`}
                className="size-full object-cover"
                height={32}
                onError={() => setImageFailed(true)}
                src={user.image!}
                width={32}
              />
            ) : (
              <span aria-label={`${user.name} profile initials`} role="img">
                {userInitials(user.name, user.email)}
              </span>
            )}
          </span>
          <AuthControls iconOnly isAuthenticated />
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
                      ? "flex items-center gap-3 border-l-2 border-emerald-500 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:bg-emerald-950/50"
                      : "flex items-center gap-3 border-l-2 border-transparent px-3 py-2.5 text-sm text-foreground/65 outline-none hover:bg-emerald-50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-emerald-950/50"
                  }
                  href={href}
                  onClick={(event) => {
                    setActiveHref(href);
                    if (href === "#overview") {
                      event.preventDefault();
                      window.history.replaceState(null, "", href);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.8} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="hidden flex-col border-t lg:flex">
        <div className="flex min-w-0 items-center gap-3 border-b p-4">
          <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-50 text-sm font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            {showProfileImage ? (
              <Image
                alt={`${user.name} profile photo`}
                className="size-full object-cover"
                height={40}
                onError={() => setImageFailed(true)}
                src={user.image!}
                width={40}
              />
            ) : (
              <span aria-label={`${user.name} profile initials`} role="img">
                {userInitials(user.name, user.email)}
              </span>
            )}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-foreground/50" title={user.email}>
              {user.email}
            </p>
          </div>
        </div>
        <div className="flex gap-2 p-3">
          <ThemeToggle />
          <div className="flex-1 [&_button]:w-full [&_button]:justify-center">
            <AuthControls isAuthenticated />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
