<!--
Sync Impact Report:
Version change: 1.0.1 → 1.0.2
Modified principles:
  - V. Spec-Driven Development: Updated to include /sp.clarify command.
  - Added VIII. AI Sub-Agents and Skills
Added sections: None
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md: ⚠ pending
  - .specify/templates/spec-template.md: ⚠ pending
  - .specify/templates/tasks-template.md: ⚠ pending
  - .specify/templates/commands/sp.constitution.md: ⚠ pending
  - .specify/templates/commands/sp.phr.md: ⚠ pending
Follow-up TODOs: None
-->
# Basic Command-Line Todo Application Constitution

## Core Principles

### I. Memory-Only State
All application state, including tasks, MUST reside in memory and NOT persist beyond the process exit. This ensures simplicity and focuses on core logic for learning Spec-Driven Development.

### II. CLI-First Design
The application MUST expose all functionality exclusively via a command-line interface. No GUI or web UI is permitted at this basic educational level.

### III. Clean Code Practices
All code MUST adhere to clean code principles, specifically: small functions, clear names, single responsibility, and minimal side effects. This promotes readability and maintainability.

### IV. Modular Python Structure
The project MUST utilize a simple, modular Python project structure under `/src`, clearly separating the CLI entry point from the core task management logic.

### V. Spec-Driven Development
All new work MUST commence from Spec-Kit Plus commands (`/sp.specify`, `/sp.plan`, `/sp.tasks`, `/sp.implement`, `/sp.clarify`) and MUST strictly align with this constitution. Any changes to requirements MUST trigger an explicit spec/plan update, never ad-hoc coding.

### VI. Automated Testing
The project MUST include basic automated tests for the core task management logic (add, update, delete, mark complete/incomplete, list). These tests MUST be runnable via a simple command (e.g., `uv run pytest`) and MUST pass before merging any changes.

### VII. Clarity & Maintainability
Prioritize clarity, maintainability, and readability over excessive cleverness, premature optimization, or over-engineering. The goal is a clear, understandable codebase for educational purposes.

### VIII. AI Sub-Agents and Skills
The project explicitly supports the use of multiple AI sub-agents and reusable skills, provided they strictly adhere to this constitution and the spec-driven workflow. Each sub-agent MUST have a clear, narrow role (e.g., writing specifications, planning, implementation, testing, or refactoring) and MUST NOT bypass the established specification or plan.

## Technical Standards

*   **Language**: Python 3.13+ MUST be used.
*   **Tooling**: UV MUST be used for dependency and environment management. Git MUST be used for version control.
*   **AI Assistant**: Claude Code, orchestrated by GitHub Spec-Kit / Spec-Kit Plus, MUST be the primary AI assistant.
*   **Task Data Structure**: Tasks MUST be represented with a small, well-defined data structure (e.g., Python dataclass or class) including, at a minimum: `id`, `title`, `description`, and `is_completed`.
*   **Type Hinting & Docstrings**: Public functions MUST include type hints and basic docstrings to enhance code comprehension.
*   **Code Formatting**: Consistent code formatting (e.g., Black-style or PEP 8-compatible) MUST be enforced across the entire codebase.
*   **Error Handling**: The application MUST provide clear, helpful, and user-friendly error messages for invalid user input.
*   **AI Sub-Agents and Skills**: Sub-agents and skills MUST read the constitution and relevant specifications first. They MUST then focus only on specific, well-defined tasks such as generating tests, improving error messages, or refactoring existing code, without introducing new features that conflict with the constitution's core principles.

## Development Workflow

*   **Specification**: Specifications (`spec.md`) MUST clearly describe user stories for the application's core features: adding tasks, listing tasks with status indicators, updating task details, deleting tasks by ID, and marking tasks complete/incomplete.
*   **Planning**: The architectural plan (`plan.md`) MUST include details on main modules, key functions, data models, and how CLI commands map to core task operations.
*   **Implementation**: Code implementation MUST strictly follow the generated specification and plan.
*   **Repository Structure**: The project repository MUST contain: `constitution.md`, a `specs` history folder, a `/src` directory with Python source code, `README.md` with UV setup and run instructions, and `CLAUDE.md` explaining how to use Claude Code + Spec-Kit for this project.
*   **README Documentation**: The `README.md` MUST explicitly describe how to install dependencies using UV, how to run the CLI application, and how to execute tests.

## Governance

*   This constitution serves as the ultimate authoritative source for project principles and standards, superseding all other documentation or practices.
*   Amendments to this constitution require explicit documentation, formal approval through the Spec-Kit workflow (including `/sp.specify` and `/sp.plan`), and a clear migration plan if changes introduce backward incompatibilities.
*   All pull requests and code reviews MUST explicitly verify compliance with the principles and standards outlined herein.
*   Any introduction of complexity or deviation from simplicity MUST be rigorously justified and documented.
*   Every AI sub-agent or skill MUST be thoroughly documented within the repository (e.g., in `CLAUDE.md` or a dedicated `agents-and-skills.md` file). They MUST NOT introduce features that conflict with the constitution's established principles (e.g., persistence or a GUI) unless the constitution is officially updated through the formal amendment process.

**Version**: 1.0.2 | **Ratified**: 2025-12-03 | **Last Amended**: 2025-12-03