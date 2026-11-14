---
name: skill-smart
description: Design, build, and extend the SIHU Agent retrieval-first assistant. Use when working on the SIHU chat assistant, Next.js server routes, Supabase knowledge base, semantic search, chat history, deterministic response logic, or LLM-free agent workflows.
---

# SIHU Agent

## Purpose
Use this skill when implementing or refining the SIHU Agent system: a Next.js-based assistant that answers questions through retrieval, intent detection, memory, and deterministic templates instead of external LLM APIs.

## Default Product Assumptions
- Frontend: Next.js chat interface
- Backend: Next.js route handlers and server utilities
- Database: Supabase Postgres
- Retrieval: embedding-based semantic search
- Memory: session-based chat history
- Response generation: deterministic templates
- Tone: expert, concise, factual
- Constraint: do not depend on external LLM APIs for MVP behavior

## Core Workflow
For each user message, follow this order:

1. Detect intent using:
   - rule-based matching first
   - semantic similarity fallback second
2. Retrieve top-k knowledge from Supabase before answering.
3. Retrieve recent chat history for the same `session_id`.
4. Build a response from:
   - retrieved knowledge
   - matched intent
   - response templates
   - recent memory when relevant
5. Store the user/assistant exchange in chat history.

Do not skip retrieval unless the task is purely operational, such as health checks or schema setup.

## Intent Categories
Use these default classes unless the codebase defines a richer set:
- `knowledge_query`
- `semantic_search`
- `general_chat`
- `unknown`

## Response Rules
- Prefer structured factual answers over conversational filler.
- Keep answers short unless the user asks for detail.
- If knowledge is found, summarize the most relevant facts first.
- If knowledge is missing, say so clearly and suggest adding knowledge.
- Do not fabricate facts to fill gaps.

## Fallback Template
Use a response like this when retrieval is insufficient:

```text
I do not have enough stored knowledge to answer that confidently.
You can add the missing information to the knowledge base and try again.
```

## Memory Rules
- Store every conversation pair.
- Use `session_id` to separate users.
- Default to the last 10 messages for context unless the implementation requires another window size.
- Treat memory as context support, not as a higher authority than the knowledge base.

## Knowledge Rules
- Query Supabase before answering domain questions.
- Use vector similarity search with top-k retrieval.
- Prefer structured knowledge and metadata-backed results.
- If the knowledge base is empty, return a clean fallback response instead of a generic error.

## API Expectations
The default MVP backend should expose:
- `POST /chat`
- `POST /add-knowledge`
- `GET /history/{session_id}`

Suggested request/response behavior:
- `/chat`: accept `session_id` and `message`, return response text, intent, and optional sources
- `/add-knowledge`: accept content and metadata, embed and store it
- `/history/{session_id}`: return recent conversation records

## Data Model Defaults
### `knowledge_base`
- `id`
- `content`
- `embedding`
- `type`
- `source` optional
- `created_at`

### `chat_history`
- `id`
- `session_id`
- `user_message`
- `bot_response`
- `intent`
- `timestamp`

## Architecture Guidance
Keep the code modular:
- `intent/` for classification logic
- `retrieval/` for embeddings and vector queries
- `memory/` for chat history access
- `responses/` for templates and formatting
- `api/` for Next.js route handlers

For Next.js:
- keep the chat UI thin
- push reasoning to the backend
- use mobile-first layout and loading states

## Build Priorities
When implementing from scratch, prefer this order:
1. Supabase schema
2. embedding generation
3. retrieval query path
4. Next.js route handlers
5. deterministic response builder
6. chat UI
7. session persistence

## Future-Ready Hooks
Design placeholders for tools, but do not fully activate them in MVP:
- `search_knowledge()`
- `store_knowledge()`
- `retrieve_chat_history()`
- `tool_router()`

These should make later integrations possible for:
- IPFS
- blockchain actions
- third-party APIs

## Implementation Constraints
- Avoid adding LLM SDKs unless the user explicitly asks.
- Keep the first version simple and production-readable.
- Prefer deterministic behavior over clever but opaque logic.
- Document environment variables and schema requirements.

## Example Build Prompt
Use or adapt this when scaffolding SIHU Agent:

```text
Build a full-stack AI system called SIHU Agent.

Architecture:
- Frontend: Next.js simple chat interface
- Backend: Next.js route-based agent system
- Database: Supabase with vector embeddings

Requirements:
- Create /chat, /add-knowledge, and /history/{session_id}
- Use hybrid intent detection: rules first, semantic similarity second
- Always retrieve relevant Supabase context before answering
- Store chat history per session
- Use deterministic response templates
- Do not use external LLM APIs
- Keep the UI lightweight, modular, and mobile-first
```

## Output Style
When acting as SIHU Agent or building its responses:
- expert
- direct
- structured
- factual
- low-fluff
