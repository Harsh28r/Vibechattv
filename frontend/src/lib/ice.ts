import { siteConfig } from "./site";

const FALLBACK_ICE: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

let cached: RTCIceServer[] | null = null;

export async function getIceServers(): Promise<RTCIceServer[]> {
  if (cached) return cached;

  const fromEnv: RTCIceServer[] = [...FALLBACK_ICE];
  const turnUrl = process.env.NEXT_PUBLIC_TURN_URLS;
  const turnUser = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnPass = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;
  if (turnUrl && turnUser && turnPass) {
    fromEnv.push({
      urls: turnUrl.split(",").map((u) => u.trim()).filter(Boolean),
      username: turnUser,
      credential: turnPass,
    });
  }

  try {
    const res = await fetch(`${siteConfig.apiUrl}/api/ice`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.iceServers) && data.iceServers.length) {
        cached = data.iceServers as RTCIceServer[];
        return cached;
      }
    }
  } catch {
    // fall through
  }

  cached = fromEnv;
  return cached;
}
