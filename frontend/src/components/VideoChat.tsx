"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  IconCamera,
  IconFlag,
  IconLock,
  IconMic,
  IconSend,
  IconSkip,
  IconStop,
} from "@/components/Icons";
import { disconnectSocket, getSocket } from "@/lib/socket";
import { siteConfig } from "@/lib/site";
import {
  GENDER_OPTIONS,
  INTEREST_OPTIONS,
  LOOKING_FOR_OPTIONS,
  REPORT_REASONS,
  type Gender,
  type MatchPrefs,
  type PrefGender,
  defaultPrefs,
  loadPrefs,
  prefsToSearchPayload,
  savePrefs,
} from "@/lib/prefs";

type Status =
  | "idle"
  | "connecting"
  | "searching"
  | "matched"
  | "disconnected"
  | "error"
  | "banned";

type Gate = "age" | "prefs" | "camera" | "live";

type ChatLine = { id: string; from: "me" | "partner"; text: string };

const iceServers: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-sm font-semibold transition ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)]/20 text-white"
          : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25"
      }`}
    >
      {children}
    </button>
  );
}

export function VideoChat() {
  const [gate, setGate] = useState<Gate>("age");
  const [status, setStatus] = useState<Status>("idle");
  const [statusMsg, setStatusMsg] = useState("Ready when you are.");
  const [partnerCountry, setPartnerCountry] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState("");
  const [camError, setCamError] = useState<string | null>(null);
  const [camLoading, setCamLoading] = useState(false);
  const [prefs, setPrefs] = useState<MatchPrefs>(defaultPrefs);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState<string>(REPORT_REASONS[0]);
  const [reportBusy, setReportBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const prefsRef = useRef<MatchPrefs>(defaultPrefs);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const partnerIdRef = useRef<string | null>(null);
  const makingOfferRef = useRef(false);
  const politeRef = useRef(false);

  useEffect(() => {
    const loaded = loadPrefs();
    setPrefs(loaded);
    prefsRef.current = loaded;
  }, []);

  const updatePrefs = (next: MatchPrefs) => {
    setPrefs(next);
    prefsRef.current = next;
    savePrefs(next);
  };

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
    setShowReport(false);
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
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (
        videoTrack?.readyState === "live" &&
        audioTrack?.readyState === "live"
      ) {
        videoTrack.enabled = true;
        audioTrack.enabled = true;
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
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];
    if (!videoTrack || !audioTrack) {
      stream.getTracks().forEach((t) => t.stop());
      throw new Error("Camera and microphone are required to use Camify.");
    }
    videoTrack.enabled = true;
    audioTrack.enabled = true;

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

  const emitSearch = useCallback(() => {
    getSocket().emit("start-search", prefsToSearchPayload(prefsRef.current));
  }, []);

  const enableCamera = async () => {
    setCamLoading(true);
    setCamError(null);
    try {
      await ensureLocalMedia();
      setGate("live");
    } catch {
      setCamError(
        "Camera + mic are compulsory. Allow both in browser settings, then retry."
      );
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
      emitSearch();
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
        setStatusMsg("Camera + mic required — enable both to keep chatting.");
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

    const onPartnerLeft = (payload?: { reason?: string }) => {
      cleanupPeer();
      setStatus("searching");
      setStatusMsg(payload?.reason || "Partner left. Finding someone new...");
      emitSearch();
    };

    const onReportResult = (payload: { success?: boolean; message?: string }) => {
      setReportBusy(false);
      setShowReport(false);
      setToast(payload.message || (payload.success ? "Report submitted." : "Report failed."));
      setTimeout(() => setToast(null), 3500);
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
    socket.on("report-result", onReportResult);
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
        setStatusMsg("Camera + mic are compulsory.");
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
      socket.off("report-result", onReportResult);
      socket.off("banned", onBanned);
      socket.off("server-full", onFull);
      socket.off("error", onError);
      socket.emit("stop-search");
      cleanupPeer();
      stopLocalMedia();
      disconnectSocket();
    };
  }, [gate, cleanupPeer, createPeer, emitSearch, ensureLocalMedia, stopLocalMedia]);

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

  const submitReport = () => {
    if (!partnerIdRef.current || reportBusy) return;
    setReportBusy(true);
    getSocket().emit("report-partner", { reason: reportReason });
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

  const toggleInterest = (interest: string) => {
    const has = prefs.interests.includes(interest);
    const interests = has
      ? prefs.interests.filter((i) => i !== interest)
      : prefs.interests.length >= 5
        ? prefs.interests
        : [...prefs.interests, interest];
    updatePrefs({ ...prefs, interests });
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
            18+ platform. Camera + mic compulsory — real talk only.
          </p>
          <button
            type="button"
            onClick={() => setGate("prefs")}
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

  if (gate === "prefs") {
    return (
      <main className="chat-shell flex min-h-dvh items-center justify-center px-5 py-10">
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Match prefs
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Filters apply for the first few seconds, then widen so you still get matches.
          </p>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">I am</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  active={prefs.gender === opt.value}
                  onClick={() => updatePrefs({ ...prefs, gender: opt.value as Gender })}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
              Looking for
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {LOOKING_FOR_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  active={prefs.lookingFor === opt.value}
                  onClick={() =>
                    updatePrefs({ ...prefs, lookingFor: opt.value as PrefGender })
                  }
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
              Interests (max 5)
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <Chip
                  key={interest}
                  active={prefs.interests.includes(interest)}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </Chip>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setGate("camera")}
            className="btn-primary mt-8 w-full"
          >
            Continue to camera
          </button>
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
                Camera + mic required
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                No cam-off. No mute. Enable both to enter the match queue.
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
                {camLoading ? "Requesting access..." : "Allow camera & mic"}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="chat-shell relative flex min-h-dvh flex-col">
      {toast && (
        <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-md border border-white/15 bg-black/80 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

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
              <p className="flex items-center gap-2 text-xs text-white/40">
                <span className="inline-flex items-center gap-1">
                  <IconCamera size={14} className="text-[var(--accent)]" />
                  Cam
                </span>
                <span className="inline-flex items-center gap-1">
                  <IconMic size={14} className="text-[var(--accent-2)]" />
                  Mic
                </span>
                live
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
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-md bg-black/55 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/80">
            <span className="inline-flex items-center gap-1">
              <IconCamera size={12} className="text-[var(--accent)]" />
              Cam
            </span>
            <span className="inline-flex items-center gap-1">
              <IconMic size={12} className="text-[var(--accent-2)]" />
              Mic
            </span>
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
          <span className="icon-btn cursor-default opacity-90">
            <IconCamera size={18} className="text-[var(--accent)]" />
            Cam locked
          </span>
          <span className="icon-btn cursor-default opacity-90">
            <IconMic size={18} className="text-[var(--accent-2)]" />
            Mic locked
          </span>
          <button
            type="button"
            disabled={status !== "matched"}
            onClick={() => setShowReport(true)}
            className="icon-btn disabled:opacity-40"
          >
            <IconFlag size={16} className="text-[var(--accent)]" />
            Report
          </button>
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

      {showReport && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 px-5">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0c1522] p-5">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              Report partner
            </h2>
            <p className="mt-2 text-sm text-white/55">
              Ends the chat and queues you with someone new.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {REPORT_REASONS.map((reason) => (
                <Chip
                  key={reason}
                  active={reportReason === reason}
                  onClick={() => setReportReason(reason)}
                >
                  {reason}
                </Chip>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowReport(false)}
                className="icon-btn flex-1"
                disabled={reportBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitReport}
                disabled={reportBusy}
                className="btn-primary flex-1 disabled:opacity-60"
              >
                <IconFlag size={16} />
                {reportBusy ? "Sending..." : "Submit report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
