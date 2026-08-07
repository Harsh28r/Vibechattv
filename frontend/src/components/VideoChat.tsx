"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
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

type ChatLine = { id: string; from: "me" | "partner"; text: string };

const iceServers: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function VideoChat() {
  const [status, setStatus] = useState<Status>("idle");
  const [statusMsg, setStatusMsg] = useState("Ready when you are.");
  const [partnerCountry, setPartnerCountry] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState("");
  const [ageOk, setAgeOk] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const partnerIdRef = useRef<string | null>(null);
  const makingOfferRef = useRef(false);
  const politeRef = useRef(false);

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
  }, []);

  const ensureLocalMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: true,
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      await localVideoRef.current.play().catch(() => undefined);
    }
    return stream;
  }, []);

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

      if (isInitiator) {
        // negotiationneeded will fire after tracks are added
      }
    },
    [cleanupPeer, ensureLocalMedia]
  );

  useEffect(() => {
    if (!ageOk) return;

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
      } catch (err) {
        console.error(err);
        setStatus("error");
        setStatusMsg("Camera/mic permission required.");
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
      .then(() => socket.connect())
      .catch(() => {
        setStatus("error");
        setStatusMsg("Allow camera & mic to chat.");
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
  }, [ageOk, cleanupPeer, createPeer, ensureLocalMedia, stopLocalMedia]);

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
    setAgeOk(false);
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

  const toggleCam = () => {
    const next = !camOff;
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !next;
    });
    setCamOff(next);
  };

  if (!ageOk) {
    return (
      <main className="chat-shell flex min-h-dvh items-center justify-center px-5">
        <div className="w-full max-w-md text-center">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-white"
          >
            {siteConfig.name}
          </Link>
          <p className="mt-6 text-lg text-white/80">
            You must be 18 or older to use random video chat.
          </p>
          <button
            type="button"
            onClick={() => setAgeOk(true)}
            className="mt-8 w-full rounded-md bg-[var(--accent)] px-6 py-3.5 font-semibold text-white hover:brightness-110"
          >
            I am 18+ — start
          </button>
          <Link href="/" className="mt-4 inline-block text-sm text-white/50 hover:text-white">
            Back home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="chat-shell flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-bold text-white"
        >
          {siteConfig.name}
        </Link>
        <div className="text-right text-sm text-white/70">
          <p>{statusMsg}</p>
          {partnerCountry && <p className="text-white/45">Partner · {partnerCountry}</p>}
        </div>
      </header>

      <div className="relative mx-auto grid w-full max-w-6xl flex-1 gap-3 px-3 pb-3 sm:grid-cols-[1fr_320px] sm:px-6 sm:pb-6">
        <div className="relative min-h-[50vh] overflow-hidden rounded-2xl bg-black/40 sm:min-h-0">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
          {status !== "matched" && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-deep)]/60">
              <p className="animate-fade-up text-lg text-white/80">{statusMsg}</p>
            </div>
          )}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-3 right-3 h-28 w-20 rounded-lg object-cover ring-1 ring-white/20 sm:h-36 sm:w-28"
          />
        </div>

        <aside className="flex min-h-[220px] flex-col rounded-2xl border border-white/10 bg-white/5">
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
            {messages.length === 0 && (
              <p className="text-white/40">Messages appear here once matched.</p>
            )}
            {messages.map((m) => (
              <p
                key={m.id}
                className={
                  m.from === "me" ? "text-right text-[var(--accent-2)]" : "text-white/85"
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
              placeholder="Say something..."
              disabled={status !== "matched"}
              className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--accent-2)]"
            />
            <button
              type="submit"
              disabled={status !== "matched"}
              className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </aside>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-2 px-3 pb-6 sm:justify-between sm:px-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="rounded-md border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            {muted ? "Unmute" : "Mute"}
          </button>
          <button
            type="button"
            onClick={toggleCam}
            className="rounded-md border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            {camOff ? "Cam on" : "Cam off"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={skip}
            className="rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110"
          >
            Next
          </button>
          <button
            type="button"
            onClick={stop}
            className="rounded-md border border-white/20 px-5 py-2.5 text-sm text-white/80 hover:bg-white/10"
          >
            Stop
          </button>
        </div>
      </div>
    </main>
  );
}
