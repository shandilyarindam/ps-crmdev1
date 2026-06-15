# Graph Report - ps-crmdev1  (2026-06-16)

## Corpus Check
- 197 files · ~312,371 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1655 nodes · 2654 edges · 118 communities (98 shown, 20 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 116 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9ff2651a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 106|Community 106]]
- [[_COMMUNITY_Community 107|Community 107]]
- [[_COMMUNITY_Community 110|Community 110]]
- [[_COMMUNITY_Community 111|Community 111]]
- [[_COMMUNITY_Community 112|Community 112]]
- [[_COMMUNITY_Community 113|Community 113]]

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 55 edges
2. `HTTPException` - 46 edges
3. `JanSamadhan Complete Project Documentation` - 45 edges
4. `supabase` - 41 edges
5. `Database` - 28 edges
6. `get_citizen_id_from_token()` - 27 edges
7. `JanSamadhan` - 22 edges
8. `OnnxInferenceService` - 21 edges
9. `InferenceConfig` - 18 edges
10. `BackendConfigError` - 17 edges

## Surprising Connections (you probably didn't know these)
- `allot_material()` --calls--> `HTTPException`  [INFERRED]
  apps/api/main.py → ai-service/service/main.py
- `analyze()` --calls--> `HTTPException`  [INFERRED]
  apps/api/main.py → ai-service/service/main.py
- `assign_complaint()` --calls--> `HTTPException`  [INFERRED]
  apps/api/main.py → ai-service/service/main.py
- `cctv_analyze_live()` --calls--> `HTTPException`  [INFERRED]
  apps/api/main.py → ai-service/service/main.py
- `cctv_verify()` --calls--> `HTTPException`  [INFERRED]
  apps/api/main.py → ai-service/service/main.py

## Import Cycles
- None detected.

## Communities (118 total, 20 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (71): build_complaint_record(), build_ticket_details_url(), _compute_digipin(), _coord_cache_key(), _fallback_digipin_raw(), _find_active_spatial_duplicate(), _in_ndmc_zone(), _infer_authority_from_issue_type() (+63 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (50): Any, Image, Any, Client, CCTVAutoTicketHandler, _compute_digipin(), get_cctv_auto_handler(), CCTV feature handler for JanSamadhan V2. Features: 1. /cctv/process - Auto-ticke (+42 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (56): supabase, ALLOWED_ORIGINS, GeminiApiContent, GeminiApiResponse, GeminiCandidate, getCorsHeaders(), OPTIONS(), POST() (+48 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (54): AdminAuthorityCreate, AdminAuthorityUpdate, AdminWorkerCreate, AdminWorkerUpdate, allot_material(), analyze_options(), CameraAnalyzeRequest, CameraVerifyRequest (+46 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (43): AUTHORITY_NAMES, CHILD_CATEGORIES, ChildCategory, childMap, getGroupedResults(), ManualReportForm(), NearbyTicketsMap, PARENT_CATEGORIES (+35 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (49): metadata, backendDeliverables, CapabilityRow, capabilityRows, cx(), Deliverable, frontendDeliverables, getQuotationSections() (+41 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (35): ComplaintRow, TicketCard(), TicketCardProps, formatStatus(), formatTimestamp(), getSeverityDotColor(), statusClasses(), CurrentTicketCard() (+27 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (27): CameraCard(), CameraCardProps, CameraData, DashcamBox, DashcamFrame, DashcamOverlayState, DashcamPolicy, DashcamPrecomputedArtifact (+19 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (39): Any, Path, UploadFile, OnnxInferenceService, RuntimeError, CameraAnalyzeRequest, CameraVerifyRequest, cctv_analyze_live() (+31 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (28): ChatPanel(), CONFIRMATION_PATTERNS, DeviceLocation, DisplayMessage, DuplicateContext, DuplicateMatch, GeoDetails, ImageTicketPreview (+20 more)

### Community 10 - "Community 10"
Cohesion: 0.05
Nodes (39): dependencies, gsap, @gsap/react, leaflet, leaflet.heat, lucide-react, next, react (+31 more)

