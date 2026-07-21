export type HistoryEntry = {
  id: string;
  timestamp: number;
  cropPct: number;
  weedPct: number;
  soilPct: number;
  dose: number;
  saved: number;
  onCount: number;
};

const isBrowser = typeof window !== "undefined";

function key(email: string) {
  return `gs_history_${email}`;
}

export function getHistory(email: string): HistoryEntry[] {
  if (!isBrowser) return [];
  const raw = localStorage.getItem(key(email));
  return raw ? JSON.parse(raw) : [];
}

export function addEntry(email: string, entry: HistoryEntry) {
  if (!isBrowser) return;
  const history = getHistory(email);
  history.unshift(entry);
  localStorage.setItem(key(email), JSON.stringify(history.slice(0, 10)));
}

export function clearHistory(email: string) {
  if (!isBrowser) return;
  localStorage.removeItem(key(email));
}
