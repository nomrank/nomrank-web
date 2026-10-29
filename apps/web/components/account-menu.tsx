"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { signOut } from "@/app/actions";

type Props = { handle: string; name: string | null; avatar: string | null; photo: string | null };

// Your avatar in the header opens this: your profile (edit lives there), settings, sign out.
// Closes on Escape (focus back on the avatar), on a click outside, and after choosing an item.
export function AccountMenu({ handle, name, avatar, photo }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none";

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-label="Your account"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid size-10 place-items-center overflow-hidden rounded-full border border-hairline bg-raised transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95"
      >
        <Avatar handle={handle} code={avatar} photo={photo} size={photo ? 40 : 34} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute top-12 right-0 z-50 w-60 origin-top-right animate-[rise-in_160ms_var(--ease-out)] rounded-xl border border-hairline bg-paper p-1.5 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.7)]"
        >
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar handle={handle} code={avatar} photo={photo} size={32} />
            <div className="min-w-0">
              {name && <p className="truncate text-sm font-semibold">{name}</p>}
              <p className="truncate text-sm text-muted-foreground">@{handle}</p>
            </div>
          </div>
          <div className="my-1 h-px bg-hairline" />
          <Link role="menuitem" href={`/u/${handle}`} onClick={() => setOpen(false)} className={item}>
            <UserIcon aria-hidden className="size-4 text-muted-foreground" />
            Your profile
          </Link>
          <Link role="menuitem" href="/settings" onClick={() => setOpen(false)} className={item}>
            <SettingsIcon aria-hidden className="size-4 text-muted-foreground" />
            Settings
          </Link>
          <div className="my-1 h-px bg-hairline" />
          <form action={signOut}>
            <button role="menuitem" type="submit" className={item}>
              <LogOutIcon aria-hidden className="size-4 text-muted-foreground" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
