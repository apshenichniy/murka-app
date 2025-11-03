import { fal } from "@fal-ai/client";
import { generateObject } from "ai";
import { v } from "convex/values";
import { z } from "zod";
import { ImageGenerationResponseSchema } from "@/lib/constants";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  action,
  internalAction,
  internalMutation,
  query,
} from "./_generated/server";

// Helper mutation to create initial generation record
export const insertGeneration = internalMutation({
  args: {
    userId: v.string(),
    prompt: v.string(),
    model: v.string(),
    aspectRatio: v.string(),
    numberOfImages: v.number(),
    referenceImages: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("generations", {
      ...args,
      completedAt: "",
      description: "",
      images: [],
      filename: "",
      createdAt: new Date().toISOString(),
      status: "SUBMITTED",
    });
  },
});

// Helper mutation to update generation status
export const updateGenerationStatus = internalMutation({
  args: {
    generationId: v.id("generations"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.generationId, {
      status: args.status,
    });
  },
});

// Helper mutation to update generation filename
export const updateGenerationFilename = internalMutation({
  args: {
    generationId: v.id("generations"),
    filename: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.generationId, {
      filename: args.filename,
    });
  },
});

// Helper mutation to complete generation
export const completeGeneration = internalMutation({
  args: {
    generationId: v.id("generations"),
    images: v.array(v.any()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.generationId, {
      status: "COMPLETED",
      images: args.images,
      description: args.description,
      completedAt: new Date().toISOString(),
    });
  },
});

// Query to get a specific generation by ID
export const getGeneration = query({
  args: {
    generationId: v.id("generations"),
  },
  handler: async (ctx, args) => {
    const generation = await ctx.db.get(args.generationId);
    return generation;
  },
});

// Query to get all generations for the current user
export const getUserGenerations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Unauthenticated call to query");
    }

    const userId = identity.tokenIdentifier;

    const generations = await ctx.db
      .query("generations")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .collect();

    return generations;
  },
});

// Action to create a filename for the generation
export const createFilenameForGeneration = internalAction({
  args: {
    generationId: v.id("generations"),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const { generationId, prompt } = args;

    const {
      object: { filename },
    } = await generateObject({
      model: "google/gemini-2.5-flash",
      prompt: `Generate a short, concise filename for an image based on the given prompt. The filename must contain 1–3 words and use underscores to join them.: ${prompt}`,
      schema: z.object({
        filename: z.string(),
      }),
    });

    await ctx.runMutation(internal.generations.updateGenerationFilename, {
      generationId,
      filename,
    });
  },
});

// Action that returns the generation ID immediately
export const createImageGeneration = action({
  args: {
    prompt: v.string(),
    aspectRatio: v.string(),
    numberOfImages: v.number(),
    referenceImages: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"generations">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Unauthenticated call to action");
    }

    const { prompt, numberOfImages, aspectRatio, referenceImages } = args;
    const userId = identity.tokenIdentifier;

    const model =
      referenceImages.length > 0
        ? "fal-ai/nano-banana/edit"
        : "fal-ai/nano-banana";

    // Insert generation into database
    const generationId = await ctx.runMutation(
      internal.generations.insertGeneration,
      {
        userId,
        prompt,
        model,
        aspectRatio,
        numberOfImages,
        referenceImages,
      }
    );

    // Schedule the background processing
    await Promise.all([
      ctx.scheduler.runAfter(0, internal.generations.processImageGeneration, {
        generationId,
        model,
        prompt,
        numberOfImages,
        aspectRatio,
        referenceImages,
      }),
      ctx.scheduler.runAfter(
        0,
        internal.generations.createFilenameForGeneration,
        {
          generationId,
          prompt,
        }
      ),
    ]);

    // Return ID immediately
    return generationId;
  },
});

// Internal action that processes the generation in the background
export const processImageGeneration = internalAction({
  args: {
    generationId: v.id("generations"),
    model: v.string(),
    prompt: v.string(),
    aspectRatio: v.string(),
    numberOfImages: v.number(),
    referenceImages: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      generationId,
      model,
      prompt,
      numberOfImages,
      aspectRatio,
      referenceImages,
    } = args;

    try {
      // Call the image generation API
      const result = await fal.subscribe(model, {
        input: {
          prompt,
          num_images: numberOfImages,
          aspect_ratio: aspectRatio,
          image_urls: referenceImages,
        },
        logs: true,
        onQueueUpdate: async (update) => {
          await ctx.runMutation(internal.generations.updateGenerationStatus, {
            generationId: generationId as Id<"generations">,
            status: update.status,
          });
        },
      });

      if (result.data) {
        const data = ImageGenerationResponseSchema.parse(result.data);

        await ctx.runMutation(internal.generations.completeGeneration, {
          generationId: generationId as Id<"generations">,
          images: data.images,
          description: data.description || "",
        });
      }
    } catch (error) {
      // Handle errors by updating generation status
      console.error("Image generation failed:", error);
      await ctx.runMutation(internal.generations.updateGenerationStatus, {
        generationId,
        status: "FAILED",
      });
    }
  },
});
