---
id: 0011
title: Constitution Update Phase II Requirements
stage: constitution
date: 2025-12-08
surface: agent
model: claude-sonnet-4-5
feature: none
branch: phase_2
user: system
command: /sp.constitution
labels: ["constitution", "governance", "phase2", "requirements"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - Manual review of constitution changes
---

## Prompt

Update the constitution file to ensure 100% alignment with Phase II requirements. All requirements MUST be mandatory (no optional items). Add missing Better Auth MCP server requirement and ensure all Phase II specifications are explicitly covered.

## Current Issues Identified

1. **Better Auth MCP Server Missing**: Constitution mentions GitHub MCP and Context7 MCP but does NOT mention Better Auth MCP server which is required for Better Auth patterns and configuration.

2. **Optional Items**: Several items are marked as "OPTIONAL" or "MAY" but user requirements state "nothing is optional - we have to do all work":
   - Task search functionality (currently OPTIONAL)
   - Task pagination (currently OPTIONAL)
   - Frontend Dockerfile (currently MAY)
   - docker-compose.yml (currently OPTIONAL)
   - Spec files like architecture.md, mcp-tools.md (currently OPTIONAL)

3. **Missing Explicit Phase II Requirements**:
   - Need explicit statement that ALL 5 Basic Level features MUST be implemented
   - Need explicit statement that ALL Phase II requirements are MANDATORY
   - Need explicit Better Auth MCP server usage requirement

## Response snapshot

Successfully updated the constitution file with comprehensive changes to ensure 100% alignment with Phase II requirements:

### 1. Added Better Auth MCP Server Requirement
- Added Better Auth MCP Server to Technical Standards > MCP Servers section
- Specified it must be used for Better Auth configuration patterns, JWT token management, and authentication best practices
- Updated all MCP server references to include Better Auth server

### 2. Made All Optional Items Mandatory
- Changed Task search functionality from "OPTIONAL but recommended" to "MANDATORY - required for Phase II"
- Changed Task pagination from "OPTIONAL but recommended" to "MANDATORY - required for Phase II"
- Changed Frontend Dockerfile from "MAY have" to "MUST have Dockerfile for containerization and deployment"
- Changed docker-compose.yml from "OPTIONAL" to "MANDATORY - required for Phase II"
- Changed architecture.md and mcp-tools.md from "OPTIONAL" to "MANDATORY - required for Phase II"

### 3. Added Explicit Phase II Mandatory Requirements Section
- Created new section after Core Principles with comprehensive mandatory requirements
- Included Basic Level Functionality (all 5 features required)
- Included RESTful API Endpoints (all required)
- Included Responsive Frontend Interface (required)
- Included Neon Serverless PostgreSQL Database (required)
- Included Better Auth Authentication (required)
- Included Monorepo Structure with Spec-Kit (required)
- Included Security Requirements (all required)
- Included Docker and CI/CD (all required)
- Included MCP Server Usage (all required)

### 4. Updated Frontend and Backend CLAUDE.md Requirements
- Added Better Auth requirement for frontend
- Added Better Auth MCP Server requirement for frontend
- Added API client JWT attachment requirement
- Added JWT Verification requirement for backend
- Added User Isolation requirement for backend
- Added Better Auth Integration requirement for backend

### 5. Updated Governance Section
- Added Phase II Mandatory Requirements section
- Added Better Auth MCP Server Requirement section
- Emphasized all Phase II requirements are mandatory

### 6. Version Bump
- Updated version from 2.2.0 to 2.3.0 (minor version bump due to new sections and requirements)
- Updated last amended date to 2025-12-08

The constitution now fully aligns with Phase II requirements with all items marked as mandatory and includes the missing Better Auth MCP server requirement.

## Outcome

- ✅ Impact: Constitution now fully aligned with Phase II requirements with all items mandatory
- 🧪 Tests: Manual review completed to verify all changes are correct
- 📁 Files: Updated .specify/memory/constitution.md with comprehensive changes
- 🔁 Next prompts: Project can now proceed with Phase II implementation following updated constitution
- 🧠 Reflection: Constitution update ensures all team members have clear understanding of mandatory requirements for Phase II

## Evaluation notes (flywheel)

- Failure modes observed: None - all changes implemented successfully
- Graders run and results (PASS/FAIL): PASS - All requirements properly updated to mandatory
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Update dependent templates to align with new constitution requirements