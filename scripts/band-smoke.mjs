#!/usr/bin/env node
/**
 * Band live-integration smoke test.
 *
 * Verifies your real band.ai credentials end to end WITHOUT running the app:
 *   1. GET  /api/v1/agent/me   → confirms the key + agent id
 *   2. POST /api/v1/agent/chats → creates a room
 *   3. POST .../events         → posts a few EduForge-shaped agent events
 *
 * Usage (from the repo root):
 *   BAND_API_KEY=... BAND_AGENT_ID=... node scripts/band-smoke.mjs
 *
 * Then open the printed room URL in https://app.band.ai to watch the events.
 */

const apiKey = process.env.BAND_API_KEY;
const agentId = process.env.BAND_AGENT_ID;
const restUrl = (process.env.BAND_REST_URL ?? "https://app.band.ai").replace(/\/$/, "");

if (!apiKey || !agentId) {
  console.error("Missing BAND_API_KEY and/or BAND_AGENT_ID. Create a Remote Agent at");
  console.error("https://app.band.ai/agents, then re-run:");
  console.error("  BAND_API_KEY=... BAND_AGENT_ID=... node scripts/band-smoke.mjs");
  process.exit(1);
}

const MARKER = "\n\n⟦eduforge-event⟧";
const encode = (event) => `${event.source_agent} → ${event.event_type}${MARKER}${JSON.stringify(event)}`;

async function api(method, path, body) {
  const res = await fetch(`${restUrl}${path}`, {
    method,
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${await res.text().catch(() => "")}`);
  }
  return res.status === 204 ? undefined : res.json();
}

const sampleRun = `smoke_${Date.now()}`;
const sampleEvents = [
  { event_type: "assignment.uploaded", source_agent: "assignment_architect" },
  { event_type: "assignment.concepts.extracted", source_agent: "assignment_architect", payload: { concepts: ["integer_operations"] } },
  { event_type: "groups.proposed", source_agent: "grouping_agent", payload: { rooms: 4 } },
  { event_type: "lesson.plan.ready", source_agent: "lesson_planner" },
];

try {
  const me = await api("GET", "/api/v1/agent/me");
  const identity = me.data ?? me;
  console.log(`✓ Authenticated as: ${identity.name ?? identity.handle ?? identity.id}`);

  const created = await api("POST", "/api/v1/agent/chats", {
    chat: { title: `EduForge smoke · ${sampleRun}` },
  });
  const roomId = created.data.id;
  console.log(`✓ Created Band room: ${roomId}`);

  for (const partial of sampleEvents) {
    const event = {
      event_id: `evt_${sampleEvents.indexOf(partial) + 1}`,
      run_id: sampleRun,
      timestamp: new Date().toISOString(),
      payload: {},
      ...partial,
    };
    await api("POST", `/api/v1/agent/chats/${roomId}/events`, {
      event: { content: encode(event), message_type: "thought" },
    });
    console.log(`  → posted ${event.source_agent} / ${event.event_type}`);
  }

  console.log(`✓ Posted ${sampleEvents.length} events to the room`);
  console.log(`\nOpen it: ${restUrl}/chats/${roomId}`);
  console.log("Band is live. 🎸");
} catch (error) {
  console.error("\n✗ Smoke test failed:", error.message);
  process.exit(1);
}
