"use client";

import { useRef, useState } from "react";
import { mockAssignment } from "@/world/mock/seed";
import type { EduForgeController } from "./useEduForge";

const SPEEDS = [1, 2, 4];

export function CommandRail({ controller }: { controller: EduForgeController }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const {
    assignmentText,
    setAssignmentText,
    teachingIntent,
    setTeachingIntent,
    startRun,
    simulate,
    reset,
    skipAnimation,
    canStart,
    canSimulate,
    stage,
    stageLabel,
    transport,
    backendDetected,
    speed,
    setSpeed,
    notice,
  } = controller;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setAssignmentText(text);
    setFileName(file.name);
    setEditorOpen(true);
  };

  return (
    <header className="rail">
      <div className="rail__brand">
        <span className="rail__logo" aria-hidden="true" />
        <div>
          <h1 className="rail__title">EduForge</h1>
          <p className="rail__tagline">
            Every assignment teaches the student. Every submission rebuilds the school.
          </p>
        </div>
      </div>

      <div className="rail__controls">
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.markdown,text/plain"
          className="rail__file"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        <button
          type="button"
          className="button button--ghost"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload assignment
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => setEditorOpen((value) => !value)}
          aria-expanded={editorOpen}
        >
          {editorOpen ? "Hide text" : "Edit text"}
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={() => void startRun()}
          disabled={!canStart}
        >
          Start run
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={() => void simulate()}
          disabled={!canSimulate}
        >
          Run classroom simulation
        </button>
        <button type="button" className="button button--ghost" onClick={skipAnimation}>
          Skip animation
        </button>
        <button type="button" className="button button--ghost" onClick={reset}>
          Reset demo
        </button>
      </div>

      <div className="rail__status">
        <span className={`badge badge--${transport}`}>
          {transport === "live" ? "Live API + SSE" : "Mock event replay"}
        </span>
        <span className={`badge badge--stage badge--stage-${stage}`}>{stageLabel}</span>
        <div className="rail__speed" role="group" aria-label="Replay speed">
          {SPEEDS.map((value) => (
            <button
              key={value}
              type="button"
              className={`speed${speed === value ? " speed--active" : ""}`}
              onClick={() => setSpeed(value)}
            >
              {value}×
            </button>
          ))}
        </div>
      </div>

      {notice && <p className="rail__notice">{notice}</p>}
      {backendDetected === false && !notice && (
        <p className="rail__notice rail__notice--quiet">
          No backend detected on /api/runs. Running the frozen demo sequence with the
          same AgentEvent contract the live stream uses.
        </p>
      )}

      {editorOpen && (
        <div className="rail__editor">
          <label className="field">
            <span className="field__label">
              Assignment text{fileName ? ` · ${fileName}` : ""}
            </span>
            <textarea
              value={assignmentText}
              onChange={(event) => setAssignmentText(event.target.value)}
              rows={8}
              spellCheck={false}
            />
          </label>
          <label className="field">
            <span className="field__label">Teaching intent</span>
            <textarea
              value={teachingIntent}
              onChange={(event) => setTeachingIntent(event.target.value)}
              rows={3}
            />
          </label>
          <button
            type="button"
            className="chip-button chip-button--tiny"
            onClick={() => {
              setAssignmentText(mockAssignment.source_text);
              setTeachingIntent(mockAssignment.teaching_intent);
              setFileName(null);
            }}
          >
            Restore sample assignment
          </button>
        </div>
      )}
    </header>
  );
}
