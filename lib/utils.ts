export function seekAudio(time: number) {
  if (typeof window === "undefined") return;
  const a = (window as { __lpAudio?: { currentTime: number } }).__lpAudio;
  if (a) a.currentTime = time;
}
export function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
