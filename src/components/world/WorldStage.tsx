"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BASE_H, BASE_W, tileToScreen } from "@/world/iso";
import { WORLD_LAYOUT, centerOf } from "@/world/layout";
import { hitTest, toBaseCanvasPoint } from "@/world/hitTest";
import type { WorldEngine } from "@/world/engine";
import type { WorldSelection } from "@/world/types";
import type { Selection } from "@/components/demo/useEduForge";
import type { RunProjection } from "@/world/runState";

type Props = {
  engine: WorldEngine;
  projection: RunProjection;
  selection: Selection;
  onSelect: (selection: Selection) => void;
};

type LabelPosition = {
  id: string;
  label: string;
  caption: string;
  leftPercent: number;
  topPercent: number;
  roomId?: string;
};

function toSelection(world: WorldSelection): Selection {
  switch (world.kind) {
    case "student":
      return { kind: "student", studentId: world.studentId };
    case "room":
      return { kind: "room", roomId: world.roomId };
    case "building":
      return { kind: "building", id: world.id };
    default:
      return { kind: "none" };
  }
}

function toWorldSelection(selection: Selection): WorldSelection {
  switch (selection.kind) {
    case "room":
      return { kind: "room", roomId: selection.roomId };
    case "building":
      return { kind: "building", id: selection.id };
    case "student":
      return { kind: "student", studentId: selection.studentId };
    default:
      return { kind: "none" };
  }
}

export function WorldStage({ engine, projection, selection, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showLabels, setShowLabels] = useState(true);

  const attach = useCallback(
    (node: HTMLCanvasElement | null) => {
      canvasRef.current = node;
      if (node) engine.attach(node);
      else engine.detach();
    },
    [engine],
  );

  useEffect(() => {
    engine.setSelected(toWorldSelection(selection));
  }, [engine, selection]);

  const labels = useMemo<LabelPosition[]>(
    () =>
      WORLD_LAYOUT.filter((spec) => spec.id !== "central_table").map((spec) => {
        const center = centerOf(spec);
        const point = tileToScreen(center.x, center.y, spec.height + 14);
        return {
          id: spec.id,
          label: spec.label,
          caption: spec.caption,
          leftPercent: (point.sx / BASE_W) * 100,
          topPercent: (point.sy / BASE_H) * 100,
          roomId: spec.roomId,
        };
      }),
    [],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const point = toBaseCanvasPoint(canvas, event.clientX, event.clientY);
      const hit = hitTest(engine.getState(), point.sx, point.sy);
      engine.setHover(hit);
      canvas.style.cursor = hit.kind === "none" ? "default" : "pointer";
    },
    [engine],
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const point = toBaseCanvasPoint(canvas, event.clientX, event.clientY);
      onSelect(toSelection(hitTest(engine.getState(), point.sx, point.sy)));
    },
    [engine, onSelect],
  );

  const roomHeadcount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const roomId of Object.values(projection.studentRoom)) {
      counts[roomId] = (counts[roomId] ?? 0) + 1;
    }
    return counts;
  }, [projection.studentRoom]);

  return (
    <div className="stage">
      <div className="stage__frame">
        <canvas
          ref={attach}
          className="stage__canvas"
          width={BASE_W}
          height={BASE_H}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => engine.setHover({ kind: "none" })}
          onClick={handleClick}
          aria-label="EduForge isometric school world"
          role="img"
        />
        {showLabels && (
          <div className="stage__labels" aria-hidden="true">
            {labels.map((label) => {
              const isSelected =
                (selection.kind === "building" && selection.id === label.id) ||
                (selection.kind === "room" && `room_${selection.roomId}` === label.id);
              const count = label.roomId ? roomHeadcount[label.roomId] : undefined;
              return (
                <button
                  key={label.id}
                  type="button"
                  className={`stage__label${label.roomId ? " stage__label--room" : ""}${
                    isSelected ? " stage__label--active" : ""
                  }`}
                  style={{ left: `${label.leftPercent}%`, top: `${label.topPercent}%` }}
                  onClick={() =>
                    onSelect(
                      label.roomId
                        ? { kind: "room", roomId: label.roomId as never }
                        : { kind: "building", id: label.id as never },
                    )
                  }
                  tabIndex={-1}
                >
                  <span className="stage__label-name">{label.label}</span>
                  {count !== undefined && (
                    <span className="stage__label-count">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="stage__footer">
        <button
          type="button"
          className="chip-button"
          onClick={() => setShowLabels((value) => !value)}
        >
          {showLabels ? "Hide labels" : "Show labels"}
        </button>
        <p className="stage__hint">
          Click a building or a student in the world to inspect it.
        </p>
      </div>

      {/* Keyboard/screen-reader route to the same selections the canvas offers. */}
      <div className="stage__a11y">
        <span className="stage__a11y-title">Jump to</span>
        {WORLD_LAYOUT.filter((spec) => spec.id !== "central_table").map((spec) => (
          <button
            key={spec.id}
            type="button"
            className="chip-button chip-button--tiny"
            onClick={() =>
              onSelect(
                spec.roomId
                  ? { kind: "room", roomId: spec.roomId }
                  : { kind: "building", id: spec.id },
              )
            }
          >
            {spec.label}
          </button>
        ))}
      </div>
    </div>
  );
}
