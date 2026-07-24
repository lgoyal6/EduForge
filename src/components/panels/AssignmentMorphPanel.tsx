"use client";

import { useEffect, useMemo, useState } from "react";
import { roomIds, type RoomId } from "@/contracts";
import { ROOM_COLOR } from "@/world/layout";
import { humanize } from "@/world/payloads";
import { membersOfRoom, variantForRoom, type RunProjection } from "@/world/runState";
import { Chip, EmptyState, LabelList } from "./atoms";

type MorphMode = "original" | "room" | "student";

const MODE_LABEL: Record<MorphMode, string> = {
  original: "Original",
  room: "Room Version",
  student: "Student Layer",
};

export function AssignmentMorphPanel({ projection }: { projection: RunProjection }) {
  const [mode, setMode] = useState<MorphMode>("original");
  const [roomId, setRoomId] = useState<RoomId>("ember");
  const [studentId, setStudentId] = useState<string | null>(null);

  const variant = variantForRoom(projection, roomId);
  const members = useMemo(
    () => membersOfRoom(projection, roomId),
    [projection, roomId],
  );

  // Keep the student selector valid as regrouping moves students around.
  useEffect(() => {
    if (members.length === 0) {
      setStudentId(null);
      return;
    }
    if (!studentId || !members.some((member) => member.student_id === studentId)) {
      setStudentId(members[0].student_id);
    }
  }, [members, studentId]);

  const layer = variant?.student_layers?.find(
    (entry) => entry.student_id === studentId,
  );

  const assignment = projection.assignment;

  return (
    <div className="morph">
      <div className="morph__head">
        <h3 className="section__title">Assignment morph</h3>
        {variant && (
          <Chip tone={variant.objective_preserved ? "good" : "bad"}>
            {variant.objective_preserved
              ? "Objective preserved"
              : "Objective changed"}
          </Chip>
        )}
      </div>

      <div className="segmented" role="tablist" aria-label="Assignment view">
        {(Object.keys(MODE_LABEL) as MorphMode[]).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            className={`segmented__option${mode === value ? " segmented__option--active" : ""}`}
            onClick={() => setMode(value)}
          >
            {MODE_LABEL[value]}
          </button>
        ))}
      </div>

      {mode !== "original" && (
        <div className="morph__selectors">
          <div className="morph__rooms">
            {roomIds.map((id) => (
              <button
                key={id}
                type="button"
                className={`room-tab${roomId === id ? " room-tab--active" : ""}`}
                style={roomId === id ? { borderColor: ROOM_COLOR[id] } : undefined}
                onClick={() => setRoomId(id)}
              >
                <span
                  className="room-tab__dot"
                  style={{ background: ROOM_COLOR[id] }}
                  aria-hidden="true"
                />
                {humanize(id)}
              </button>
            ))}
          </div>
          {mode === "student" && (
            <label className="morph__student">
              <span>Student</span>
              <select
                value={studentId ?? ""}
                onChange={(event) => setStudentId(event.target.value)}
              >
                {members.length === 0 && <option value="">No students yet</option>}
                {members.map((member) => (
                  <option key={member.student_id} value={member.student_id}>
                    {member.display_name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      <div className="morph__body">
        {mode === "original" &&
          (assignment ? (
            <>
              <p className="morph__meta">
                {assignment.title} · {assignment.subject} · {assignment.grade_band}
              </p>
              <p className="morph__intent">
                <strong>Teaching intent:</strong> {assignment.teaching_intent}
              </p>
              <ol className="problem-list">
                {assignment.problems.map((problem) => (
                  <li key={problem.problem_id}>
                    <span className="problem__prompt">{problem.prompt}</span>
                    <LabelList values={problem.concepts ?? []} />
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <EmptyState
              title="No assignment yet"
              body="Upload an assignment and start a run. The original text appears here, and the room and student views morph from it."
            />
          ))}

        {mode === "room" &&
          (variant ? (
            <>
              <p className="morph__meta">{variant.title}</p>
              <p className="morph__intent">
                <strong>Objective:</strong> {variant.objective_statement}
              </p>
              <p className="prose">{variant.adaptation_summary}</p>
              <p className="prose muted">{variant.rationale}</p>
              <ol className="problem-list">
                {variant.problems.map((problem) => (
                  <li key={problem.problem_id}>
                    <span className="problem__prompt">{problem.prompt}</span>
                    <LabelList values={problem.concepts ?? []} />
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <EmptyState
              title={`No ${humanize(roomId)} variant yet`}
              body="Room versions appear with the assignment.variants.ready event."
            />
          ))}

        {mode === "student" &&
          (layer ? (
            <>
              <p className="morph__meta">
                {members.find((m) => m.student_id === studentId)?.display_name} ·{" "}
                {humanize(roomId)} version
              </p>
              <p className="morph__intent">
                <strong>Supports applied:</strong>
              </p>
              <LabelList values={layer.supports_applied ?? []} />
              <p className="prose">{layer.delivery_notes}</p>
              <p className="prose muted">
                The mathematics is identical to the {humanize(roomId)} version above.
                Only delivery changes at this layer.
              </p>
              {layer.problems && layer.problems.length > 0 && (
                <ol className="problem-list">
                  {layer.problems.map((problem) => (
                    <li key={problem.problem_id}>
                      <span className="problem__prompt">{problem.prompt}</span>
                    </li>
                  ))}
                </ol>
              )}
            </>
          ) : (
            <EmptyState
              title="No student layer yet"
              body="Accessibility layers attach after the accessibility.layers.ready event."
            />
          ))}
      </div>
    </div>
  );
}
