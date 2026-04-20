## Plan: Unified Bot + Seva Chat Hardening

Harden both WhatsApp bot and Seva citizen dashboard chat behind one shared intake decision engine, strict server-side auth/safety/validation controls, and a benchmarked 42-category quality program. This eliminates false tickets, loop traps, unsafe image intake, and identity/abuse gaps while keeping web and WhatsApp behavior consistent.

**Steps**
1. Phase 1: Define Unified Decision Contract And Artifacts.
Create one canonical decision schema for intake outcomes: valid_issue, explicit_blocked, private_or_non_civic_reject, low_confidence_needs_user_choice, duplicate_detected, needs_location, and auth_failed. Produce sequence diagrams and state-machine charts for Seva text, Seva image, and WhatsApp image/location flows.
2. Phase 1: Build Shared Classification Service Boundary (depends on 1).
Consolidate classification outputs so both channels consume identical fields (child_id, confidence, severity, title, description, safety flags, alternatives[]). Remove frontend-only assumptions.
3. Phase 2: Auth Hardening For Seva + FastAPI (depends on 1).
Enforce JWT signature validation in FastAPI token helper. In Next complaints API, ignore client-sent citizen_id and derive from validated JWT subject only (user decision). Reject unauthenticated complaint creation.
4. Phase 2: Abuse Surface Closure (depends on 3, parallel with 5).
Require login for upvotes (user decision), add rate limits on chat/complaints/stt endpoints, and add request idempotency keys on confirm/submit to prevent duplicate inserts on retries.
5. Phase 2: Safety Gates And INVALID Handling (depends on 1).
Replace forced INVALID fallback with policy-driven outcomes. Add moderation/domain checks: explicit/adult block + warning, allow person-in-frame only when civic evidence is clear, reject private/non-civic images.
6. Phase 2: Confidence + Ambiguity Handling (depends on 2, parallel with 5).
Move confidence gating server-side. For low confidence, return top-k candidate categories and require user disambiguation before submission.
7. Phase 2: 42-Category Text Flow Upgrade For Seva (depends on 2, 6).
Replace current coarse keyword mapping with full 42-category resolution (user decision) using top-k user choice for ambiguous cases; remove fallback defaulting to broad categories.
8. Phase 3: Conversation State Hardening (depends on 1, parallel with 3-7).
Make all fallbacks state-aware in WhatsApp and Seva, add explicit edit/re-analyze intents, loop guards, and deterministic cancellation paths. Fix Seva voice/mic flow and stale pending-image state persistence edge cases.
9. Phase 3: Duplicate Policy Parity + Radius Consistency (depends on 2, 6).
Unify duplicate radius/lookback and behavior between Seva text route, Seva image confirm route, and WhatsApp. Keep policy: block duplicate and offer upvote-existing first; allow override only with explicit audited force-submit.
10. Phase 3: Session Integrity And History Scoping (depends on 3).
Scope chat history and pending state to authenticated user context server-side; do not rely only on client-generated session ids. Add TTL and authorization checks for history read/write/delete endpoints.
11. Phase 4: Validation And Payload Guardrails (depends on 3-10).
Add strict schema validation: title/description lengths, severity enum, category existence, coordinate bounds, image mime/size limits, and consistent error contracts across web and WhatsApp.
12. Phase 4: Observability And Reason Codes (depends on 3-11).
Emit structured logs and metrics for every accept/reject branch with reason_code (auth_failed, explicit_blocked, low_confidence, duplicate_blocked, etc.). Remove raw model payload logging in production.
13. Phase 5: Test Program (depends on 2-12).
Create unit/integration/edge suites for Seva + WhatsApp: auth spoofing, non-civic/explicit inputs, low-confidence disambiguation, 42-category mapping accuracy, duplicate races, idempotency retries, session/history isolation, and state-loop prevention.
14. Phase 5: Safe Rollout (depends on 13).
Deploy in shadow mode, compare false accept/reject and per-category metrics, then enforce hard blocks once thresholds are met.

**Relevant files**
- /Users/prakharrr/ps-crmdev1/apps/web/components/ChatPanel.tsx — Seva state machine, low-confidence UX, location confirm, text/image/voice submission orchestration.
- /Users/prakharrr/ps-crmdev1/apps/web/lib/gemini.ts — Seva chat client contract and language parameter wiring.
- /Users/prakharrr/ps-crmdev1/apps/web/app/api/chat/route.ts — Gemini proxy, language handling, origin control, model fallback, logging.
- /Users/prakharrr/ps-crmdev1/apps/web/app/api/complaints/route.ts — Seva complaint insert/upvote, duplicate detection, authority routing.
- /Users/prakharrr/ps-crmdev1/apps/web/app/api/stt/route.ts — voice transcription ingress controls and abuse limits.
- /Users/prakharrr/ps-crmdev1/apps/api/main.py — JWT extraction/verification, analyze/confirm behavior, chat history endpoints.
- /Users/prakharrr/ps-crmdev1/apps/api/whatsapp_webhook.py — WhatsApp intake state machine and submission gating.
- /Users/prakharrr/ps-crmdev1/apps/api/shared.py — 42 category taxonomy, severity map, geocode utilities, duplicate RPC logic.
- /Users/prakharrr/ps-crmdev1/COMPLETE_PROJECT_DOCUMENTATION.md — update with final artifacts: sequence diagrams, fallback matrix, decision table.

**Verification**
1. Security checks pass: JWT signature verification enforced, complaint owner derived from token only, unauthorized upvote/submit rejected, rate limits active.
2. Safety checks pass: explicit content blocked with warning, private/non-civic images rejected, no forced INVALID coercion.
3. Quality checks pass: 42-category benchmark + hard negatives meet release thresholds, low-confidence paths require user category choice.
4. Consistency checks pass: duplicate behavior and radius are identical across Seva text, Seva image, and WhatsApp.
5. Reliability checks pass: idempotency prevents duplicate inserts on retries; state loops and stale pending-state restores are covered by tests.
6. Observability checks pass: structured reason_code metrics visible; no raw model payload leakage in logs.

**Decisions**
- Seva complaint ownership: JWT subject only (ignore client citizen_id).
- Upvote policy: login required (no anonymous upvotes).
- Text categorization: full 42 categories with top-k user disambiguation.
- Person/private scene policy: allow only when civic issue is clearly visible.
- Explicit/adult images: block and warn user.
- Duplicate handling: block and offer upvote-existing; force-submit remains explicit/audited.
- Delivery window: full hardening in 1-2 weeks.

**Further Considerations**
1. Migration strategy recommendation: run old and new category selection in parallel for 3-5 days with offline comparison before cutover.
2. Operational guardrail recommendation: keep a temporary manual-review queue for borderline confidence band during first production week.
3. Product copy recommendation: standardize safety/low-confidence/duplicate messages across Seva and WhatsApp to reduce user confusion.