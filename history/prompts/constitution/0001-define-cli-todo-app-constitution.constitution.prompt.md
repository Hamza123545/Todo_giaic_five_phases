---
id: 0001
title: Define CLI Todo App Constitution
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

You are helping me define the constitution for a basic-level command-line todo application that will be built using Spec-Kit Plus and Claude Code with Python 3.13+ and UV as the package and environment manager. This constitution should define the non‑negotiable principles, technical standards, and workflow rules for the project.

Project purpose

Build a simple, reliable CLI todo app that stores tasks in memory only (no database or files).

Support the 5 basic features: Add, Delete, Update, View/List, and Mark Complete/Incomplete.

Optimize for clarity, maintainability, and learning Spec‑Driven Development, not for advanced features.

Technology stack

Language: Python 3.13+.

Tooling: UV for dependency and environment management, Git for version control.

AI assistant: Claude Code, orchestrated by GitHub Spec‑Kit / Spec‑Kit Plus.

Target interface: Command-line only. No GUI or web UI for this basic level.

Architecture and code standards

Follow clean code principles: small functions, clear names, single responsibility, and minimal side effects.

Use a simple, modular Python project structure under /src, separating the CLI entry point from core task management logic.

Represent tasks with a small, well‑defined data structure (e.g., dataclass or class) including at least: id, title, description, is_completed.

Keep state in memory for the entire app lifetime; no persistence beyond process exit.

Require type hints and basic docstrings for public functions.

Enforce consistent formatting (e.g., Black‑style or PEP 8‑compatible) and use clear, helpful error messages for invalid user input.

Spec‑driven workflow rules

All new work must start from Spec‑Kit commands (/specify, /plan, /tasks, /implement) and must align with this constitution.

Specifications must clearly describe user stories for: adding tasks, listing tasks with status indicators, updating details, deleting by ID, and toggling completion.

The plan must include: main modules, functions, data models, and how the CLI commands map to operations.

Implementation must follow the generated spec and plan; changes to requirements should trigger an explicit spec/plan update, not ad‑hoc coding.

Testing and quality

Include basic automated tests for the core task management logic (add, update, delete, mark complete/incomplete, list).

Tests should be runnable via a simple command (for example uv run pytest or similar) and must pass before merging changes.

Avoid over‑engineering; prioritize simplicity and readability over cleverness.

Repository and documentation expectations

The repository must contain: constitution.md, a specs history folder, /src with Python source, README.md with setup and run instructions, and CLAUDE.md explaining how to use Claude Code + Spec‑Kit for this project.

The README must describe how to install dependencies with UV, run the CLI, and run tests.

Using the standard Spec‑Kit constitution template, fill in and refine all relevant sections so that this file can act as a stable, opinionated foundation for the entire project. Use clear markdown headings and bullet points suitable for a small educational project.

## Response snapshot

The constitution for the Basic Command-Line Todo Application has been defined and updated to version 1.0.0. This is a MAJOR version bump as it's the initial definition of the project's principles and standards. The following template files require manual follow-up to ensure consistency with the new constitution: .specify/templates/plan-template.md, .specify/templates/spec-template.md, .specify/templates/tasks-template.md, .specify/templates/commands/sp.constitution.md, .specify/templates/commands/sp.phr.md. Suggested commit message: `docs: amend constitution to v1.0.0 (initial definition)`

## Outcome

- ✅ Impact: Defined project constitution
- 🧪 Tests: No tests run as this was a documentation task
- 📁 Files: Created/updated .specify/memory/constitution.md
- 🔁 Next prompts: Update dependent templates
- 🧠 Reflection: Successfully defined the project constitution based on detailed user input. The constitution includes core principles, technical standards, development workflow, and governance rules. Identified dependent templates that require manual updates.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): None
- Prompt variant (if applicable): None
- Next experiment (smallest change to try): None