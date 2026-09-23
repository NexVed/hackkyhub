"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { setActiveAction } from "@/lib/store/sidebarSlice";

const STORAGE_KEY = "hackkyhub-theme";

/**
 * The sidebar already ships a Sun/Moon toggle wired to `sidebar.activeAction`,
 * but nothing ever applied the `.dark` class that every `dark:` variant in the
 * app depends on. This bridges that state to the document and remembers the
 * choice across reloads.
 */
export function ThemeSync() {
  const dispatch = useAppDispatch();
  const activeAction = useAppSelector((state) => state.sidebar.activeAction);

  // Adopt the persisted choice once on mount.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Private mode or blocked storage: fall back to the store default.
    }
    if (stored === "sun" || stored === "moon") {
      dispatch(setActiveAction(stored));
    }
  }, [dispatch]);

  useEffect(() => {
    const isDark = activeAction === "moon";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    try {
      window.localStorage.setItem(STORAGE_KEY, activeAction);
    } catch {
      // Persisting is best-effort.
    }
  }, [activeAction]);

  return null;
}

/**
 * Runs before first paint so a dark-mode user never sees a white flash.
 * Kept as a string because it must execute ahead of React hydration.
 */
export const themeBootstrapScript = `
(function () {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var isDark = stored ? stored === 'moon' : true;
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  } catch (e) {}
})();
`;

export default ThemeSync;
