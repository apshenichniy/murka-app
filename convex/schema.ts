import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Other tables here...

  generations: defineTable({
    aspectRatio: v.string(),
    completedAt: v.string(),
    createdAt: v.string(),
    description: v.string(),
    images: v.array(
      v.object({
        content_type: v.string(),
        file_name: v.string(),
        file_size: v.null(),
        url: v.string(),
      })
    ),
    filename: v.string(),
    model: v.string(),
    numberOfImages: v.float64(),
    prompt: v.string(),
    referenceImages: v.array(v.any()),
    status: v.string(),
    userId: v.string(),
  }),
  presets: defineTable({
    userId: v.string(),
    name: v.string(),
    prompt: v.string(),
    description: v.string(),
    tags: v.array(v.string()),
    visibility: v.union(v.literal("private"), v.literal("public")),
    isDefault: v.boolean(),
    isSystem: v.boolean(),
    usageCount: v.number(),
    favoriteUserIds: v.array(v.string()),
    aspectRatio: v.optional(v.string()),
    numberOfImages: v.optional(v.number()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_visibility", ["visibility"])
    .index("by_name", ["name"]),
});
