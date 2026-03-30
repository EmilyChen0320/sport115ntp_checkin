import type { EventProgressView, EventStatView } from "../types/teamProgress";

export function pickTaiwanStat(stats: EventStatView[]): EventStatView | undefined {
  return stats.find(
    (s) =>
      s.areas.length === 22 ||
      (/22|全臺|臺灣|台灣/.test(s.eventName) && !/新北/.test(s.eventName)),
  );
}

export function pickNewTaipeiStat(stats: EventStatView[]): EventStatView | undefined {
  return stats.find((s) => s.areas.length === 29 || /新北|29|29區/.test(s.eventName));
}

export function pickTaiwanProgressEvent(progress: EventProgressView[]): EventProgressView | undefined {
  return progress.find(
    (p) =>
      p.totalAreas === 22 ||
      p.areas.length === 22 ||
      (/22|全臺|臺灣|台灣/.test(p.eventName) && !/新北/.test(p.eventName)),
  );
}

export function pickNewTaipeiProgressEvent(progress: EventProgressView[]): EventProgressView | undefined {
  return progress.find((p) => p.totalAreas === 29 || p.areas.length === 29 || /新北|29|29區/.test(p.eventName));
}
