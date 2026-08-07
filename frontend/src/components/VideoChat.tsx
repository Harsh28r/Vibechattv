"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  IconCamera,
  IconLock,
  IconMic,
  IconMicOff,
  IconSend,
  IconSkip,
  IconStop,
} from "@/components/Icons";
import { disconnectSocket, getSocket } from "@/lib/socket";
import { siteConfig } from "@/lib/site";

type Status =
  | "idle"
  | "connecting"
  | "searching"
  | "matched"
  | "disconnected"
  | "error"
  | "banned";

type Gate = "age" | "camera" | "live";

type ChatLine = { id: string; from: "me" | "partner"; text: string };

const iceServers: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function VideoChat() {
  const [gate, setGate] = useState<Gate>("age");
  const [status, setStatus] = useState<Status>("idle");
  const [statusMsg, setStatusMsg] = useState("Ready when you are.");
  const [partnerCountry, setPartnerCountry] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState("");
  const [muted, setMuted] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [camLoading, setCamLoading] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const partnerIdRef = useRef<string | null>(null);
  const makingOfferRef = useRef(false);
  const politeRef = useRef(false);

  const attachLocalPreview = useCallback((stream: MediaStream) => {
    [localVideoRef.current, previewVideoRef.current].forEach((el) => {
      if (!el) return;
      el.srcObject = stream;
      el.play().catch(() => undefined);
    });
  }, []);

  const cleanupPeer = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    partnerIdRef.current = null;
    makingOfferRef.current = false;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setPartnerCountry(null);
    setMessages([]);
  }, []);

  const stopLocalMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (previewVideoRef.current) previewVideoRef.current.srcObject = null;
  }, []);

  const ensureLocalMedia = useCallback(async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack && videoTrack.readyState === "live") {
        videoTrack.enabled = true;
        attachLocalPreview(localStreamRef.current);
        return localStreamRef.current;
      }
      stopLocalMedia();
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: true,
    });

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      stream.getTracks().forEach((t) => t.stop());
      throw new Error("Camera is required to use Camify.");
    }
    videoTrack.enabled = true;

    localStreamRef.current = stream;
    attachLocalPreview(stream);
    return stream;
  }, [attachLocalPreview, stopLocalMedia]);

  const createPeer = useCallback(
    async (partnerId: string, isInitiator: boolean) => {
      cleanupPeer();
      partnerIdRef.current = partnerId;
      politeRef.current = !isInitiator;

      const pc = new RTCPeerConnection({ iceServers });
      pcRef.current = pc;

      const stream = await ensureLocalMedia();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        const [remote] = event.streams;
        if (remoteVideoRef.current && remote) {
          remoteVideoRef.current.srcObject = remote;
          remoteVideoRef.current.play().catch(() => undefined);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && partnerIdRef.current) {
          getSocket().emit("ice-candidate", {
            candidate: event.candidate,
            to: partnerIdRef.current,
          });
        }
      };

      pc.onnegotiationneeded = async () => {
        try {
          makingOfferRef.current = true;
          await pc.setLocalDescription(await pc.createOffer());
          getSocket().emit("webrtc-offer", {
            offer: pc.localDescription,
            to: partnerId,
          });
        } catch (err) {
          console.error(err);
        } finally {
          makingOfferRef.current = false;
        }
      };

      void isInitiator;
    },
    [cleanupPeer, ensureLocalMedia]
  );

  const enableCamera = async () => {
    setCamLoading(true);
    setCamError(null);
    try {
      await ensureLocalMedia();
      setGate("live");
    } catch {
      setCamError("Camera access is compulsory. Allow camera + mic in browser settings, then retry.");
    } finally {
      setCamLoading(false);
    }
  };

  useEffect(() => {
    if (gate !== "live") return;

    const socket = getSocket();

    const onConnect = () => {
      setStatus("searching");
      setStatusMsg("Searching for someone...");
      socket.emit("start-search", {
        gender: "other",
        preferences: { gender: "any", country: "ANY" },
      });
    };

    const onSearching = (payload: { message?: string }) => {
      setStatus("searching");
      setStatusMsg(payload.message || "Searching...");
    };

    const onMatch = async (payload: {
      partnerId: string;
      partnerCountry?: string;
    }) => {
      setStatus("matched");
      setStatusMsg("Connected");
      setPartnerCountry(payload.partnerCountry || null);
      const isInitiator = socket.id! < payload.partnerId;
      try {
        await createPeer(payload.partnerId, isInitiator);
      } catch {
        setStatus("error");
        setStatusMsg("Camera required — enable it to keep chatting.");
        setGate("camera");
      }
    };

    const onOffer = async ({
      offer,
      from,
    }: {
      offer: RTCSessionDescriptionInit;
      from: string;
    }) => {
      const pc = pcRef.current;
      if (!pc || from !== partnerIdRef.current) {
        await createPeer(from, false);
      }
      const connection = pcRef.current;
      if (!connection) return;

      const offerCollision =
        makingOfferRef.current || connection.signalingState !== "stable";
      if (offerCollision && !politeRef.current) return;

      await connection.setRemoteDescription(offer);
      await connection.setLocalDescription(await connection.createAnswer());
      socket.emit("webrtc-answer", {
        answer: connection.localDescription,
        to: from,
      });
    };

    const onAnswer = async ({
      answer,
      from,
    }: {
      answer: RTCSessionDescriptionInit;
      from: string;
    }) => {
      if (from !== partnerIdRef.current || !pcRef.current) return;
      await pcRef.current.setRemoteDescription(answer);
    };

    const onIce = async ({
      candidate,
      from,
    }: {
      candidate: RTCIceCandidateInit;
      from: string;
    }) => {
      if (from !== partnerIdRef.current || !pcRef.current) return;
      try {
        await pcRef.current.addIceCandidate(candidate);
      } catch (err) {
        console.error(err);
      }
    };

    const onChat = ({ message }: { message: string }) => {
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-p`, from: "partner", text: message },
      ]);
    };

    const onPartnerLeft = () => {
      cleanupPeer();
      setStatus("searching");
      setStatusMsg("Partner left. Finding someone new...");
      socket.emit("start-search", {
        gender: "other",
        preferences: { gender: "any", country: "ANY" },
      });
    };

    const onBanned = (payload: { message?: string }) => {
      setStatus("banned");
      setStatusMsg(payload.message || "Account suspended.");
    };

    const onFull = (payload: { message?: string }) => {
      setStatus("error");
      setStatusMsg(payload.message || "Server full.");
    };

    const onError = (payload: { message?: string }) => {
      setStatus("error");
      setStatusMsg(payload.message || "Something went wrong.");
    };

    socket.on("connect", onConnect);
    socket.on("searching", onSearching);
    socket.on("match-found", onMatch);
    socket.on("webrtc-offer", onOffer);
    socket.on("webrtc-answer", onAnswer);
    socket.on("ice-candidate", onIce);
    socket.on("chat-message", onChat);
    socket.on("partner-disconnected", onPartnerLeft);
    socket.on("banned", onBanned);
    socket.on("server-full", onFull);
    socket.on("error", onError);

    setStatus("connecting");
    setStatusMsg("Connecting...");
    ensureLocalMedia()
      .then(() => {
        if (!socket.connected) socket.connect();
        else onConnect();
      })
      .catch(() => {
        setStatus("error");
        setStatusMsg("Camera is compulsory.");
        setGate("camera");
      });

    return () => {
      socket.off("connect", onConnect);
      socket.off("searching", onSearching);
      socket.off("match-found", onMatch);
      socket.off("webrtc-offer", onOffer);
      socket.off("webrtc-answer", onAnswer);
      socket.off("ice-candidate", onIce);
      socket.off("chat-message", onChat);
      socket.off("partner-disconnected", onPartnerLeft);
      socket.off("banned", onBanned);
      socket.off("server-full", onFull);
      socket.off("error", onError);
      socket.emit("stop-search");
      cleanupPeer();
      stopLocalMedia();
      disconnectSocket();
    };
  }, [gate, cleanupPeer, createPeer, ensureLocalMedia, stopLocalMedia]);

  const skip = () => {
    const socket = getSocket();
    cleanupPeer();
    setStatus("searching");
    setStatusMsg("Skipping...");
    socket.emit("skip-partner");
  };

  const stop = () => {
    getSocket().emit("stop-search");
    cleanupPeer();
    stopLocalMedia();
    disconnectSocket();
    setStatus("idle");
    setStatusMsg("Stopped.");
    setGate("age");
  };

  const sendMessage = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !partnerIdRef.current) return;
    getSocket().emit("chat-message", {
      message: text,
      to: partnerIdRef.current,
    });
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-m`, from: "me", text },
    ]);
    setDraft("");
  };

  const toggleMute = () => {
    const next = !muted;
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !next;
    });
    setMuted(next);
  };

  if (gate === "age") {
    return (
      <main className="chat-shell flex min-h-dvh items-center justify-center px-5">
        <div className="w-full max-w-md text-center">
          <Image
            src="/camify-icon.png"
            alt=""
            width={72}
            height={72}
            className="mx-auto rounded-2xl"
            priority
          />
          <Link
            href="/"
            className="mt-4 inline-block font-[family-name:var(--font-display)] text-3xl font-extrabold text-white"
          >
            {siteConfig.name}
          </Link>
          <p className="mt-5 text-lg text-white/75">
            18+ platform. Real faces only — camera is compulsory.
          </p>
          <button
            type="button"
            onClick={() => setGate("camera")}
            className="btn-primary mt-8 w-full"
          >
            <IconLock size={18} />
            I am 18+ — continue
          </button>
          <Link href="/" className="mt-4 inline-block text-sm text-white/45 hover:text-white">
            Back home
          </Link>
        </div>
      </main>
    );
  }

  if (gate === "camera") {
    return (
      <main className="chat-shell flex min-h-dvh items-center justify-center px-5">
        <div className="w-full max-w-lg">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="relative aspect-video bg-black/50">
              <video
                ref={previewVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover"
              />
              {!localStreamRef.current && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70">
                  <IconCamera size={42} className="text-[var(--accent)]" />
                  <p className="text-sm">Camera preview appears here</p>
                </div>
              )}
            </div>
            <div className="p-6 text-center">
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                Camera required
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                No cam-off mode. Enable your camera to enter the match queue.
              </p>
              {camError && (
                <p className="mt-3 text-sm text-[var(--accent)]">{camError}</p>
              )}
              <button
                type="button"
                onClick={enableCamera}
                disabled={camLoading}
                className="btn-primary mt-6 w-full disabled:opacity-60"
              >
                <IconCamera size={18} />
                {camLoading ? "Requesting camera..." : "Allow camera & enter"}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="chat-shell flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/camify-icon.png" alt="" width={28} height={28} className="rounded-md" />
          <span className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
            {siteConfig.name}
          </span>
        </Link>
        <div className="text-right text-sm">
          <p className="font-medium text-white/85">{statusMsg}</p>
          {partnerCountry && (
            <p className="text-white/40">Partner · {partnerCountry}</p>
          )}
        </div>
      </header>

      <div className="relative mx-auto grid w-full max-w-6xl flex-1 gap-3 px-3 pb-3 sm:grid-cols-[1fr_300px] sm:px-6 sm:pb-4">
        <div className="relative min-h-[52vh] overflow-hidden rounded-2xl border border-white/10 bg-black/50 sm:min-h-0">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
          {status !== "matched" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#070b14]/70">
              <div className="spin-ring size-14 rounded-full border border-dashed border-[var(--accent-2)]/50" />
              <p className="animate-fade-up text-lg text-white/80">{statusMsg}</p>
              <p className="flex items-center gap-1.5 text-xs text-white/40">
                <IconCamera size={14} className="text-[var(--accent)]" />
                Your camera is live
              </p>
            </div>
          )}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-3 right-3 h-32 w-24 rounded-xl object-cover ring-2 ring-[var(--accent)]/70 sm:h-40 sm:w-28"
          />
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/80">
            <IconCamera size={12} className="text-[var(--accent)]" />
            Cam on
          </span>
        </div>

        <aside className="flex min-h-[220px] flex-col rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/40">
            Text
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
            {messages.length === 0 && (
              <p className="text-white/35">Say something once you&apos;re matched.</p>
            )}
            {messages.map((m) => (
              <p
                key={m.id}
                className={
                  m.from === "me"
                    ? "ml-6 rounded-lg bg-[var(--accent)]/20 px-2.5 py-1.5 text-right text-[#ffc3af]"
                    : "mr-6 rounded-lg bg-white/5 px-2.5 py-1.5 text-white/85"
                }
              >
                {m.text}
              </p>
            ))}
          </div>
          <form onSubmit={sendMessage} className="flex gap-2 border-t border-white/10 p-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message..."
              disabled={status !== "matched"}
              className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--accent-2)]"
            />
            <button
              type="submit"
              disabled={status !== "matched"}
              className="icon-btn !px-3 disabled:opacity-40"
              aria-label="Send"
            >
              <IconSend size={18} />
            </button>
          </form>
        </aside>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-2 px-3 pb-6 sm:justify-between sm:px-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="icon-btn"
            data-active={muted}
          >
            {muted ? <IconMicOff size={18} /> : <IconMic size={18} />}
            {muted ? "Unmute" : "Mute"}
          </button>
          <span className="icon-btn cursor-default opacity-90" title="Camera is compulsory">
            <IconCamera size={18} className="text-[var(--accent)]" />
            Camera locked on
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={skip} className="btn-primary !py-2.5">
            <IconSkip size={18} />
            Next
          </button>
          <button type="button" onClick={stop} className="icon-btn">
            <IconStop size={16} />
            Stop
          </button>
        </div>
      </div>
    </main>
  );
}
