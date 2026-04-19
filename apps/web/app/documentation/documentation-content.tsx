import type { ReactNode } from "react";
import styles from "./documentation.module.css";

export interface DocumentationSection {
  id: string;
  label: string;
  title: string;
  summary: string;
  content: ReactNode;
}

const apiRows: Array<{ endpoint: string; method: string; purpose: string }> = [
  { endpoint: "/analyze", method: "POST", purpose: "AI-assisted complaint analysis and routing preview" },
  { endpoint: "/confirm", method: "POST", purpose: "Complaint creation, dedup checks, and notifications" },
  { endpoint: "/api/authority/assign", method: "PATCH", purpose: "Race-safe worker assignment using DB locks" },
  { endpoint: "/api/worker/dashboard", method: "GET", purpose: "Worker tasks, SLA priorities, and profile context" },
  { endpoint: "/api/admin/complaints", method: "GET", purpose: "Admin consolidated complaints dataset" },
  { endpoint: "/api/stt", method: "POST", purpose: "Speech to text proxy for multilingual voice intake" },
  { endpoint: "/whatsapp/webhook", method: "GET/POST", purpose: "WhatsApp verification and conversational intake" },
  { endpoint: "/cctv/analyze_live", method: "POST", purpose: "CCTV burst analysis with reliability checks" },
];

const rpcRows: Array<{ name: string; purpose: string }> = [
  { name: "check_for_duplicate_report", purpose: "20m duplicate detection before complaint creation" },
  { name: "assign_worker_to_complaint", purpose: "Atomic assignment with FOR UPDATE locking" },
  { name: "increment_upvote_count", purpose: "Upvote + severity recalculation in one transaction" },
  { name: "check_sla_breaches", purpose: "Auto-escalation for overdue complaints" },
  { name: "update_complaint_status_citizen", purpose: "Citizen close/reopen confirmation path" },
];

