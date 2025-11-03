"use client";

import { fal } from "@fal-ai/client";
import { ImagePreview } from "./image-preview";
import { PromptInput } from "./prompt-input";

// Configure FAL client to use the proxy
fal.config({
  proxyUrl: "/api/fal/proxy",
});

export const Playground = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
      <PromptInput />
      <ImagePreview />
    </div>
  );
};
