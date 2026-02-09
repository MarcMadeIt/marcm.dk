"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export type RealtimeRequest = {
  id?: number | string;
  company?: string | null;
  name?: string | null;
  mail?: string | null;
  message?: string | null;
  category?: string | null;
  created_at?: string | null;
  mobile?: string | null;
  address?: string | null;
  city?: string | null;
  consent?: boolean | null;
};

export function useRequestsRealtime(
  onNewRequest?: (request: RealtimeRequest) => void
) {
  const supabase = createClient();

  useEffect(() => {
    // Opret en channel til at lytte på requests tabellen
    const channel = supabase
      .channel("requests-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "requests",
        },
        (payload) => {
          console.log("Ny request modtaget!", payload.new);

          // Trigger callback hvis den findes
          if (onNewRequest) onNewRequest(payload.new as RealtimeRequest);
        }
      )
      .subscribe();

    // Cleanup når component unmounter
    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNewRequest, supabase]);
}
