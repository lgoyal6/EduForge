"use client";

import { useEffect, useRef } from "react";
import type { AgentEvent } from "@/contracts";
import { humanize } from "@/world/payloads";
import type { RunProjection } from "@/world/runState";
import type { Selection } from "@/components/demo/useEduForge";

const AGENT_TONE: Record<string, string> = {
  assignment_architect: "#ffd45c",
  student_memory_agent: "#7ff0d2",
  grouping_agent: "#9fd0ff",
  accessibility_agent: "#c8ffe6",
  assignment_curator: "#ffb765",
  assessment_agent: "#ff9a6b",
  classroom_evolution_agent: "#d5a6ff",
  lesson_planner: "#a6ff8f",
};

function summarize(event: AgentEvent): string {
  const payload = event.payload ?? {};
  const count = (key: string) =>
    Array.isArray(payload[key]) ? (payload[key] as unknown[]).length : null;

  switch (event.event_type) {
    case "assignment.uploaded":
      return "Assignment received from the professor";
    case "assignment.concepts.extracted":
      return `${count("concepts") ?? 0} concepts extracted`;
    case "student.context.ready":
      return `${count("students") ?? 0} student histories retrieved`;
    case "groups.proposed":
      return `${count("rooms") ?? 0} barrier-based rooms proposed`;
    case "accessibility.layers.ready":
      return `${count("layers") ?? 0} delivery layers attached`;
    case "assignment.variants.ready":
      return `${count("variants") ?? 0} room variants, objective preserved`;
    case "submissions.received":
      return `${count("submissions") ?? 0} submissions received`;
    case "assessment.completed":
      return `${count("assessments") ?? 0} submissions graded`;
    case "student.models.updated":
      return `${count("moves") ?? 0} students re-placed`;
    case "lesson.plan.ready":
      return "Tomorrow's plan generated";
    case "approval.requested":
      return "Low-confidence grade sent for professor review";
    default:
      return humanize(event.event_type);
  }
}

export function AgentFeed({
  projection,
  selection,
  onSelect,
}: {
  projection: RunProjection;
  selection: Selection;
  onSelect: (selection: Selection) => void;
}) {
  const listRef = useRef<HTMLOListElement | null>(null);
  const count = projection.events.length;

  useEffect(() => {
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [count]);

  return (
    <div className="feed">
      <header className="feed__head">
        <h3 className="section__title">Agent event feed</h3>
        <span className="feed__count">{count} events</span>
      </header>
      {count === 0 ? (
        <p className="muted feed__empty">
          No events yet. Start a run to watch the agent mesh emit typed events.
        </p>
      ) : (
        <ol className="feed__list" ref={listRef}>
          {projection.events.map((event) => {
            const active =
              selection.kind === "event" && selection.eventId === event.event_id;
            return (
              <li key={event.event_id}>
                <button
                  type="button"
                  className={`feed__item${active ? " feed__item--active" : ""}`}
                  onClick={() => onSelect({ kind: "event", eventId: event.event_id })}
                >
                  <span
                    className="feed__dot"
                    style={{ background: AGENT_TONE[event.source_agent] ?? "#8899cc" }}
                    aria-hidden="true"
                  />
                  <span className="feed__text">
                    <span className="feed__type">{event.event_type}</span>
                    <span className="feed__summary">{summarize(event)}</span>
                    <span className="feed__agent">{humanize(event.source_agent)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
