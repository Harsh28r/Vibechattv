import type { Metadata } from "next";
import { Suspense } from "react";
import { VideoChat } from "@/components/VideoChat";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Live Chat",
  description: `Start a live random video chat session on ${siteConfig.name}.`,
  robots: { index: false, follow: true },
  alternates: { canonical: "/chat" },
};

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <main className="chat-shell flex min-h-dvh items-center justify-center text-white/70">
          Loading chat...
        </main>
      }
    >
      <VideoChat />
    </Suspense>
  );
}
