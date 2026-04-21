export interface JobOpening {
  id: string;
  description: string;
}

export const JOB_OPENINGS: JobOpening[] = [
  { id: "HR-OPN-2025-0002", description: "Test Software Engineer" },
  { id: "HR-OPN-2025-0008", description: "Kognitos Software Engineer" },
  { id: "HR-OPN-2025-0010", description: "Director Of Engineering" },
  { id: "HR-OPN-2026-0002", description: "Applied ML Engineer" },
];

export const JOB_OPENING_TITLES: Record<string, string> = Object.fromEntries(
  JOB_OPENINGS.map((o) => [o.id, o.description]),
);
