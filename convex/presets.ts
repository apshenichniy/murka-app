import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

const MAX_PRESETS_PER_USER = 50;
const MAX_TAGS_PER_PRESET = 6;
const MAX_NAME_LENGTH = 64;
const MIN_NAME_LENGTH = 2;
const MIN_PROMPT_LENGTH = 10;
const ALLOWED_VISIBILITIES = ["private", "public"] as const;
const ALLOWED_ASPECT_RATIOS = new Set([
  "1:1",
  "4:3",
  "3:2",
  "2:3",
  "5:4",
  "4:5",
  "3:4",
  "16:9",
  "9:16",
  "21:9",
]);

type PresetVisibility = (typeof ALLOWED_VISIBILITIES)[number];

type ClientPreset = {
  id: string;
  name: string;
  prompt: string;
  description: string;
  tags: string[];
  visibility: PresetVisibility | "system";
  isDefault: boolean;
  isSystem: boolean;
  isOwner: boolean;
  isFavorite: boolean;
  usageCount: number;
  aspectRatio: string | null;
  numberOfImages: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type SystemPreset = {
  id: string;
  name: string;
  prompt: string;
  description: string;
  tags: string[];
  aspectRatio: string | null;
  numberOfImages: number | null;
};

const DEFAULT_STYLE_PACKS: SystemPreset[] = [
  {
    id: "system:cinematic-dusk",
    name: "Cinematic Dusk",
    prompt:
      "Create an image of a lone explorer overlooking a neon-lit valley at dusk. Style: cinematic concept art with dramatic rim lighting. Lighting: warm horizon glow with cool ambient shadows. Mood: adventurous and hopeful. Colors: teal, amber, and magenta highlights. Perspective: wide-angle lens with slight tilt. Additional details: volumetric fog, particle embers, high contrast depth.",
    description:
      "Rich cinematic palette with dramatic lighting for epic landscapes and hero shots.",
    tags: ["cinematic", "dramatic", "landscape"],
    aspectRatio: "21:9",
    numberOfImages: 1,
  },
  {
    id: "system:studio-portrait",
    name: "Studio Portrait",
    prompt:
      "Create an image of a poised subject in a modern studio setting. Style: hyperrealistic portrait photography. Lighting: softbox key light with subtle fill and hair light. Mood: confident and refined. Colors: neutral backdrop with gentle warm accents. Perspective: 85mm portrait lens at eye level. Additional details: shallow depth of field, crisp facial features, refined textures.",
    description:
      "Photorealistic portrait baseline ideal for character and fashion concepts.",
    tags: ["portrait", "photorealistic", "studio"],
    aspectRatio: "3:4",
    numberOfImages: 1,
  },
  {
    id: "system:watercolor-storybook",
    name: "Watercolor Storybook",
    prompt:
      "Create an image of whimsical characters exploring a forest clearing. Style: hand-painted watercolor illustration with visible brush grain. Lighting: soft morning glow through trees. Mood: playful and heartwarming. Colors: pastel greens, coral pinks, and sky blues. Perspective: slightly elevated vignette. Additional details: layered washes, gentle texture, white ink highlights.",
    description:
      "Soft watercolor aesthetic for children’s book scenes and gentle storytelling.",
    tags: ["illustration", "watercolor", "whimsical"],
    aspectRatio: "4:5",
    numberOfImages: 1,
  },
  {
    id: "system:neo-noir",
    name: "Neo Noir Streets",
    prompt:
      "Create an image of rain-soaked city streets with reflective puddles at night. Style: neo-noir photography with cinematic contrast. Lighting: neon signage casting saturated reflections. Mood: mysterious and tense. Colors: electric cyan, magenta, and deep indigo. Perspective: low-angle 35mm lens tracking shot. Additional details: wet asphalt, light streaks, subtle fog.",
    description:
      "High-contrast urban baseline for moody environments and sci-fi cityscapes.",
    tags: ["noir", "urban", "moody"],
    aspectRatio: "16:9",
    numberOfImages: 1,
  },
];

const sanitizeName = (name: string) => name.trim();
const sanitizeDescription = (description?: string) => description?.trim() ?? "";
const sanitizeTags = (tags?: string[]) =>
  Array.from(
    new Set(
      (tags ?? [])
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .slice(0, MAX_TAGS_PER_PRESET)
    )
  );

const normalizeAspectRatio = (aspectRatio?: string | null) => {
  if (!aspectRatio) {
    return null;
  }
  if (!ALLOWED_ASPECT_RATIOS.has(aspectRatio)) {
    throw new Error("Unsupported aspect ratio for preset.");
  }
  return aspectRatio;
};

const normalizeNumberOfImages = (numberOfImages?: number | null) => {
  if (numberOfImages === undefined || numberOfImages === null) {
    return null;
  }
  if (!Number.isInteger(numberOfImages) || numberOfImages < 1 || numberOfImages > 4) {
    throw new Error("Number of images must be an integer between 1 and 4.");
  }
  return numberOfImages;
};

const formatPresetDoc = (doc: Doc<"presets">, viewerId: string): ClientPreset => ({
  id: doc._id,
  name: doc.name,
  prompt: doc.prompt,
  description: doc.description,
  tags: doc.tags,
  visibility: doc.visibility,
  isDefault: doc.isDefault,
  isSystem: doc.isSystem,
  isOwner: doc.userId === viewerId,
  isFavorite: doc.favoriteUserIds.includes(viewerId),
  usageCount: doc.usageCount,
  aspectRatio: doc.aspectRatio ?? null,
  numberOfImages: doc.numberOfImages ?? null,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const formatSystemPreset = (preset: SystemPreset): ClientPreset => ({
  id: preset.id,
  name: preset.name,
  prompt: preset.prompt,
  description: preset.description,
  tags: preset.tags,
  visibility: "system",
  isDefault: true,
  isSystem: true,
  isOwner: false,
  isFavorite: false,
  usageCount: 0,
  aspectRatio: preset.aspectRatio,
  numberOfImages: preset.numberOfImages,
  createdAt: null,
  updatedAt: null,
});

const getIdentityOrThrow = async (ctx: Parameters<typeof query>[0]["ctx"]) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated call to presets module.");
  }
  return identity.tokenIdentifier;
};

export const listPresets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getIdentityOrThrow(ctx);

    const personal = await ctx.db
      .query("presets")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const shared = await ctx.db
      .query("presets")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .order("desc")
      .collect();

    return {
      personal: personal.map((doc) => formatPresetDoc(doc, userId)),
      shared: shared
        .filter((doc) => doc.userId !== userId)
        .map((doc) => formatPresetDoc(doc, userId)),
      stylePacks: DEFAULT_STYLE_PACKS.map((preset) => formatSystemPreset(preset)),
    };
  },
});

