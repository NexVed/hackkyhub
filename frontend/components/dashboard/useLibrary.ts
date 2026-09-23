"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Saved-state and actions for the signed-in user's library. Convex dedupes
 * identical subscriptions, so every card can call this without extra load.
 */
export function useLibrary() {
  const savedIds = useQuery(api.userLibrary.listSavedIds, {});
  const toggle = useMutation(api.userLibrary.toggleSave);
  const view = useMutation(api.userLibrary.recordView);

  const saved = useMemo(() => new Set<string>(savedIds ?? []), [savedIds]);

  return {
    isSaved: (id: Id<"hackathons">) => saved.has(id),
    toggleSave: (id: Id<"hackathons">) => void toggle({ hackathonId: id }),
    recordView: (id: Id<"hackathons">) => void view({ hackathonId: id }),
  };
}
