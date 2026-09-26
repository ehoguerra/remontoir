"use client";

import { useAnnouncer } from "@/lib/announce";

export function Announcer() {
  const message = useAnnouncer((s) => s.message);
  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}
