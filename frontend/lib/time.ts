export const WORK_START_MIN = 9 * 60; // 09:00 in minutes-from-midnight
export const WORK_END_MIN = 18 * 60; // 18:00
export const WORK_DAY_MIN = WORK_END_MIN - WORK_START_MIN;

/** "HH:MM" or "HH:MM:SS" -> minutes since midnight */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** minutes since midnight -> "HH:MM" */
export function fromMinutes(mins: number): string {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Strip seconds for display: "09:00:00" -> "09:00" */
export function displayTime(hhmmss: string): string {
  return hhmmss.slice(0, 5);
}

/** Position/width as a percentage of the 09:00-18:00 working window, for
 * laying out a booking block on the timeline track. */
export function slotToPercent(startHHMM: string, endHHMM: string) {
  const start = Math.max(toMinutes(startHHMM), WORK_START_MIN);
  const end = Math.min(toMinutes(endHHMM), WORK_END_MIN);
  const left = ((start - WORK_START_MIN) / WORK_DAY_MIN) * 100;
  const width = ((end - start) / WORK_DAY_MIN) * 100;
  return { left: `${left}%`, width: `${Math.max(width, 0)}%` };
}

export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const d = now.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  const yy = date.getFullYear();
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
