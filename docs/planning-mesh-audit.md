# Planning Mesh Audit

Date: 2026-03-09

Status: Updated after planning-cluster cleanup

## Scope

Audited skills:

- `writing-plans`
- `plan-writing`
- `planning-with-files`
- `lead-architect`
- `product-manager`
- `sequential-thinking`
- `executing-plans`
- `verification-before-completion`
- `finishing-a-development-branch`
- `using-git-worktrees`

## Executive Summary

`writing-plans` is present and healthy. It has a complete mesh section, strong outgoing links, and strong incoming references across the skill set.

The planning cluster is not fully normalized yet because the normalized graph file `data/skill-mesh/mesh-index.json` is missing from the Antigravity workspace that was available for this audit.

The main topology issues were around duplicate planning roles and unresolved virtual workflow aliases in neighboring skills, not in `writing-plans` itself.

The planning cluster metadata has now been cleaned up in the active `.codex` skills. The remaining gap is the missing canonical graph file and similar alias issues elsewhere in the wider skill catalog.

## Key Findings

### P0

1. Missing normalized mesh graph source.
   - Expected by AGENTS policy: `data/skill-mesh/mesh-index.json`
   - Result: not found under `C:\Users\tinnh\.gemini\antigravity`
   - Impact: cannot verify whether `writing-plans` is normalized into the canonical relation graph.

### P1

2. Planning role overlap between `writing-plans`, `plan-writing`, and `planning-with-files`.
   - `writing-plans` focuses on execution-ready plans with constraints, risks, and handoff.
   - `plan-writing` focuses on short task lists and also routes `/plan` to `writing-plans`.
   - `planning-with-files` focuses on persistent disk-based planning files and also routes `/plan` to `writing-plans`.
   - Impact: trigger ambiguity and conceptual duplication inside the planning cluster.

3. Unresolved or non-canonical virtual workflow aliases appeared in planning-adjacent skills.
   - Resolved in the planning cluster cleanup:
     - removed `/design` from `lead-architect`
     - removed `/pm` from `product-manager`
     - removed `/development` from `using-git-worktrees`
   - Remaining impact: similar aliases still exist in many other skills across the broader catalog, so this is not yet a full-system cleanup.

### P2

4. `finishing-a-development-branch` closes the execution chain but does not list `verification-before-completion` in its handoff section even though the two are tightly coupled elsewhere.
   - Resolved in the planning cluster cleanup by adding `verification-before-completion` to its handoff list.

## Evidence

### `writing-plans`

- Mesh section exists.
- Related skills: `lead-architect`, `product-manager`, `sequential-thinking`, `executing-plans`, `code-review`
- Virtual workflows: `/bootstrap`, `/break-tasks`, `/plan`
- Handoffs: `code-review`, `executing-plans`, `qa-tester`, `verification-before-completion`
- Incoming references found during scan: 44

### Neighboring skills

- `executing-plans` explicitly starts from `@writing-plans` and hands off to `@verification-before-completion`, `@code-review`, `@qa-tester`, and `@finishing-a-development-branch`
- `verification-before-completion` is well connected and supports `/finish` and `/verify`
- `using-git-worktrees` is linked into the delivery chain, but its `/development` alias is not normalized in the current AGENTS route table

## Recommended Cleanup

1. Restore or generate `data/skill-mesh/mesh-index.json` so AGENTS has a real normalized graph source.
2. Keep one canonical planning skill for `/plan`.
   - Recommended: keep `writing-plans` as the canonical execution-plan skill.
3. Re-scope the other planning skills.
   - `plan-writing`: keep only as a compact checklist variant that hands off to `writing-plans`
   - `planning-with-files`: keep only for persistent on-disk planning workflows
4. Normalize virtual workflow aliases across the wider catalog.
   - Either add `/design`, `/pm`, and `/development` to the AGENTS route table everywhere they are intended to exist, or remove them consistently from the mesh sections.

## Verdict

`writing-plans` itself is mesh-ready and operationally healthy.

The planning cluster around it is now materially cleaner and less ambiguous.

It is still only partially normalized at the system level because the canonical mesh graph is missing and similar non-canonical workflow aliases still exist elsewhere in the broader skill catalog.