### Community 11 - "Community 11"
Cohesion: 0.05
Nodes (38): 10.10 Heatmap and real-time spatial intelligence, 10.11 SLA engine and urgency orchestration, 10.12 Real-time supervised learning and retraining pipeline, 10.1 Citizen complaint intake flow, 10.2 Assignment and execution flow, 10.3 Closure confirmation flow, 10.4 Surveillance and dashcam flow, 10.5 Department mapping and ownership enforcement (+30 more)

### Community 12 - "Community 12"
Cohesion: 0.06
Nodes (30): AuthorityMapView(), ComplaintStatus, MapTicket, MarkerClusterGroup, parseEwkbHexPoint(), parseLocation(), SEV_BADGE, SEV_COLOR (+22 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (37): analyze_issue_with_gemini(), _decode_base64url(), delete_chat_history(), emit_worker_supervised_sample_event(), get_admin_authorities_list(), get_admin_complaints_list(), get_admin_dashboard_department_performance(), get_admin_dashboard_stats() (+29 more)

### Community 14 - "Community 14"
Cohesion: 0.06
Nodes (33): Automated Tests, Batch 1: Duplicate Radius Parity + Rate Limiting + Idempotency (Steps 4, 9), Batch 2: Safety Gates + INVALID Handling (Step 5), Batch 3: Confidence + 42-Category Text Flow (Steps 6, 7), Batch 4: Session Integrity + Conversation State (Steps 8, 10), Batch 5: Validation Guardrails (Step 11), Batch 6: Observability + Reason Codes (Step 12), Current Status Assessment (+25 more)

### Community 15 - "Community 15"
Cohesion: 0.10
Nodes (17): supabase, GET(), getServiceClient(), GAMIFICATION_CONFIG, GamificationReason, gamificationService, supabase, supabase (+9 more)

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (11): DepartmentPerformance, initialData, ComplaintRow, ComplaintRow, ComplaintRow, KIND_CONFIG, Notif, NotifKind (+3 more)

### Community 17 - "Community 17"
Cohesion: 0.08
Nodes (23): 10. Authority Detail Page Layout, 11. Worker Assignment, 12. Grid Layout System, 13. Workload Indicator, 14. Page Components, 15. Folder Structure, 16. Benefits of Card-Based Authority Layout, 17. Summary (+15 more)

### Community 18 - "Community 18"
Cohesion: 0.09
Nodes (22): 10. PriorityBadge Component, 11. TicketActions Component, 12. Pagination Component, 13. Component Hierarchy, 14. Benefits of Component-Based Design, 15. Summary, 1. Overview, 2. Page Structure (+14 more)

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (13): AuthorityLayout(), PAGE_META, usePageMeta(), ComplaintRow, NotificationRow, defaultSidebarConfig, Sidebar(), SIDEBAR_DARK_COLORS (+5 more)

### Community 20 - "Community 20"
Cohesion: 0.10
Nodes (16): TicketSearch(), TicketSearchProps, TicketsHeader(), TicketsHeaderProps, AdminComplaintsPayload, authorityExamples, categoryExamples, CategoryOption (+8 more)

### Community 21 - "Community 21"
Cohesion: 0.10
Nodes (11): avgDays(), CAT_PALETTE, Complaint, GRAN_OPTIONS, Granularity, LocalStatus, pct(), ReportsPage() (+3 more)

### Community 22 - "Community 22"
Cohesion: 0.16
Nodes (11): Props, Props, UrgentRow(), AssignDropdown(), ComplaintDetailPanel(), SlaDisplay(), isBreached(), STATUS_META (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+12 more)

### Community 24 - "Community 24"
Cohesion: 0.10
Nodes (19): architectureRows, comparisonRows, differentiatorRows, DocumentationSection, envRows, failureRows, fastApiRows, glossaryRows (+11 more)

### Community 25 - "Community 25"
Cohesion: 0.11
Nodes (18): ⚙️ Admin Flow, 🏗️ Application Architecture, 🏛️ Authority Flow — Department-Scoped, No Overlap, 📱 Compatibility, 🗂️ Complaint Categories (42+ across 9 Delhi Zones), 🎬 Demo Video, 🧭 Department Mapping (Category to Authority), 🚀 How To Start (Local Runtime) (+10 more)

### Community 26 - "Community 26"
Cohesion: 0.13
Nodes (11): Any, get_whatsapp_handler(), WhatsApp entry point handler for JanSamadhan V2. Receives Twilio webhook -> extr, Parse Twilio WhatsApp webhook payload., Extract image bytes if message contains media., Extract caption/text from message., Extract location if shared (Twilio sends Latitude/Longitude)., Handle WhatsApp flow: image + caption -> analyze -> create complaint. (+3 more)

### Community 27 - "Community 27"
Cohesion: 0.13
Nodes (15): getSeverityConfig(), getStatusMeta(), ALL_STATUSES, Complaint, getInitialTrackCache(), LocalStatus, MapComponent, Sev (+7 more)

### Community 28 - "Community 28"
Cohesion: 0.20
Nodes (16): extractBearerToken(), GET(), getAuthClient(), getServiceClient(), POST(), RedeemRequestBody, resolveUserId(), AssignDepartmentPayload (+8 more)

### Community 29 - "Community 29"
Cohesion: 0.13
Nodes (12): HomePage(), AnimatedText(), AnimatedTextProps, AnimatedTextTheme, defaultTheme, DecorativeLine(), DecorativeLineProps, DecorativeLineTheme (+4 more)

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (11): defaultTheme, FadedText(), FadedTextProps, FadedTheme, LocationPinPicker(), Props, PhoneMockup(), timelineEntries (+3 more)

### Community 31 - "Community 31"
Cohesion: 0.15
Nodes (10): Complaint, parseEwkbHexPoint(), parseLocation(), WORKFLOW_STEPS, generateMetadata(), AccountabilityHandles, CATEGORY_TWITTER_HANDLES, DEPARTMENT_TWITTER_HANDLES (+2 more)

### Community 32 - "Community 32"
Cohesion: 0.16
Nodes (10): AdminStatCard(), AdminStatCardProps, AdminStatsOverview(), DashboardStats, formatAverageDays(), formatNumber(), initialStats, numberFormatter (+2 more)

### Community 33 - "Community 33"
Cohesion: 0.17
Nodes (16): analyze(), ChatHistory, _check_rate_limit(), confirm(), get_chat_history(), _get_idempotent_result(), Return True if the request is allowed, False if rate-limited., Retrieve chat history from Redis for a given session (auth-scoped). (+8 more)

### Community 34 - "Community 34"
Cohesion: 0.16
Nodes (11): AboutPage(), capabilities, processes, teamMembers, FooterSection, MegaFooter(), MegaFooterProps, SocialIcons (+3 more)

### Community 35 - "Community 35"
Cohesion: 0.14
Nodes (7): AuthorityFilters(), AuthorityFiltersProps, activeStatuses, activeStatusSet, baseDepartments, WorkerComplaintAssignmentRow, WorkerProfileRow

### Community 36 - "Community 36"
Cohesion: 0.23
Nodes (11): formatPriorityLabel(), formatStatusLabel(), severityToPriority(), PriorityBadge(), PriorityBadgeProps, priorityStyles, StatusBadge(), StatusBadgeProps (+3 more)

### Community 37 - "Community 37"
Cohesion: 0.15
Nodes (8): ComplaintRow, RatingProps, AVAIL, Availability, getInitialWorkersCache(), transformPayload(), Worker, WorkerPayload

### Community 38 - "Community 38"
Cohesion: 0.14
Nodes (13): ACTIVE_STATUSES, BY_LCODE, BY_STRING, ComplaintStatus, ESCALATED_STATUSES, PENDING_STATUSES, SEVERITY_RANK, SeverityConfig (+5 more)

### Community 39 - "Community 39"
Cohesion: 0.18
Nodes (7): CitizenTicketsPageContent(), ComplaintRow, filterAndSortTickets(), formatStatus(), parseEwkbHexPoint(), parseLocation(), TicketListRow

### Community 40 - "Community 40"
Cohesion: 0.17
Nodes (5): activeStatuses, activeStatusSet, baseDepartments, AuthoritySearch(), AuthoritySearchProps

### Community 41 - "Community 41"
Cohesion: 0.19
Nodes (6): CategoryRow, ComplaintAssignmentRow, WorkerProfileRow, WorkloadLevel, activeStatuses, activeStatusSet

### Community 42 - "Community 42"
Cohesion: 0.19
Nodes (9): formatRelativeCreated(), TicketActions(), TicketActionsProps, TicketRow(), TicketRowProps, columnWidths, headers, TicketsTableProps (+1 more)

### Community 43 - "Community 43"
Cohesion: 0.24
Nodes (7): Any, Image, Path, OnnxInferenceService, Draw bounding boxes and labels on a PIL image for Visual Evidence., Thin ONNX inference adapter for pothole detection using frozen model settings., Perform inference on a numpy array (OpenCV frame).

### Community 44 - "Community 44"
Cohesion: 0.15
Nodes (4): ComplaintRow, InventoryItem, MaterialRequestModalProps, RequestItem

### Community 45 - "Community 45"
Cohesion: 0.21
Nodes (8): Option, priorityOptions, statusOptions, TicketFiltersProps, initialFilters, PriorityFilter, TicketFiltersState, TicketStatusFilter

### Community 46 - "Community 46"
Cohesion: 0.18
Nodes (9): geistMono, geistSans, metadata, playfair, viewport, Theme, ThemeContext, ThemeContextType (+1 more)

### Community 47 - "Community 47"
Cohesion: 0.35
Nodes (10): AuthorityDashboardPage(), buildAllTrends(), DashboardPayload, transformPayload(), buildDayBuckets(), buildSixMonthBuckets(), computeStats(), dayLabel() (+2 more)

### Community 48 - "Community 48"
Cohesion: 0.24
Nodes (7): AnimatedAuth(), AnimatedAuthProps, AUTH_COLORS_DARK, AUTH_COLORS_LIGHT, Role, roles, loginAuthColors

### Community 49 - "Community 49"
Cohesion: 0.18
Nodes (7): PassTier, progressPassBase, RewardCatalogItem, RewardKind, RewardVisual, Wallet, WalletResponse

### Community 50 - "Community 50"
Cohesion: 0.20
Nodes (4): AuthorityProfileRow, activeStatuses, activeStatusSet, WorkerProfileRow

### Community 51 - "Community 51"
Cohesion: 0.22
Nodes (5): Footer(), footerLinks, LandNavbar(), Home(), MapComponent

### Community 52 - "Community 52"
Cohesion: 0.38
Nodes (9): AssignDepartmentPayload, CreateAuthorityPayload, GET(), getBearerToken(), getSupabaseAdminClient(), isValidEmail(), PATCH(), POST() (+1 more)

### Community 53 - "Community 53"
Cohesion: 0.20
Nodes (10): 6.1 Dashcam and CCTV, 6.2 Chat/session support, 6.3 Citizen complaint flow, 6.4 Admin dashboard and management, 6.5 Authority operations, 6.6 Worker operations, 6.7 Notification endpoints, 6.8 Root (+2 more)

### Community 54 - "Community 54"
Cohesion: 0.20
Nodes (9): dependencies, gsap, @gsap/react, lucide-react, react-google-recaptcha, @supabase/supabase-js, devDependencies, @types/node (+1 more)

### Community 55 - "Community 55"
Cohesion: 0.33
Nodes (7): AuthoritiesGrid(), AuthoritiesGridProps, AuthorityCard(), AuthorityCardProps, getInitials(), getWorkloadMeta(), AuthorityRecord

### Community 56 - "Community 56"
Cohesion: 0.25
Nodes (7): defaultTheme, Header(), HeaderProps, defaultColors, ThemeToggle(), ThemeToggleProps, ToggleColors

### Community 57 - "Community 57"
Cohesion: 0.22
Nodes (6): HeaderTheme, documentationSections, docsHeaderTheme, DocumentationClient(), heroChips, metadata

### Community 58 - "Community 58"
Cohesion: 0.22
Nodes (5): LINES, Props, VIEW_OPTIONS, ViewMode, TrendPoint

### Community 59 - "Community 59"
Cohesion: 0.22
Nodes (9): 1. Smart Notification Deep Links (Email + WhatsApp), 2. Citizen Closure Confirmation Loop (Pending Closure), 3. Admin Dashcam Live Command Center, 4. CCTV Reliability Engine + Verification, 5. Supervised Learning Dataset Pipeline, 6. Gamification And Wallet Enhancements, 7. Voice Input Pipeline, 8. Public Accountability + Spatial Ops (+1 more)

### Community 60 - "Community 60"
Cohesion: 0.25
Nodes (7): LinkedIn Draft: Backend Contribution Story (Long Form), Main Post (Copy-Paste Ready), Optional Closing CTA Variants, Optional Hook Alternatives, Posting Suggestions (LinkedIn), Questions To Finalize Before Posting, Ready First Comment (Technical Appendix)

### Community 61 - "Community 61"
Cohesion: 0.25
Nodes (3): KIND_CONFIG, Notif, NotifKind

### Community 62 - "Community 62"
Cohesion: 0.25
Nodes (3): ComplaintRow, NotificationBellProps, WorkerNotification

### Community 63 - "Community 63"
Cohesion: 0.25
Nodes (3): KIND_CONFIG, Notif, NotifKind

### Community 64 - "Community 64"
Cohesion: 0.25
Nodes (8): 🧭 Citizen Flow — Filing a Complaint, Example Conversation, 🎫 How a Ticket is Generated, 📍 Location Pin & DIGIPIN, 📝 Manual Submission (Secondary Path), 💬 Seva Chatbot — Gemini AI (Primary Path), What is DIGIPIN?, What Seva Does

### Community 65 - "Community 65"
Cohesion: 0.25
Nodes (8): Prerequisites, 🛠️ Setup Guide, Step 1 — Clone the Repository, Step 2 — Configure Environment Variables, Step 3 — Database Setup, Step 4 — Install Dependencies, Step 5 — Start All Services (Recommended), Step 6 — Start Manually (3 Terminals)

### Community 66 - "Community 66"
Cohesion: 0.29
Nodes (7): Request, assign_complaint(), ComplaintAssignRequest, Assign/Unassign worker to a complaint and invalidate caches., Exception, http_exception_handler(), unhandled_exception_handler()

### Community 67 - "Community 67"
Cohesion: 0.29
Nodes (3): Props, StatCardProps, DashboardStats

### Community 68 - "Community 68"
Cohesion: 0.33
Nodes (5): AuthorityStatusBreakdown(), Props, STATUS_STYLES, AuthorityComplaintRow, getStatusBreakdown()

### Community 69 - "Community 69"
Cohesion: 0.29
Nodes (7): ⚙️ Admin Panel, 🏛️ Authority Dashboard, 👤 Citizen Portal, Portal Access Credentials, Portal Descriptions, 🖥️ The 4 Major Portals, 👷 Worker Dashboard

### Community 70 - "Community 70"
Cohesion: 0.40
Nodes (5): supabase, ComplaintRow, GET(), parsePriorityToSeverity(), Enums

### Community 71 - "Community 71"
Cohesion: 0.33
Nodes (6): 10.13.1 End-to-end platform system design, 10.13.2 Complaint intake, DIGIPIN, and closure loop, 10.13.3 Real-time heatmap and spatial intelligence flow, 10.13.4 SLA state progression and escalation logic, 10.13.5 Supervised learning and retraining data loop, 10.13 Visual system design graph pack (PDF demonstration)

### Community 72 - "Community 72"
Cohesion: 0.33
Nodes (6): A.1 Startup Matrix, A.2 Pre-Deploy Gate (Required), A.3 Fast Smoke Suite, A.4 Incident Signals and Immediate Action, A.5 Rollback and Stabilization, Appendix A. Operational Runbook Snapshot (One-Page)

### Community 73 - "Community 73"
Cohesion: 0.33
Nodes (6): AI Service APIs (ai-service/service/main.py), 📡 API Reference, FastAPI Endpoints (apps/api/main.py), Gemini AI — Paid API Configuration, Next.js App APIs (apps/web/app/api), Supabase RPC Functions

### Community 74 - "Community 74"
Cohesion: 0.40
Nodes (4): 1. Database Migration: Update Enum, 2. Update database.types.ts, 3. Verify WhatsApp Configuration, Backend Developer Instructions: Citizen Confirmation Feedback Loop

### Community 75 - "Community 75"
Cohesion: 0.40
Nodes (5): 8.1 Exposed AI service endpoints, 8.2 Model and inference, 8.3 CCTV reliability engine logic, 8.4 Supabase integration in AI service, 8. AI Service Documentation (ai-service)

### Community 76 - "Community 76"
Cohesion: 0.40
Nodes (4): defaultTheme, Login3DTheme, LoginButton3D(), LoginButtonProps

### Community 77 - "Community 77"
Cohesion: 0.40
Nodes (5): Auto-Escalation on SLA Breach, Community Severity Escalation, Complaint Lifecycle State Machine, SLA Deadlines by Severity, ⏱️ SLA & Escalation Engine

### Community 78 - "Community 78"
Cohesion: 0.40
Nodes (5): DIGIPIN Offline Capability, ENUM State Machine, reCAPTCHA, Row-Level Security (28 Policies), 🔐 Security Design

### Community 81 - "Community 81"
Cohesion: 0.50
Nodes (4): 3.1 Root-level files and directories, 3.2 Primary runtime applications, 3.3 Infra scaffold present, 3. Repository Map

### Community 82 - "Community 82"
Cohesion: 0.50
Nodes (4): 9.1 Main tables and views detected, 9.2 RPC/functions detected in generated types, 9.3 Enums detected, 9. Data Model Documentation

### Community 83 - "Community 83"
Cohesion: 0.50
Nodes (3): AnimatedLeaderboard(), initialPlayers, Player

### Community 84 - "Community 84"
Cohesion: 0.50
Nodes (3): LeaderboardResponse, LeaderboardRow, LeaderboardTable()

### Community 85 - "Community 85"
Cohesion: 0.50
Nodes (3): citizenCode, fs, roles

### Community 86 - "Community 86"
Cohesion: 0.83
Nodes (3): GET(), getAuthClient(), getServiceClient()

### Community 87 - "Community 87"
Cohesion: 0.83
Nodes (3): getAuthClient(), getServiceClient(), POST()

## Knowledge Gaps
- **633 isolated node(s):** `Image`, `Path`, `Client`, `Image`, `Image` (+628 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BackendConfigError` connect `Community 8` to `Community 1`, `Community 66`, `Community 3`, `Community 13`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **Why does `HTTPException` connect `Community 13` to `Community 0`, `Community 33`, `Community 66`, `Community 3`, `Community 8`, `Community 43`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Why does `Database` connect `Community 15` to `Community 2`, `Community 37`, `Community 70`, `Community 6`, `Community 39`, `Community 44`, `Community 16`, `Community 19`, `Community 52`, `Community 86`, `Community 87`, `Community 28`, `Community 62`, `Community 31`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Are the 42 inferred relationships involving `HTTPException` (e.g. with `allot_material()` and `analyze()`) actually correct?**
  _`HTTPException` has 42 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Image`, `CCTV feature handler for JanSamadhan V2. Features: 1. /cctv/process - Auto-ticke`, `Mock DIGIPIN generator for demo.` to the rest of the system?**
  _728 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.058126619770455384 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06384180790960452 - nodes in this community are weakly interconnected._