"use client";

import { useCompletion } from "@ai-sdk/react";
import {
  Button,
  InputWrapper,
  Paper,
  Select,
  Text,
  Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAction, useQuery } from "convex/react";
import {
  BrushCleaningIcon,
  Loader,
  SparklesIcon,
  WandIcon,
  ZapIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { ASPECT_RATIOS, type AspectRatio } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";
import { api } from "../../convex/_generated/api";
import { ReferenceImagesUpload } from "./reference-images-upload";

export const PromptInput = () => {
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
    referenceImages: string[];
  }>({
    initialValues: {
      prompt: "",
      aspectRatio: "1:1",
      numberOfImages: 1,
      referenceImages: [],
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
      prompt: form.values.prompt,
      aspectRatio: form.values.aspectRatio,
      numberOfImages: form.values.numberOfImages,
      referenceImages: form.values.referenceImages,
    });
    setCurrentGenerationId(generationId);
  };

  const generation = useQuery(
    api.generations.getGeneration,
    currentGenerationId ? { generationId: currentGenerationId } : "skip"
  );

  const isGenerationInProgress =
    !!generation &&
    ["SUBMITTED", "IN_QUEUE", "IN_PROGRESS"].includes(generation.status);

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
            <ReferenceImagesUpload
              referenceImages={form.values.referenceImages}
              onChange={(images) =>
                form.setFieldValue("referenceImages", images)
              }
            />
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
