// Home's tabs live in the address (?tab=), switched on the client: no server round trip, so the switch is instant, and
// the bottom nav, back button and a shared link all agree on which tab is showing.
export type HomeTab = "takes" | "rankings" | "dishes" | "places";
export const HOME_TABS: HomeTab[] = ["takes", "rankings", "dishes", "places"];

export const asHomeTab = (v: string | null | undefined): HomeTab => (HOME_TABS.includes(v as HomeTab) ? (v as HomeTab) : "takes");

export function showTab(tab: HomeTab) {
  const params = new URLSearchParams(window.location.search);
  if (tab === "takes") params.delete("tab");
  else params.set("tab", tab);
  const query = params.toString();
  window.history.pushState(null, "", query ? `/?${query}` : "/");
}
