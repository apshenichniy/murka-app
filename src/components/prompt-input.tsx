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
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { ASPECT_RATIOS, type AspectRatio } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";
import { api } from "../../convex/_generated/api";
import { ReferenceImagesUpload } from "./reference-images-upload";

export const PromptInput = () => {
  const {
    activeTab,
    setCurrentGenerationId,
    currentGenerationId,
    formPrompt,
    formAspectRatio,
    formNumberOfImages,
    formReferenceImages,
    setFormPrompt,
    setFormAspectRatio,
    setFormNumberOfImages,
    setFormReferenceImages,
    resetForm,
  } = useAppStore();

  const { complete, completion, isLoading } = useCompletion({
    api: "/api/refine",
    onFinish: (_prompt, completion) => {
      form.setFieldValue("prompt", completion);
      setFormPrompt(completion);
    },
  });

  const form = useForm<{
    prompt: string;
    aspectRatio: AspectRatio;
    numberOfImages: number;
    referenceImages: string[];
  }>({
    initialValues: {
      prompt: formPrompt,
      aspectRatio: formAspectRatio,
      numberOfImages: formNumberOfImages,
      referenceImages: formReferenceImages,
    },
  });

  // Sync form with store when store values change
  useEffect(() => {
    form.setValues({
      prompt: formPrompt,
      aspectRatio: formAspectRatio,
      numberOfImages: formNumberOfImages,
      referenceImages: formReferenceImages,
    });
  }, [formPrompt, formAspectRatio, formNumberOfImages, formReferenceImages]);

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
    resetForm();
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
            if (!isLoading) {
              form.setFieldValue("prompt", e.target.value);
              setFormPrompt(e.target.value);
            }
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
              onChange={(images) => {
                form.setFieldValue("referenceImages", images);
                setFormReferenceImages(images);
              }}
            />
          </InputWrapper>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <Select
            label="Aspect ratio"
            data={ASPECT_RATIOS}
            value={form.values.aspectRatio}
            onChange={(value) => {
              const aspectRatio = value as AspectRatio;
              form.setFieldValue("aspectRatio", aspectRatio);
              setFormAspectRatio(aspectRatio);
            }}
          />
          <Select
            label="Number of images"
            data={["1", "2", "3", "4"]}
            value={form.values.numberOfImages.toString()}
            onChange={(value) => {
              const numberOfImages = Number(value);
              form.setFieldValue("numberOfImages", numberOfImages);
              setFormNumberOfImages(numberOfImages);
            }}
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
