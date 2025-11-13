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
import { PresetSelect } from "./preset-select";

export const PromptInput = () => {
  const {
    activeTab,
    setCurrentGenerationId,
    currentGenerationId,
    formPrompt,
    formAspectRatio,
    formNumberOfImages,
    formReferenceImages,
    selectedPresetId,
    isPresetDirty,
    setFormPrompt,
    setFormAspectRatio,
    setFormNumberOfImages,
    setFormReferenceImages,
    markPresetDirty,
    resetForm,
  } = useAppStore();

  const { complete, completion, isLoading } = useCompletion({
    api: "/api/refine",
    onFinish: (_prompt, completion) => {
      setFormPrompt(completion);
    },
  });

  const textAreaValue = isLoading ? completion || formPrompt : formPrompt;

  const createImageGeneration = useAction(
    api.generations.createImageGeneration
  );

    const handleGenerate = async () => {
      const generationId = await createImageGeneration({
        prompt: formPrompt,
        aspectRatio: formAspectRatio,
        numberOfImages: formNumberOfImages,
        referenceImages: formReferenceImages,
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

    const isPromptValid = formPrompt.trim().length >= 10;

    const isGenerateButtonDisabled =
      isLoading || !isPromptValid || isGenerationInProgress;

    const isRefineButtonDisabled = isLoading || !isPromptValid;

    const isFormDirty =
      formPrompt !== "" ||
      formAspectRatio !== "1:1" ||
      formNumberOfImages !== 1 ||
      formReferenceImages.length > 0 ||
      selectedPresetId !== null ||
      isPresetDirty;

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
              disabled={!isFormDirty}
              onClick={resetForm}
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
                markPresetDirty();
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
            onClick={async () => await complete(formPrompt)}
          >
            Refine prompt
          </Button>
          <PresetSelect />
          {activeTab === "image-edit" && (
            <InputWrapper label="Reference images">
              <ReferenceImagesUpload
                referenceImages={formReferenceImages}
                onChange={(images) => {
                  markPresetDirty();
                  setFormReferenceImages(images);
                }}
              />
            </InputWrapper>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <Select
              label="Aspect ratio"
              data={ASPECT_RATIOS}
              value={formAspectRatio}
              onChange={(value) => {
                markPresetDirty();
                setFormAspectRatio(value as AspectRatio);
              }}
            />
            <Select
              label="Number of images"
              data={["1", "2", "3", "4"]}
              value={formNumberOfImages.toString()}
              onChange={(value) => {
                markPresetDirty();
                setFormNumberOfImages(Number(value));
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
