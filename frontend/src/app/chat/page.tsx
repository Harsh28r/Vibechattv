import type { Metadata } from "next";
import { VideoChat } from "@/components/VideoChat";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Live Chat",
  description: `Start a live random video chat session on ${siteConfig.name}.`,
  robots: { index: false, follow: true },
  alternates: { canonical: "/chat" },
};

export default function ChatPage() {
  return <VideoChat />;
}
