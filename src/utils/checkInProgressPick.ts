import type { EventProgressView, EventStatView } from "../types/teamProgress";

export function pickTaiwanStat(stats: EventStatView[]): EventStatView | undefined {
  return (
    stats.find((s) => s.areas.length === 22) ??
    stats.find((s) => /全臺|臺灣|台灣/.test(s.eventName) && !/新北/.test(s.eventName))
  );
}

export function pickNewTaipeiStat(stats: EventStatView[]): EventStatView | undefined {
  return (
    stats.find((s) => s.areas.length === 29) ??
    stats.find((s) => /新北/.test(s.eventName))
  );
}

export function pickTaiwanProgressEvent(progress: EventProgressView[]): EventProgressView | undefined {
  return (
    progress.find((p) => p.totalAreas === 22) ??
    progress.find((p) => p.areas.length === 22) ??
    progress.find((p) => /全臺|臺灣|台灣/.test(p.eventName) && !/新北/.test(p.eventName))
  );
}

export function pickNewTaipeiProgressEvent(progress: EventProgressView[]): EventProgressView | undefined {
  return (
    progress.find((p) => p.totalAreas === 29) ??
    progress.find((p) => p.areas.length === 29) ??
    progress.find((p) => /新北/.test(p.eventName))
  );
}
