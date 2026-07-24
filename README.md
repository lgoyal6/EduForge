# TokenHack EduForge

Hackathon prototype for the Self-Evolving Agents Hackathon.

EduForge is a self-evolving classroom intelligence system shown as a 2D isometric pixel school. A professor uploads one Algebra I assignment. A multi-agent loop extracts objectives, retrieves student memory, creates temporary learning rooms, generates room-specific assignment variants, simulates submissions, updates mastery, and produces tomorrow's teaching plan.

The goal is one polished vertical slice, not a full LMS.

## Build Strategy

Use a branch-per-owner workflow with frozen contracts so four people can work in parallel and merge without archaeology.

Primary references:

- Frontend world: https://github.com/twofactor/pogicity-demo
- Agent/API reference: https://github.com/agentailor/fullstack-langgraph-nextjs-agent
- Mastery engine: https://github.com/RudrenduPaul/MasteryTrace
- Model SDK option: https://github.com/vercel/ai
- Lightweight agent SDK option: https://github.com/openai/openai-agents-js

License note: copy only from repositories with explicit compatible licenses. Public GitHub without a license is reference-only.

## Branches

- `person-a/frontend-world`: isometric school world, UI, design, animations, demo experience.
- `person-b/backend-core-loop`: run creation, seed data, assignment analysis, memory retrieval, grouping, accessibility, variants.
- `person-c/backend-assessment-evolution`: simulated submissions, grading, misconception detection, mastery updates, room evolution, lesson plan.
- `person-d/backend-infra-integrations`: event bus, SSE, audit trail, sponsor adapters, env config, CI.
- `integration/demo-polish`: final merge branch, QA, bug fixes, demo script.

Start from the same scaffold commit. Do not branch from each other.

## Documents

- [SOTA build plan](docs/SOTA_BUILD_PLAN.md)
- [Shared contracts](docs/CONTRACTS.md)
- [Person A plan](docs/PERSON_A_FRONTEND_WORLD.md)
- [Person B plan](docs/PERSON_B_BACKEND_CORE_LOOP.md)
- [Person C plan](docs/PERSON_C_BACKEND_ASSESSMENT_EVOLUTION.md)
- [Person D plan](docs/PERSON_D_BACKEND_INFRA_INTEGRATIONS.md)
- [Integration and merge protocol](docs/INTEGRATION_PROTOCOL.md)

## Non-Goals

- No auth.
- No full LMS.
- No parent portal.
- No handwriting OCR.
- No real 3D engine.
- No production-grade student privacy model for hackathon demo data.

The demo must run from a fixed seed with no external-data surprises.
