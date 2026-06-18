/**
 * Status values from the complaint_status enum that map to Kanban columns.
 * "submitted" + "under_review" → Open column
 * "assigned" + "in_progress"   → In Progress column
 * "resolved"                    → Resolved column
 */
export type KanbanStatus =
  | "submitted"
  | "under_review"
  | "assigned"
  | "in_progress"
  | "pending_closure"
  | "resolved"
  | "rejected"
  | "escalated"
  | "reopened"
  | "spam";

/** Complaint record shape from the `complaints` table. */
export interface Complaint {
  id: string;
  ticket_id: string;
  title: string;
  description: string;
  status: KanbanStatus;
  severity: "L1" | "L2" | "L3" | "L4";
  created_at: string;
  address_text: string | null;
  ward_name: string | null;
  assigned_department: string | null;
  assigned_officer_id: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
}

/** The three Kanban column identifiers. */
export type ColumnId = "open" | "in_progress" | "resolved";

/** Visual metadata for each column. */
export interface ColumnMeta {
  title: string;
  borderColor: string;   // hex colour for the left accent
  dotColor: string;       // tailwind bg-* class for the header dot
}

/** Column configuration lookup. */
export const COLUMN_META: Record<ColumnId, ColumnMeta> = {
  open: {
    title: "Open",
    borderColor: "#fbbf24",   // amber-400
    dotColor: "bg-amber-400",
  },
  in_progress: {
    title: "In Progress",
    borderColor: "#60a5fa",   // blue-400
    dotColor: "bg-blue-400",
  },
  resolved: {
    title: "Resolved",
    borderColor: "#34d399",   // emerald-400
    dotColor: "bg-emerald-400",
  },
};

/**
 * Map a complaint_status enum value to a Kanban column.
 */
export function statusToColumn(status: KanbanStatus): ColumnId {
  switch (status) {
    case "submitted":
    case "under_review":
    case "escalated":
    case "reopened":
      return "open";
    case "assigned":
    case "in_progress":
    case "pending_closure":
      return "in_progress";
    case "resolved":
    case "rejected":
    case "spam":
      return "resolved";
    default:
      return "open";
  }
}
