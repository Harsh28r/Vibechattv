"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/site";

export function OnlineCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch(`${siteConfig.apiUrl}/api/stats`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (alive) {
          setCount(
            (data.activeConnections ?? 0) + (data.waitingUsers ?? 0) * 2
          );
        }
      } catch {
        if (alive) setCount(null);
      }
    }

    load();
    const id = setInterval(load, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (count === null) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
        <span className="pulse-dot size-2 rounded-full bg-[var(--accent-2)]" />
        Live matching online
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
      <span className="pulse-dot size-2 rounded-full bg-[var(--accent-2)]" />
      {count.toLocaleString()}+ online now
    </span>
  );
}
