---
id: 0013
title: Constitution Update Phase III AI Chatbot
stage: constitution
date: 2025-12-14
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: master
user: system
command: /sp.constitution
labels: ["constitution", "phase-3", "ai-chatbot", "mcp-tools", "openai-agents", "chatkit"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - none
---

## Prompt

Update the project constitution at `.specify/memory/constitution.md` to include **Phase III: AI-Powered Todo Chatbot** requirements. All Phase 3 requirements are **MANDATORY - nothing is optional**.

### Phase III Mandatory Requirements Section

Add a new section **"Phase III Mandatory Requirements"** immediately after the "Phase II Mandatory Requirements" section. This section MUST include:

#### AI Chatbot Functionality (All Required)
All AI chatbot features MUST be implemented:
1. **Conversational Interface** - Users MUST be able to manage tasks through natural language conversation
2. **Natural Language Task Management** - All 5 Basic Level features (Add, List, Complete, Delete, Update) MUST work via natural language commands
3. **Conversation Persistence** - All conversations MUST be persisted to database (stateless server architecture)
4. **Streaming Responses** - Chat responses MUST stream in real-time using Server-Sent Events (SSE)
5. **Conversation Context** - Chatbot MUST maintain conversation context across multiple messages
6. **Error Handling** - Chatbot MUST provide helpful error messages when commands cannot be understood
7. **Action Confirmations** - Chatbot MUST confirm all successful task operations with friendly responses

#### Technology Stack (All Required)
- **Frontend Chat Interface**: OpenAI ChatKit MUST be used for the conversational UI
- **Backend AI Framework**: OpenAI Agents SDK MUST be used for AI logic and agent orchestration
- **MCP Server**: Official MCP SDK MUST be used to build MCP server with task operations as tools
- **Database Models**: New models MUST be added: Conversation and Message (in addition to existing Task model)
- **Stateless Architecture**: Chat endpoint MUST be stateless - all conversation state persisted to database
- **Authentication**: Better Auth JWT authentication MUST be used (same as Phase 2)

[Full prompt content with all requirements as specified in user input...]

## Response snapshot

Constitution successfully updated to version 3.0.0 with comprehensive Phase III requirements:

1. **Phase III Mandatory Requirements Section Added**:
   - AI Chatbot Functionality (7 required features)
   - Technology Stack requirements (ChatKit, OpenAI Agents SDK, MCP SDK)
   - Database Models (Conversation and Message models)
   - Chat API Endpoint specification
   - MCP Tools (5 required tools: add_task, list_tasks, complete_task, delete_task, update_task)
   - Agent Behavior requirements
   - Conversation Flow (stateless request cycle)
   - Natural Language Commands patterns
   - OpenAI ChatKit Setup
   - Architecture Requirements (stateless, scalable, resilient)
   - Service Layer requirements
   - Agent Integration requirements
   - Environment Variables (LLM providers, API keys)
   - Dependencies (openai-agents, mcp, @openai/chatkit)
   - Project Structure Updates
   - Success Criteria (8 required metrics)

2. **New Principle XII Added**: AI-Powered Conversational Interface
   - Establishes natural language interface as core principle
   - Mandates OpenAI Agents SDK, MCP server, and ChatKit
   - Requires conversation persistence and stateless architecture

3. **Technical Standards Updated**:
   - Added AI Framework (OpenAI Agents SDK)
   - Added MCP Server (Official MCP SDK)
   - Added Chat Frontend (OpenAI ChatKit)
   - Added Streaming (SSE)
   - Added Stateless Architecture requirement

4. **Development Workflow Updated**:
   - Added Phase 3 development steps
   - Added MCP tools implementation requirement
   - Added Agent development requirement
   - Added Chat endpoint requirement
   - Added Service layer extraction requirement

5. **Repository Structure Updated**:
   - Added /backend/src/agents/ directory
   - Added /backend/src/mcp/ directory
   - Added /backend/src/services/ directory
   - Added conversation and message models
   - Added chat router and schemas
   - Added /frontend/src/components/chatkit/ directory
   - Added /frontend/src/app/chat/ directory
   - Updated specs structure with chatbot.md, chat-endpoint.md

6. **Spec-Kit Plus Configuration Updated**:
   - Version updated to 3.0.0
   - Added phase3-chatbot: features: [task-crud, authentication, chatbot]

7. **Governance Section Updated**:
   - Added Phase III Mandatory Requirements enforcement
   - Added Stateless Architecture Requirement
   - Added MCP Server Requirement (for task operations)

8. **Version Update**: 2.3.0 → 3.0.0 (MAJOR bump)
   - Last Amended: 2025-12-14

## Outcome

- ✅ Impact: MAJOR constitution update establishing Phase III requirements. All AI chatbot functionality, MCP tools, conversation persistence, streaming responses, and agent behaviors are now mandatory. Constitution provides complete specification for AI-powered todo chatbot implementation.
- 🧪 Tests: No tests required for constitution document
- 📁 Files: 1 file modified (.specify/memory/constitution.md)
- 🔁 Next prompts:
  - Create chatbot.md specification in /specs/features/
  - Create chat-endpoint.md specification in /specs/api/
  - Update or create mcp-tools.md specification in /specs/api/
  - Review and update templates to align with Phase III requirements
  - Begin Phase III implementation following spec-driven workflow
- 🧠 Reflection: This is a comprehensive constitution update that establishes Phase III as a mandatory requirement with complete technical specifications. The update maintains consistency with Phase II patterns while introducing new AI-powered capabilities through OpenAI Agents SDK, MCP server, and ChatKit. All requirements are explicitly marked as MANDATORY to ensure complete implementation.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): PASS - All sections updated, version bumped correctly, all placeholders resolved
- Prompt variant (if applicable): constitution-update-v3
- Next experiment (smallest change to try): Create initial chatbot specification document following Phase III requirements
