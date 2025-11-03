import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { AspectRatio } from "@/lib/constants";
import type { Id } from "../../convex/_generated/dataModel";

export type AppStore = {
  // active tab / mode
  activeTab: "image-edit" | "text-to-image" | "history";
  // current generation ID
  currentGenerationId: Id<"generations"> | null;
  // form state
  formPrompt: string;
  formAspectRatio: AspectRatio;
  formNumberOfImages: number;
  formReferenceImages: string[];

  // navbar opened state
  navbarOpened: boolean;
  toggleNavbar: () => void;

  // actions
  navigateTo: (tab: "image-edit" | "text-to-image" | "history") => void;
  setCurrentGenerationId: (generationId: Id<"generations"> | null) => void;
  resetForm: () => void;
  setFormPrompt: (prompt: string) => void;
  setFormReferenceImage: (imageUrl: string) => void;
  setFormAspectRatio: (aspectRatio: AspectRatio) => void;
  setFormNumberOfImages: (numberOfImages: number) => void;
  setFormReferenceImages: (images: string[]) => void;
  loadGenerationToForm: (
    prompt: string,
    aspectRatio: AspectRatio,
    model: string
  ) => void;
};

const initialFormState = {
  formPrompt: "",
  formAspectRatio: "1:1" as AspectRatio,
  formNumberOfImages: 1,
  formReferenceImages: [],
};

export const useAppStore = create<AppStore>()(
  devtools((set) => ({
    activeTab: "text-to-image",
    navbarOpened: false,

    toggleNavbar: () => set((state) => ({ navbarOpened: !state.navbarOpened })),
    navigateTo: (tab) => set({ activeTab: tab, navbarOpened: false }),

    currentGenerationId: null,
    setCurrentGenerationId: (generationId) =>
      set({ currentGenerationId: generationId }),
    ...initialFormState,
    resetForm: () =>
      set({
        ...initialFormState,
        currentGenerationId: null,
      }),
    setFormPrompt: (prompt) => set({ formPrompt: prompt }),
    setFormReferenceImage: (imageUrl) =>
      set({ formReferenceImages: [imageUrl] }),
    setFormAspectRatio: (aspectRatio) => set({ formAspectRatio: aspectRatio }),
    setFormNumberOfImages: (numberOfImages) =>
      set({ formNumberOfImages: numberOfImages }),
    setFormReferenceImages: (images) => set({ formReferenceImages: images }),
    loadGenerationToForm: (prompt, aspectRatio, model) =>
      set({
        formPrompt: prompt,
        formAspectRatio: aspectRatio,
        activeTab:
          model === "fal-ai/nano-banana/edit" ? "image-edit" : "text-to-image",
        currentGenerationId: null,
        formReferenceImages: [],
      }),
  }))
);
