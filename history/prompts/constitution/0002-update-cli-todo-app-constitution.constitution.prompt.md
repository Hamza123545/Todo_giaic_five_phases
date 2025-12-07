---
id: 0002
title: Update CLI Todo App Constitution
stage: constitution
date: 2025-12-03
surface: agent
model: claude-sonnet-4-5-20250929
feature: cli-todo-app
branch: main
user: user
command: /sp.constitution
labels: ["project-setup", "constitution"]
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

Update my project constitution for the Basic Command‑Line Todo Application so it fully matches the assignment. Keep all existing principles, but:

Explicitly mention that the working console app must demonstrate: adding tasks, listing tasks with status indicators, updating task details, deleting tasks by ID, and marking tasks complete/incomplete.

Ensure the workflow uses the correct Spec‑Kit Plus commands (/sp.specify, /sp.plan, /sp.tasks, /sp.implement, /sp.clarify) where appropriate.

Verify the repository expectations include: constitution file, specs history folder, /src directory, README.md with UV setup + run instructions, and CLAUDE.md with Claude Code usage.

Make any small wording improvements needed while keeping the scope as a basic, memory‑only CLI todo app.

## Response snapshot

The constitution for the Basic Command-Line Todo Application has been updated to version 1.0.1. This is a PATCH version bump due to minor wording changes and the addition of a Spec-Kit command. The following template files require manual follow-up to ensure consistency with the new constitution: .specify/templates/plan-template.md, .specify/templates/spec-template.md, .specify/templates/tasks-template.md, .specify/templates/commands/sp.constitution.md, .specify/templates/commands/sp.phr.md. Suggested commit message: `docs: amend constitution to v1.0.1 (workflow commands + feature clarity)`

## Outcome

- ✅ Impact: Updated project constitution with clearer feature descriptions and Spec-Kit Plus commands.
- 🧪 Tests: No tests run as this was a documentation task.
- 📁 Files: Updated .specify/memory/constitution.md
- 🔁 Next prompts: Update dependent templates.
- 🧠 Reflection: Successfully incorporated user feedback to refine the constitution, ensuring alignment with project requirements. The update clarified core features and Spec-Kit Plus workflow commands. Dependent templates still require manual updates.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): None
- Prompt variant (if applicable): None
- Next experiment (smallest change to try): None