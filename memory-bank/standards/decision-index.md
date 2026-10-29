---
last_updated: 2026-10-28T22:21:36Z
total_decisions: 1
---

# Decision Index

This index tracks all Architecture Decision Records (ADRs) created during Construction bolts.
Use this to find relevant prior decisions when working on related features.

## How to Use

**For Agents**: Scan the "Read when" fields below to identify decisions relevant to your current task. Before implementing new features, check if existing ADRs constrain or guide your approach. Load the full ADR for matching entries.

**For Humans**: Browse decisions chronologically or search for keywords. Each entry links to the full ADR with complete context, alternatives considered, and consequences.

---

## Decisions

<!-- Entries are appended below in reverse chronological order (newest first) -->
<!-- Format for each entry:

### ADR-{n}: {title}
- **Status**: {proposed|accepted|deprecated|superseded}
- **Date**: {YYYY-MM-DD}
- **Bolt**: {bolt-id} ({unit-name})
- **Path**: `bolts/{bolt-id}/adr-{n}-{slug}.md`
- **Summary**: {First sentence from Context}. {First sentence from Decision}.
- **Read when**: {Agent guidance - domain keywords and scenarios when this ADR is relevant}

-->

### ADR-001: Overshoot / surplus handling
- **Status**: accepted
- **Date**: 2026-10-29
- **Bolt**: 004-weighing-station (003-weighing-station)
- **Path**: `bolts/004-weighing-station/adr-001-overshoot-surplus-handling.md`
- **Summary**: Over-dosed components must not be recorded as successful without an authorised exception. Confirm blocked; re-weigh or supervisor override with reason; proportional shade-ratio targets shown for information only, never applied.
- **Read when**: overshoot, surplus, compensation, supervisor override, tolerance failure, recipe recalculation (A-08, Q25, Q26, Q33)
