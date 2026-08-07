import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 24, className, ...props }: IconProps) {
  return { width: size, height: size, className, ...props };
}

export function IconCamera(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...base(props)}>
      <path d="M3.5 8.5h3l1.4-2.2h5.2L14.5 8.5H20.5A1.5 1.5 0 0 1 22 10v8a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18v-8a1.5 1.5 0 0 1 1.5-1.5Z" />
      <circle cx="12" cy="14" r="3.2" />
    </svg>
  );
}

export function IconMic(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...base(props)}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

export function IconMicOff(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...base(props)}>
      <path d="M9 9v2a3 3 0 0 0 5.1 2.1M15 8.5V7a3 3 0 0 0-5.2-2" />
      <path d="M5 11a7 7 0 0 0 11.4 5.4M19 11a6.8 6.8 0 0 0-.4-2.3M12 18v3M3 3l18 18" />
    </svg>
  );
}

export function IconSkip(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...base(props)}>
      <path d="M5 5l9 7-9 7V5Z" />
      <path d="M19 5v14" />
    </svg>
  );
}

export function IconStop(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...base(props)}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

export function IconSend(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...base(props)}>
      <path d="M4 12l15-7-4 16-4-6-7-3Z" />
    </svg>
  );
}

export function IconBolt(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...base(props)}>
      <path d="M13 2 4 14h7l-1 8 10-13h-7l0-7Z" />
    </svg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...base(props)}>
      <path d="M12 3 4.5 6v5c0 5 3.2 8.4 7.5 10 4.3-1.6 7.5-5 7.5-10V6L12 3Z" />
    </svg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...base(props)}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5S14 16 14.5 19M14 14.6c1.5-.5 3.2-.3 4.5 1.1.8.9 1.2 2 1.4 3.3" />
    </svg>
  );
}

export function IconLock(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...base(props)}>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function IconFlag(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...base(props)}>
      <path d="M5 21V4M5 4h10l-1.5 3.5L15 11H5" />
    </svg>
  );
}
