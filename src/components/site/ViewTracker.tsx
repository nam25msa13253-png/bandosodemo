"use client";
import { useEffect } from "react";
import { track } from "./TrackLink";

export function ViewTracker({ placeId }: { placeId: string }) {
  useEffect(() => {
    track(placeId, "view");
  }, [placeId]);
  return null;
}
