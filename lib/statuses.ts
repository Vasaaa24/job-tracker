export type Comment = { id: string; text: string; ts: number };

export type Group = "top" | "basic";

export type Job = {
  id: string;
  title: string;
  company: string;
  link: string;
  note: string;
  status: string;
  group: Group;
  comments: Comment[];
  created: number;
};

export const STATUSES = [
  { id: "todo", label: "Poslat CV", color: "#8b90a0" },
  { id: "sent", label: "CV odesláno", color: "#56b3ff" },
  { id: "waiting", label: "Čekám na odpověď", color: "#ffb020" },
  { id: "replied", label: "Odpověděli", color: "#7c5cff" },
  { id: "interview", label: "Pohovor domluven", color: "#4f8cff" },
  { id: "waiting_int", label: "Čekám na odpověď po pohovoru", color: "#ff8c42" },
  { id: "offer", label: "Nabídka", color: "#3fd68b" },
  { id: "rejected", label: "Zamítnuto", color: "#ff6b81" },
] as const;

export const statusById = (id: string) =>
  STATUSES.find((s) => s.id === id) || STATUSES[0];
