---
id: 0003
title: Update Constitution for AI Agents
stage: constitution
date: 2025-12-03
surface: agent
model: claude-sonnet-4-5-20250929
feature: cli-todo-app
branch: main
user: user
command: /sp.constitution
labels: ["project-setup", "constitution", "ai-agents"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
- .specify/memory/constitution.md
tests: null
---

## Prompt

Please read the existing constitution for my Basic Command‑Line Todo Application and update it to support AI sub‑agents and skills.

Keep all current principles, but:

Add a new core principle that allows multiple AI sub‑agents and reusable skills, as long as they follow this constitution and the spec‑driven workflow.

State that each sub‑agent must have a clear, narrow role (for example: writing specs, planning, implementation, testing, or refactoring) and must not bypass the specification or plan.

In the Technical Standards section, add that sub‑agents and skills should read the constitution and specs first, then work only on focused tasks such as generating tests, improving error messages, or refactoring.

In the Governance section, add that every sub‑agent or skill must be documented in the repository (for example in CLAUDE.md or agents-and-skills.md) and they must not introduce features that conflict with the constitution (like persistence or a GUI) unless the constitution is officially up

## Response snapshot

The constitution for the Basic Command-Line Todo Application has been updated to version 1.0.2. This is a PATCH version bump due to the addition of a new core principle and updates to the Technical Standards and Governance sections regarding AI sub-agents and skills.

The following template files require manual follow-up to ensure consistency with the new constitution:
*   `.specify/templates/plan-template.md`
*   `.specify/templates/spec-template.md`
*   `.specify/templates/tasks-template.md`
*   `.specify/templates/commands/sp.constitution.md`
*   `.specify/templates/commands/sp.phr.md`

Suggested commit message: `docs: amend constitution to v1.0.2 (AI sub-agents and skills support)`

## Outcome

- ✅ Impact: Updated project constitution for AI agent support.
- 🧪 Tests: No tests run as this was a documentation task.
- 📁 Files: Updated .specify/memory/constitution.md
- 🔁 Next prompts: Update dependent templates.
- 🧠 Reflection: Successfully updated the constitution to include principles and guidelines for AI sub-agents and skills, ensuring alignment with the spec-driven workflow and project governance.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): None
- Prompt variant (if applicable): None
- Next experiment (smallest change to try): None