import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Id } from "../../convex/_generated/dataModel";

export type AppStore = {
  // active tab / mode
  activeTab: "image-edit" | "text-to-image" | "history";
  // current generation ID
  currentGenerationId: Id<"generations"> | null;

  // actions
  setActiveTab: (tab: "image-edit" | "text-to-image" | "history") => void;
  setCurrentGenerationId: (generationId: Id<"generations"> | null) => void;
};

export const useAppStore = create<AppStore>()(
  devtools((set) => ({
    activeTab: "text-to-image",
    setActiveTab: (tab) => set({ activeTab: tab }),
    currentGenerationId: null,
    setCurrentGenerationId: (generationId) =>
      set({ currentGenerationId: generationId }),
  }))
);