export const createPreset = mutation({
  args: {
    name: v.string(),
    prompt: v.string(),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    visibility: v.union(...ALLOWED_VISIBILITIES.map((value) => v.literal(value))),
    aspectRatio: v.optional(v.string()),
    numberOfImages: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getIdentityOrThrow(ctx);

    const name = sanitizeName(args.name);
    const prompt = args.prompt.trim();
    const description = sanitizeDescription(args.description);
    const tags = sanitizeTags(args.tags);
    const visibility = args.visibility as PresetVisibility;
    const aspectRatio = normalizeAspectRatio(args.aspectRatio);
    const numberOfImages = normalizeNumberOfImages(args.numberOfImages);

    if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
      throw new Error("Preset name must be between 2 and 64 characters.");
    }

    if (prompt.length < MIN_PROMPT_LENGTH) {
      throw new Error("Preset prompt must contain at least 10 characters.");
    }

    const existingCount = await ctx.db
      .query("presets")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    if (existingCount.length >= MAX_PRESETS_PER_USER) {
      throw new Error("You have reached the maximum number of presets.");
    }

    const now = new Date().toISOString();

    const presetId = await ctx.db.insert("presets", {
      userId,
      name,
      prompt,
      description,
      tags,
      visibility,
      isDefault: false,
      isSystem: false,
      usageCount: 0,
      favoriteUserIds: [],
      aspectRatio: aspectRatio ?? undefined,
      numberOfImages: numberOfImages ?? undefined,
      createdAt: now,
      updatedAt: now,
    });

    return presetId;
  },
});

