import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} — Free random video chat`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(145deg, #0c1522 0%, #163447 50%, #1fa7a0 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 800 }}>{siteConfig.name}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 48, fontWeight: 700 }}>Talk to strangers. Instantly.</div>
          <div style={{ fontSize: 28, opacity: 0.8 }}>
            Free random video chat · Omegle alternative
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
