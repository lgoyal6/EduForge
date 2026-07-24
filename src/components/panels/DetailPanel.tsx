"use client";

import type { RunProjection } from "@/world/runState";
import type { Selection } from "@/components/demo/useEduForge";
import { BuildingDetail } from "./BuildingDetail";
import { EventDetail } from "./EventDetail";
import { LessonPlanDetail } from "./LessonPlanDetail";
import { RoomDetail } from "./RoomDetail";
import { StudentDetail } from "./StudentDetail";
import { EmptyState } from "./atoms";

export function DetailPanel({
  selection,
  projection,
  onSelect,
  onApprove,
}: {
  selection: Selection;
  projection: RunProjection;
  onSelect: (selection: Selection) => void;
  onApprove: (reviewId: string) => void;
}) {
  return (
    <div className="panel panel--detail">
      {selection.kind === "none" && (
        <EmptyState
          title="Nothing selected"
          body="Click any building or student in the world, or any event in the feed, to inspect the structured record behind it."
        />
      )}
      {selection.kind === "student" && (
        <StudentDetail
          studentId={selection.studentId}
          projection={projection}
          onSelect={onSelect}
        />
      )}
      {selection.kind === "room" && (
        <RoomDetail
          roomId={selection.roomId}
          projection={projection}
          onSelect={onSelect}
        />
      )}
      {selection.kind === "event" && (
        <EventDetail
          eventId={selection.eventId}
          projection={projection}
          onSelect={onSelect}
        />
      )}
      {selection.kind === "plan_item" && (
        <LessonPlanDetail
          itemId={selection.itemId}
          projection={projection}
          onSelect={onSelect}
        />
      )}
      {selection.kind === "building" && (
        <BuildingDetail
          id={selection.id}
          projection={projection}
          onSelect={onSelect}
          onApprove={onApprove}
        />
      )}
    </div>
  );
}