export const documentationSections: DocumentationSection[] = [
  {
    id: "snapshot",
    label: "01",
    title: "Executive Snapshot",
    summary:
      "A quick technical and product overview of what the platform guarantees in production.",
    content: (
      <>
        <div className={styles.metricsGrid}>
          <article className={styles.metricCard}>
            <p className={styles.metricLabel}>Problem Space</p>
            <p className={styles.metricValue}>Civic resolution</p>
            <p className={styles.metricSub}>Public complaint lifecycle with accountability.</p>
          </article>
          <article className={styles.metricCard}>
            <p className={styles.metricLabel}>Role Portals</p>
            <p className={styles.metricValue}>4</p>
            <p className={styles.metricSub}>Citizen, Authority, Worker, Admin.</p>
          </article>
          <article className={styles.metricCard}>
            <p className={styles.metricLabel}>Database Controls</p>
            <p className={styles.metricValue}>RLS + Triggers</p>
            <p className={styles.metricSub}>Data isolation and state safety enforced at DB layer.</p>
          </article>
          <article className={styles.metricCard}>
            <p className={styles.metricLabel}>Primary Goal</p>
            <p className={styles.metricValue}>Faster closure</p>
            <p className={styles.metricSub}>Transparent progress from report to proof and feedback.</p>
          </article>
        </div>
        <div className={styles.callout}>
          Core design principle: rules that matter are enforced structurally in the backend and database,
          not only in frontend forms.
        </div>
      </>
    ),
  },
  {
    id: "problem",
    label: "02",
    title: "Problem Definition",
    summary:
      "The platform targets fragmented complaint systems, low transparency, and weak operational closure loops.",
    content: (
      <div className={styles.prose}>
        <p>
          Traditional civic systems often fail because reporting, assignment, field execution, and closure are
          disconnected. Citizens struggle to know where a complaint is, authorities get noisy duplicate records,
          and field teams do not always receive enough spatial context.
        </p>
        <p>
          JanSamadhan addresses this by combining AI-assisted intake, location precision, role-scoped workflows,
          and audit-safe status transitions into one operational lifecycle.
        </p>
      </div>
    ),
  },
  {
    id: "solution",
    label: "03",
    title: "Platform Solution",
    summary:
      "Each role receives a focused interface while a shared system enforces consistent data, status, and audit behavior.",
    content: (
      <div className={styles.roleGrid}>
        <article className={styles.roleCard}>
          <h3 className={styles.roleTitle}>Citizen</h3>
          <p className={styles.roleText}>Report via text, voice, or photo, track updates, confirm closure.</p>
        </article>
        <article className={styles.roleCard}>
          <h3 className={styles.roleTitle}>Authority</h3>
          <p className={styles.roleText}>Department-scoped triage, assignment, escalation, and monitoring.</p>
        </article>
        <article className={styles.roleCard}>
          <h3 className={styles.roleTitle}>Worker</h3>
          <p className={styles.roleText}>Field-first task execution with location precision and proof submission.</p>
        </article>
        <article className={styles.roleCard}>
          <h3 className={styles.roleTitle}>Admin</h3>
          <p className={styles.roleText}>Cross-system governance, moderation, surveillance, and analytics.</p>
        </article>
      </div>
    ),
  },
  {
    id: "lifecycle",
    label: "04",
    title: "End-to-End Lifecycle",
    summary:
      "A complaint transitions through deterministic stages from intake to validated closure.",
    content: (
      <ol className={styles.flowList}>
        <li>Citizen submits complaint with AI-assisted category, severity, and location context.</li>
        <li>System performs duplicate checks and creates ticket with SLA metadata.</li>
        <li>Authority assigns worker through atomic assignment operation.</li>
        <li>Worker executes task, uploads proof, and updates lifecycle state.</li>
        <li>Citizen confirms closure or reopens within allowed policy window.</li>
        <li>Audit history is persisted for review, accountability, and analytics.</li>
      </ol>
    ),
  },
  {
    id: "architecture",
    label: "05",
    title: "System Architecture",
    summary:
      "The solution is layered for clarity: client applications, APIs, data layer, and external integrations.",
    content: (
      <div className={styles.layerStack}>
        <article className={styles.layerCard}>
          <h3 className={styles.layerTitle}>Client Layer</h3>
          <div className={styles.tagRow}>
            <span className={styles.tag}>Next.js App Router</span>
            <span className={styles.tag}>Role-specific portals</span>
            <span className={styles.tag}>Realtime updates</span>
          </div>
        </article>
        <article className={styles.layerCard}>
          <h3 className={styles.layerTitle}>API Layer</h3>
          <div className={styles.tagRow}>
            <span className={styles.tag}>FastAPI core service</span>
            <span className={styles.tag}>Next.js route handlers</span>
            <span className={styles.tag}>AI service endpoints</span>
          </div>
        </article>
        <article className={styles.layerCard}>
          <h3 className={styles.layerTitle}>Data Layer</h3>
          <div className={styles.tagRow}>
            <span className={styles.tag}>PostgreSQL + PostGIS</span>
            <span className={styles.tag}>RLS policies</span>
            <span className={styles.tag}>Trigger-validated transitions</span>
          </div>
        </article>
      </div>
    ),
  },
  {
    id: "database",
    label: "06",
    title: "Data Model and RPCs",
    summary:
      "Core enums and transaction-safe database functions preserve consistency under concurrent usage.",
    content: (
      <>
        <div className={styles.chipGroup}>
          <span className={styles.chip}>complaint_status</span>
          <span className={styles.chip}>severity_level</span>
          <span className={styles.chip}>worker_availability</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.docsTable}>
            <thead>
              <tr>
                <th>RPC</th>
                <th>Purpose</th>
              </tr>
            </thead>
            <tbody>
              {rpcRows.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: "api",
    label: "07",
    title: "API Surface",
    summary:
      "Representative endpoints across complaint intake, worker operations, admin controls, and AI workflows.",
    content: (
      <div className={styles.tableWrap}>
        <table className={styles.docsTable}>
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Method</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            {apiRows.map((row) => (
              <tr key={row.endpoint + row.method}>
                <td>{row.endpoint}</td>
                <td>{row.method}</td>
                <td>{row.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: "security",
    label: "08",
    title: "Security and Integrity",
    summary:
      "Security controls combine authentication, role isolation, anti-abuse checks, and immutable lifecycle transitions.",
    content: (
      <ul className={styles.signalList}>
        <li>Role-scoped access via JWT-backed Row Level Security.</li>
        <li>Server-side captcha verification for abuse prevention.</li>
        <li>Trigger-enforced status transitions to block invalid state changes.</li>
        <li>Audit history for assignment, escalation, and closure events.</li>
      </ul>
    ),
  },
  {
    id: "operations",
    label: "09",
    title: "Operations and Deployment",
    summary:
      "The platform is containerized, multi-service, and deployable with CI/CD for controlled operational rollouts.",
    content: (
      <div className={styles.prose}>
        <p>
          Deployment is split into web, api, and ai services. Local execution supports full-stack simulation,
          while production uses cloud-managed service hosting with secret management and image registry workflows.
        </p>
        <p>
          Health checks and endpoint-level smoke tests should be run before release to validate complaint intake,
          assignment loops, and notification links.
        </p>
      </div>
    ),
  },
  {
    id: "roadmap",
    label: "10",
    title: "Roadmap",
    summary:
      "Current delivery focuses on Delhi-scale confidence, followed by multi-city rollout and ecosystem integrations.",
    content: (
      <div className={styles.roadmap}>
        <article className={styles.roadmapItem}>
          <p className={styles.roadmapPhase}>Phase 1</p>
          <p>Delhi pilot stabilization, monitoring, and authority onboarding.</p>
        </article>
        <article className={styles.roadmapItem}>
          <p className={styles.roadmapPhase}>Phase 2</p>
          <p>Multi-city rollout with locality-specific category and workflow calibration.</p>
        </article>
        <article className={styles.roadmapItem}>
          <p className={styles.roadmapPhase}>Phase 3</p>
          <p>Deeper interoperability for cross-platform escalation and national routing flows.</p>
        </article>
      </div>
    ),
  },
  {
    id: "glossary",
    label: "11",
    title: "Glossary",
    summary:
      "Short definitions for terms repeatedly used in architecture and operations discussions.",
    content: (
      <div className={styles.glossaryGrid}>
        <article className={styles.glossaryItem}>
          <h3 className={styles.glossaryTerm}>DIGIPIN</h3>
          <p>Location encoding system used for precise field navigation and ticket consistency.</p>
        </article>
        <article className={styles.glossaryItem}>
          <h3 className={styles.glossaryTerm}>RLS</h3>
          <p>Row Level Security policies that enforce data isolation between departments and roles.</p>
        </article>
        <article className={styles.glossaryItem}>
          <h3 className={styles.glossaryTerm}>SLA</h3>
          <p>Service deadline contracts that drive escalation and prioritization behavior.</p>
        </article>
        <article className={styles.glossaryItem}>
          <h3 className={styles.glossaryTerm}>RPC</h3>
          <p>Transactional database function used for atomic operations and concurrency safety.</p>
        </article>
      </div>
    ),
  },
];