export const updatePreset = mutation({
  args: {
    presetId: v.id("presets"),
    name: v.string(),
    prompt: v.string(),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    visibility: v.union(...ALLOWED_VISIBILITIES.map((value) => v.literal(value))),
    aspectRatio: v.optional(v.string()),
    numberOfImages: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getIdentityOrThrow(ctx);
    const preset = await ctx.db.get(args.presetId);

    if (!preset) {
      throw new Error("Preset not found.");
    }
    if (preset.userId !== userId) {
      throw new Error("You do not have permission to modify this preset.");
    }
    if (preset.isSystem) {
      throw new Error("System presets cannot be modified.");
    }

    const name = sanitizeName(args.name);
    const prompt = args.prompt.trim();
    const description = sanitizeDescription(args.description);
    const tags = sanitizeTags(args.tags);
    const visibility = args.visibility as PresetVisibility;
    const aspectRatio = normalizeAspectRatio(args.aspectRatio);
    const numberOfImages = normalizeNumberOfImages(args.numberOfImages);

    if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
      throw new Error("Preset name must be between 2 and 64 characters.");
    }

    if (prompt.length < MIN_PROMPT_LENGTH) {
      throw new Error("Preset prompt must contain at least 10 characters.");
    }

    await ctx.db.patch(args.presetId, {
      name,
      prompt,
      description,
      tags,
      visibility,
      aspectRatio: aspectRatio ?? undefined,
      numberOfImages: numberOfImages ?? undefined,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const deletePreset = mutation({
  args: { presetId: v.id("presets") },
  handler: async (ctx, args) => {
    const userId = await getIdentityOrThrow(ctx);
    const preset = await ctx.db.get(args.presetId);

    if (!preset) {
      throw new Error("Preset not found.");
    }
    if (preset.userId !== userId) {
      throw new Error("You do not have permission to delete this preset.");
    }
    if (preset.isSystem || preset.isDefault) {
      throw new Error("This preset cannot be deleted.");
    }

    await ctx.db.delete(args.presetId);
  },
});

export const toggleFavorite = mutation({
  args: { presetId: v.id("presets") },
  handler: async (ctx, args) => {
    const userId = await getIdentityOrThrow(ctx);
    const preset = await ctx.db.get(args.presetId);

    if (!preset) {
      throw new Error("Preset not found.");
    }
    if (preset.isSystem) {
      throw new Error("System presets cannot be favorited.");
    }

    const favoriteUserIds = new Set(preset.favoriteUserIds);

    if (favoriteUserIds.has(userId)) {
      favoriteUserIds.delete(userId);
    } else {
      favoriteUserIds.add(userId);
    }

    await ctx.db.patch(args.presetId, {
      favoriteUserIds: Array.from(favoriteUserIds),
    });
  },
});

export const trackPresetUsage = mutation({
  args: { presetId: v.id("presets") },
  handler: async (ctx, args) => {
    await getIdentityOrThrow(ctx);

    const preset = await ctx.db.get(args.presetId);
    if (!preset) {
      throw new Error("Preset not found.");
    }
    if (preset.isSystem) {
      return;
    }

    await ctx.db.patch(args.presetId, {
      usageCount: preset.usageCount + 1,
      updatedAt: new Date().toISOString(),
    });
  },
});
