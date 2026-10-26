# EduForge on Guild.ai

We publish one real Guild.ai agent — the **EduForge Lesson Planner** — into a Guild
workspace so our sponsor (Guild AI) can chat with a live, hosted EduForge agent.

Guild.ai is the "control plane for AI agents": agents are authored with
`@guildai/agents-sdk`, run in Guild's sandboxed runtime (only `@guildai/agents-sdk`
+ `zod` allowed), and deploy into a **workspace** inside an **organization**.

## Status

- **Agent created:** `lgoyal6~eduforge-lesson-planner`
  (id `019f96c1-a287-726e-0000-0162fddae351`, owner `lgoyal6`, personal).
- **Project folder:** `../eduforge-lesson-planner/` — its own git repo with remote
  `https://app.guild.ai/git/019f96c1-a287-726e-0000-0162fddae351`.
- **`agent.ts` written and verified:** `npm install` + `tsc --build` pass against the
  real SDK, `dist/agent.js` builds. Not yet saved/published to Guild.

## Remaining steps

```bash
cd ~/TokenHack/eduforge-lesson-planner

# Test in the sandbox
guild agent test "Plan tomorrow's Algebra I lesson. Class averages: integer_operations 0.42, distributive_property 0.61, equation_sequencing 0.55, combining_like_terms 0.70. Ana and Marco moved forge → ember."

# Commit + publish a version to the workspace
git add . && git commit -m "EduForge Lesson Planner v1"
guild agent save --message "EduForge Lesson Planner v1" --wait --publish
```

## Share with the sponsor (Guild AI)

The agent is owned by the **personal** account `lgoyal6`. To let the sponsor see/chat
with it you need it in a shared context:

- If the workspace you selected is inside an **organization**: Guild app →
  **Org Settings → Members → invite by email**. Org members can access all workspaces,
  then chat: `guild workspace chat --agent lgoyal6~eduforge-lesson-planner --once "…"`.
- Otherwise (personal workspace): publish it to the **Agent Hub** so it's discoverable/
  installable, and share the agent handle `lgoyal6~eduforge-lesson-planner`.

## Why the Lesson Planner

Cleanest fit for Guild's headline feature. In EduForge the Lesson Planner finishes with
`human_review_required: true` / `approval_state: "pending"` — the plan is a proposal a
professor must approve. That maps 1:1 onto Guild's human-in-the-loop approval gates, and
the hosted agent always ends its output with "Approval: PENDING — requires professor
review", so the demo tells a real "we used Guild's control plane" story.

## What this is NOT

Does not replace EduForge's in-app agents (plain TS in the Next.js server) or the mock
Guild adapter in `src/server/adapters/guildMock.ts` (which models a control plane but
does not call the real Guild API — different shape). Wiring the Next.js app to *call*
this published agent via Guild's Trigger API is the deferred "Full wire-up" step.

## Repo note

`../eduforge-lesson-planner/` is a nested git repo (points at Guild's git, not our
GitHub). Decide whether to `.gitignore` it or add it as a submodule in the TokenHack
repo — don't `git add` it accidentally as a plain folder.
