"use client";

import { eventTypes, type EventType } from "@/contracts";
import type { RunProjection } from "@/world/runState";
import type { Selection } from "./useEduForge";

const SHORT_LABEL: Record<EventType, string> = {
  "assignment.uploaded": "Upload",
  "assignment.concepts.extracted": "Concepts",
  "student.context.ready": "Memory",
  "groups.proposed": "Rooms",
  "accessibility.layers.ready": "Supports",
  "assignment.variants.ready": "Variants",
  "submissions.received": "Submissions",
  "assessment.completed": "Assessment",
  "student.models.updated": "Mastery",
  "lesson.plan.ready": "Tomorrow",
  "approval.requested": "Review",
};

/**
 * One dot per contract event. Judges can see at a glance which parts of the
 * pipeline have fired, and click straight to the payload that produced them.
 */
export function PhaseTimeline({
  projection,
  onSelect,
}: {
  projection: RunProjection;
  onSelect: (selection: Selection) => void;
}) {
  const seen = new Map<EventType, string>();
  for (const event of projection.events) {
    if (!seen.has(event.event_type)) seen.set(event.event_type, event.event_id);
  }

  return (
    <ol className="timeline" aria-label="Run progress">
      {eventTypes.map((eventType) => {
        const eventId = seen.get(eventType);
        return (
          <li key={eventType} className="timeline__step">
            <button
              type="button"
              className={`timeline__dot${eventId ? " timeline__dot--done" : ""}`}
              disabled={!eventId}
              onClick={() => eventId && onSelect({ kind: "event", eventId })}
              title={eventType}
            >
              <span className="timeline__label">{SHORT_LABEL[eventType]}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
