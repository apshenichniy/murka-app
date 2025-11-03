"use client";

import { useCompletion } from "@ai-sdk/react";
import {
  Button,
  InputWrapper,
  Loader as MantineLoader,
  Paper,
  Select,
  Text,
  Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAction, useQuery } from "convex/react";
import {
  AlertCircleIcon,
  BrushCleaningIcon,
  DownloadIcon,
  ImageIcon,
  Loader,
  PencilIcon,
  SparklesIcon,
  WandIcon,
  ZapIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { ASPECT_RATIOS, type AspectRatio } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";
import { api } from "../../convex/_generated/api";

export const Playground = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
      <PromptInput />
      <ImagePreview />
    </div>
  );
};

const PromptInput = () => {
  const { activeTab, setCurrentGenerationId, currentGenerationId } =
    useAppStore();

  const { complete, completion, isLoading } = useCompletion({
    api: "/api/refine",
    onFinish: (_prompt, completion) => {
      form.setFieldValue("prompt", completion);
    },
  });

  const form = useForm<{
    prompt: string;
    aspectRatio: AspectRatio;
    numberOfImages: number;
  }>({
    initialValues: {
      prompt: "",
      aspectRatio: "1:1",
      numberOfImages: 1,
    },
  });

  const textAreaValue = isLoading
    ? completion || form.values.prompt
    : form.values.prompt;

  const createImageGeneration = useAction(
    api.generations.createImageGeneration
  );

  const handleGenerate = async () => {
    const generationId = await createImageGeneration({
      model:
        activeTab === "text-to-image"
          ? "fal-ai/nano-banana"
          : "fal-ai/nano-banana/edit",
      prompt: form.values.prompt,
      aspectRatio: form.values.aspectRatio,
      numberOfImages: form.values.numberOfImages,
      referenceImages: [],
    });
    setCurrentGenerationId(generationId);
  };

  const generation = useQuery(
    api.generations.getGeneration,
    currentGenerationId ? { generationId: currentGenerationId } : "skip"
  );

  const isGenerationInProgress =
    generation?.status === "SUBMITTED" || generation?.status === "IN_PROGRESS";

  const isPromptValid = form.values.prompt.trim().length >= 10;

  const isGenerateButtonDisabled =
    isLoading || !isPromptValid || isGenerationInProgress;

  const handleReset = () => {
    form.reset();
    setCurrentGenerationId(null);
  };

  const isRefineButtonDisabled = isLoading || !isPromptValid;

  return (
    <div className="space-y-4">
      <Paper shadow="md" p="md" className="flex flex-col gap-2.5">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <SparklesIcon size={16} strokeWidth={1.5} />
            <Text size="md" fw={500}>
              Prompt Input
            </Text>
          </div>
          <Button
            variant="outline"
            size="compact-xs"
            color="gray"
            leftSection={<BrushCleaningIcon size={16} strokeWidth={1.5} />}
            disabled={!form.isDirty()}
            onClick={handleReset}
          >
            Reset
          </Button>
        </div>
        <Textarea
          label="Prompt"
          placeholder="A beautiful sunset over a calm ocean"
          autosize
          minRows={5}
          value={textAreaValue}
          readOnly={isLoading}
          onChange={(e) => {
            if (!isLoading) form.setFieldValue("prompt", e.target.value);
          }}
        />
        <Button
          variant="white"
          size="compact-xs"
          leftSection={
            isLoading ? (
              <Loader size={16} strokeWidth={1.5} className="animate-spin" />
            ) : (
              <WandIcon size={16} strokeWidth={1.5} />
            )
          }
          className={cn(
            "w-fit -mt-1.5",
            isRefineButtonDisabled && "opacity-50 pointer-events-none"
          )}
          onClick={async () => await complete(form.values.prompt)}
        >
          Refine prompt
        </Button>
        {activeTab === "image-edit" && (
          <InputWrapper label="Reference images">
            <div className="grid grid-cols-3 gap-2.5">
              <div className="aspect-square bg-red-200">1</div>
              <div className="aspect-square bg-red-200">2</div>
              <div className="aspect-square bg-red-200">3</div>
            </div>
          </InputWrapper>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <Select
            label="Aspect ratio"
            data={ASPECT_RATIOS}
            value={form.values.aspectRatio}
            onChange={(value) =>
              form.setFieldValue("aspectRatio", value as AspectRatio)
            }
          />
          <Select
            label="Number of images"
            data={["1", "2", "3", "4"]}
            value={form.values.numberOfImages.toString()}
            onChange={(value) =>
              form.setFieldValue("numberOfImages", Number(value))
            }
          />
        </div>
      </Paper>
      <Button
        variant="gradient"
        gradient={{ from: "red", to: "yellow", deg: 90 }}
        size="lg"
        leftSection={
          isGenerationInProgress ? (
            <Loader size={20} strokeWidth={2} className="animate-spin" />
          ) : (
            <ZapIcon size={20} strokeWidth={2} />
          )
        }
        fullWidth
        className={cn(
          isGenerateButtonDisabled && "opacity-50 pointer-events-none"
        )}
        onClick={handleGenerate}
      >
        Generate Now
      </Button>
    </div>
  );
};

const ImagePreview = () => {
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
  const { currentGenerationId } = useAppStore();
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
              className="relative w-full overflow-hidden rounded-md"
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
