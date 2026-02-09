"use server";

import { createServerClientInstance } from "@/utils/supabase/server";
import { createClient } from "@/utils/supabase/client";

export async function readUserSession() {
  const supabase = await createServerClientInstance();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data: memberResult, error: memberError } = await supabase
    .from("members")
    .select("name, role")
    .eq("id", user.id)
    .single();
  if (memberError || !memberResult) return null;
  const { name, role } = memberResult;

  return {
    user,
    role: role as "admin" | "editor" | "developer",
    name,
  };
}

// Client-side funktion til at tjekke om brugeren er admin/developer
export async function checkIsAdminOrDeveloper(): Promise<{
  isAuthorized: boolean;
  userId: string | null;
}> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { isAuthorized: false, userId: null };
    }

    const { data: member } = await supabase
      .from("members")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAuthorized =
      !!member && ["admin", "developer"].includes(member.role);

    return { isAuthorized, userId: user.id };
  } catch (error) {
    console.error("Fejl ved tjek af admin/developer rolle:", error);
    return { isAuthorized: false, userId: null };
  }
}

// Client-side function to fetch and set user session in Zustand store
export async function fetchAndSetUserSession() {
  "use client";

  try {
    const { useAuthStore } = await import("./useAuthStore");
    const session = await readUserSession();

    if (!session) {
      useAuthStore.getState().clearSession();
      return;
    }

    const { user, role } = session;
    useAuthStore.getState().setUser({ id: user.id, email: user.email });
    useAuthStore.getState().setRole(role);
  } catch (err) {
    console.error("fetchAndSetUserSession failed:", err);
    const { useAuthStore } = await import("./useAuthStore");
    useAuthStore.getState().clearSession();
  }
}
