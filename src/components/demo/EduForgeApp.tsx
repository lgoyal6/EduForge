"use client";

import { AgentFeed } from "@/components/panels/AgentFeed";
import { AssignmentMorphPanel } from "@/components/panels/AssignmentMorphPanel";
import { DetailPanel } from "@/components/panels/DetailPanel";
import { WorldStage } from "@/components/world/WorldStage";
import { CommandRail } from "./CommandRail";
import { PhaseTimeline } from "./PhaseTimeline";
import { useEduForge } from "./useEduForge";

export function EduForgeApp() {
  const controller = useEduForge();
  const { engine, projection, selection, setSelection, approve } = controller;

  return (
    <div className="app">
      <CommandRail controller={controller} />

      <main className="app__main">
        <div className="app__world">
          <PhaseTimeline projection={projection} onSelect={setSelection} />
          <WorldStage
            engine={engine}
            projection={projection}
            selection={selection}
            onSelect={setSelection}
          />
          <AssignmentMorphPanel projection={projection} />
        </div>

        <aside className="app__side">
          <DetailPanel
            selection={selection}
            projection={projection}
            onSelect={setSelection}
            onApprove={(reviewId) => void approve(reviewId)}
          />
          <AgentFeed
            projection={projection}
            selection={selection}
            onSelect={setSelection}
          />
        </aside>
      </main>
    </div>
  );
}
