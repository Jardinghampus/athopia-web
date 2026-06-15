/** Gemensam URL-param-serialisering för nyheter-filter (server + client delar logik). */

export interface NewsFilterState {
  visa: "all" | "ai" | "source";
  teams: string[];
  sources: string[];
  events: string[];
}

export const DEFAULT_NEWS_FILTER: NewsFilterState = {
  visa: "all",
  teams: [],
  sources: [],
  events: [],
};

export function filterStateToParams(state: NewsFilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (state.visa !== "all") p.set("visa", state.visa);
  if (state.teams.length) p.set("lag", state.teams.join(","));
  if (state.sources.length) p.set("kalla", state.sources.join(","));
  if (state.events.length) p.set("event", state.events.join(","));
  return p;
}

export function paramsToFilterState(sp: URLSearchParams): NewsFilterState {
  return {
    visa: (sp.get("visa") as NewsFilterState["visa"]) ?? "all",
    teams: sp.get("lag")?.split(",").filter(Boolean) ?? [],
    sources: sp.get("kalla")?.split(",").filter(Boolean) ?? [],
    events: sp.get("event")?.split(",").filter(Boolean) ?? [],
  };
}

export function isDefaultFilter(state: NewsFilterState): boolean {
  return (
    state.visa === "all" &&
    state.teams.length === 0 &&
    state.sources.length === 0 &&
    state.events.length === 0
  );
}
