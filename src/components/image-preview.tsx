"use client";

import { Button, Loader as MantineLoader, Paper, Text } from "@mantine/core";
import { useQuery } from "convex/react";
import {
  AlertCircleIcon,
  DownloadIcon,
  ImageIcon,
  PencilIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/store/app-store";
import { api } from "../../convex/_generated/api";

export const ImagePreview = () => {
  return (
    <Paper
      shadow="md"
      p="md"
      className="flex flex-col gap-2.5 md:h-full h-[60svh]"
    >
      <div className="flex items-center gap-2">
        <ImageIcon size={16} strokeWidth={1.5} />
        <Text size="md" fw={500}>
          Output Preview
        </Text>
      </div>
      <ImagePreviewContent />
    </Paper>
  );
};

const ImagePreviewContent = () => {
  const {
    currentGenerationId,
    resetForm,
    setFormReferenceImage,
    setActiveTab,
  } = useAppStore();
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  // Subscribe to generation updates
  const generation = useQuery(
    api.generations.getGeneration,
    currentGenerationId ? { generationId: currentGenerationId } : "skip"
  );

  const isNoGeneration = !currentGenerationId || !generation;

  const isGenerationInProgress =
    !!generation &&
    generation.status !== "COMPLETED" &&
    generation.status !== "FAILED";

  const isGenerationFailed = generation?.status === "FAILED";

  // generation failed
  if (isGenerationFailed) {
    return <GenerationFailed />;
  }

  // no current generation id
  if (isNoGeneration) {
    return <NoGeneration />;
  }

  // generation in progress
  if (isGenerationInProgress) {
    return <GenerationInProgress />;
  }

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  const handleImageLoad = (imageUrl: string) => {
    setLoadedImages((prev) => new Set(prev).add(imageUrl));
  };

  // Calculate aspect ratio for placeholder
  const getAspectRatio = (aspectRatioString: string) => {
    const [width, height] = aspectRatioString.split(":").map(Number);
    return width / height;
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {generation?.images.map((image, index) => {
        const isImageLoaded = loadedImages.has(image.url);
        const aspectRatio = generation?.aspectRatio
          ? getAspectRatio(generation.aspectRatio)
          : 1;

        return (
          <div key={image.url} className="flex flex-col gap-2">
            <div
              className="relative w-full overflow-hidden rounded-sm"
              style={{ aspectRatio: aspectRatio.toString() }}
            >
              {/* Placeholder with blur effect */}
              {!isImageLoaded && (
                <div className="absolute inset-0 bg-linear-to-br from-gray-200 to-gray-300 animate-pulse" />
              )}

              {/** biome-ignore lint/performance/noImgElement: generated image */}
              <img
                src={image.url}
                alt={image.file_name}
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-300",
                  isImageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => handleImageLoad(image.url)}
              />
            </div>

            <div className="flex items-center gap-2 w-full">
              <Button
                variant="outline"
                size="compact-sm"
                leftSection={<PencilIcon size={16} strokeWidth={1.5} />}
                disabled={!isImageLoaded}
                onClick={() => {
                  resetForm();
                  setFormReferenceImage(image.url);
                  setActiveTab("image-edit");
                }}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="compact-sm"
                color="gray"
                leftSection={<DownloadIcon size={16} strokeWidth={1.5} />}
                disabled={!isImageLoaded}
                onClick={() => {
                  const suffix =
                    generation?.images.length === 1 ? "" : `_${index + 1}`;
                  const fileName = `${generation?.filename}${suffix}.jpg`;

                  handleDownload(image.url, fileName);
                }}
              >
                Download
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const NoGeneration = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-md p-4 gap-2">
      <div className="bg-gray-100 rounded-full p-3 mb-3">
        <ImageIcon size={64} strokeWidth={2} className="text-gray-600" />
      </div>
      <Text size="md" fw={600} className="text-center">
        Ready for instant generation
      </Text>
      <Text size="sm" c="dimmed" className="text-center">
        Enter your prompt and unleash the power
      </Text>
    </div>
  );
};

const GenerationInProgress = () => {
  return (
    <div className="h-full flex flex-col gap-3 items-center justify-center">
      <MantineLoader size="lg" />
      <Text size="sm" c="dimmed" className="text-center">
        Generating your image...
      </Text>
    </div>
  );
};

const GenerationFailed = () => {
  return (
    <div className="h-full flex flex-col gap-3 items-center justify-center">
      <AlertCircleIcon size={64} strokeWidth={2} className="text-red-500" />
      <Text size="md" c="red" className="text-center">
        Failed to generate your image
      </Text>
    </div>
  );
};
