"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
};

const signedInItems: NavItem[] = [
  { href: "/discover", label: "Discover", shortLabel: "Meet" },
  { href: "/requests", label: "Needs" },
  { href: "/connections", label: "Connections", shortLabel: "Connect" },
  { href: "/chat", label: "Chat" },
  { href: "/search", label: "Search" },
  { href: "/settings", label: "Settings" },
];

const publicItems: NavItem[] = [
  { href: "/login", label: "Log in" },
  { href: "/signup", label: "Join" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

export function DesktopNavLinks({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const items = signedIn ? signedInItems : publicItems;

  return (
    <div className="hidden items-center gap-1 rounded-full border border-zinc-200 bg-white/75 p-1 text-sm font-bold text-zinc-600 shadow-sm md:flex">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const join = item.href === "/signup";

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-3 py-2 ${
              active || join
                ? "bg-zinc-950 text-white shadow-sm"
                : "hover:bg-zinc-100 hover:text-zinc-950"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function MobileBottomNavLinks() {
  const pathname = usePathname();
  const items = signedInItems.filter((item) => item.href !== "/settings");

  return (
    <div className="mx-auto grid max-w-md grid-cols-5 rounded-2xl border border-zinc-200 bg-white/95 p-1 text-center text-[11px] font-black text-zinc-600 shadow-[0_16px_50px_rgba(15,23,42,0.16)] backdrop-blur-xl">
      {items.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-xl px-1 py-3 ${
              active
                ? "bg-zinc-950 text-white shadow-sm"
                : "hover:bg-zinc-100 hover:text-zinc-950"
            }`}
          >
            {item.shortLabel ?? item.label}
          </Link>
        );
      })}
    </div>
  );
}
