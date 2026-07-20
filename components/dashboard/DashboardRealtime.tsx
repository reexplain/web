"use client";

import { useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import MasteryGraph from "@/components/dashboard/MasteryGraph";
import PracticeConcepts from "@/components/dashboard/PracticeConcepts";
import SavedSessions from "@/components/dashboard/SavedSessions";
import type { DashboardRealtimeProps, DashboardSnapshot } from "@/types/dashboard";

const DashboardRealtime = ({ initialSnapshot }: DashboardRealtimeProps) => {
  const { isAuthenticated } = useConvexAuth();
  const liveSnapshot = useQuery(
    api.sessions.getDashboardCurrentUser,
    isAuthenticated ? {} : "skip",
  );
  const [mutationResult, setMutationResult] = useState<{
    snapshot: DashboardSnapshot;
    precedingLiveSnapshot: DashboardSnapshot | undefined;
  }>();
  const mutationIsNewer =
    mutationResult !== undefined &&
    mutationResult.precedingLiveSnapshot === liveSnapshot;
  const snapshot = mutationIsNewer
    ? mutationResult.snapshot
    : liveSnapshot ?? mutationResult?.snapshot ?? initialSnapshot;

  return (
    <>
      <MasteryGraph graph={snapshot.masteryGraph} />
      <PracticeConcepts excerpts={snapshot.practiceExcerpts} />
      <SavedSessions
        onSnapshotChange={(nextSnapshot) => {
          setMutationResult({
            snapshot: nextSnapshot,
            precedingLiveSnapshot: liveSnapshot,
          });
        }}
        sessions={snapshot.sessions}
      />
    </>
  );
};

export default DashboardRealtime;