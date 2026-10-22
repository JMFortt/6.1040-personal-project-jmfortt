// Times are plain wall-clock hours: a week starts at Monday 00:00 "UTC" and every time is read
// back in UTC, so nothing ever shifts with the viewer's time zone.

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// the current time in the same wall-clock form as shift times: your local time, written as if it
// were UTC, so "3 PM here" compares equal to a shift stored as 3 PM
export function nowWallClock() {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000).toISOString();
}

// does a week starting at weekStart contain the wall-clock time `at`?
export function weekContains(weekStart: string, at: string) {
    const start = new Date(weekStart).getTime();
    const time = new Date(at).getTime();
    return start <= time && time < start + 7 * DAY_MS;
}

// 0 -> "12 AM", 15 -> "3 PM", 24 -> "12 AM"
export function hourLabel(hour: number) {
    const shown = hour % 12 === 0 ? 12 : hour % 12;
    return `${shown} ${hour % 24 < 12 ? "AM" : "PM"}`;
}

// a date picked in a week ("2026-10-21") -> that week's Monday at 00:00
export function mondayOf(date: string) {
    const picked = new Date(`${date}T00:00:00.000Z`);
    const daysSinceMonday = (picked.getUTCDay() + 6) % 7;
    return new Date(picked.getTime() - daysSinceMonday * DAY_MS).toISOString();
}

// a shift's start and end -> which day of its week, and which hours
export function dayAndHours(start: string, end: string) {
    const from = new Date(start);
    const startHour = from.getUTCHours();
    return {
        day: (from.getUTCDay() + 6) % 7,
        startHour,
        endHour: startHour + (new Date(end).getTime() - from.getTime()) / HOUR_MS,
    };
}

// a day and hour in the week starting at weekStart -> an ISO time
export function timeIn(weekStart: string, day: number, hour: number) {
    return new Date(new Date(weekStart).getTime() + day * DAY_MS + hour * HOUR_MS).toISOString();
}

// a shift's hours, like "3 PM–5 PM"
export function hoursLabel(start: string, end: string) {
    const { startHour, endHour } = dayAndHours(start, end);
    return `${hourLabel(startHour)}–${hourLabel(endHour)}`;
}

// "Mon, Oct 19"
export function dateLabel(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" });
}

// the grid's column headings for a published week: "Mon 10/19", "Tue 10/20", ...
export function weekDayLabels(weekStart: string) {
    return DAYS.map((day, i) => {
        const date = new Date(new Date(weekStart).getTime() + i * DAY_MS);
        return `${day} ${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
    });
}
