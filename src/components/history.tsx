"use client";

import {
  ActionIcon,
  Badge,
  Button,
  CopyButton,
  Modal,
  Paper,
  Text,
} from "@mantine/core";
import { useQuery } from "convex/react";
import { formatDistance } from "date-fns";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  PencilIcon,
  PlayIcon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { type AspectRatio, MAX_IMAGES } from "@/lib/constants";
import { downloadImage } from "@/lib/download-image";
import { useAppStore } from "@/store/app-store";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

export const History = () => {
  const generations = useQuery(api.generations.getUserGenerations);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGeneration, setSelectedGeneration] =
    useState<Doc<"generations"> | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleImageClick = (
    generation: Doc<"generations">,
    imageIndex: number
  ) => {
    setSelectedGeneration(generation);
    setSelectedImageIndex(imageIndex);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedGeneration(null);
    setSelectedImageIndex(0);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        {generations?.map((generation) => (
          <GenerationCard
            key={generation._id}
            generation={generation}
            onImageClick={handleImageClick}
          />
        ))}
      </div>
      {selectedGeneration && (
        <ImageModal
          generation={selectedGeneration}
          imageIndex={selectedImageIndex}
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onNavigate={setSelectedImageIndex}
        />
      )}
    </>
  );
};

const GenerationCard: React.FC<{
  generation: Doc<"generations">;
  onImageClick: (generation: Doc<"generations">, imageIndex: number) => void;
}> = ({ generation, onImageClick }) => {
  const { loadGenerationToForm } = useAppStore();
  const distance = formatDistance(new Date(), new Date(generation.createdAt));
  const emptyImageSlots = Math.min(MAX_IMAGES - generation.images.length, 1);

  return (
    <Paper shadow="md" p="md" className="flex items-center flex-col">
      <div className="flex items-start gap-4 w-full">
        <div className="flex flex-col flex-1 min-w-0 gap-2">
          <Text size="md" fw={600}>
            {distance} ago
          </Text>
          <Badge
            color={generation.model === "fal-ai/nano-banana" ? "green" : "gray"}
          >
            {generation.model}
          </Badge>
          <Text size="sm">{generation.prompt}</Text>
          <Text size="sm" c="dimmed">
            Aspect ratio: {generation.aspectRatio}
          </Text>
        </div>
        <div className="grid grid-cols-2 gap-2 shrink-0">
          {generation.images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              className="relative h-32 aspect-square hover:cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onImageClick(generation, index)}
            >
              <Image
                key={image.url}
                src={image.url}
                alt={image.file_name}
                fill
                className="object-cover rounded"
              />
            </button>
          ))}
          {Array.from({ length: emptyImageSlots }).map((_, index) => (
            <div
              key={`empty-image-${
                // biome-ignore lint/suspicious/noArrayIndexKey: empty image slot
                index
              }`}
              className="relative h-32 aspect-square"
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-start w-full gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          leftSection={<PlayIcon size={16} strokeWidth={1.5} />}
          onClick={() =>
            loadGenerationToForm(
              generation.prompt,
              generation.aspectRatio as AspectRatio,
              generation.model
            )
          }
        >
          Playground
        </Button>
        <CopyButton value={generation.prompt} timeout={500}>
          {({ copied, copy }) => (
            <Button
              variant="outline"
              size="sm"
              onClick={copy}
              color={copied ? "green" : "gray"}
              leftSection={<CopyIcon size={16} strokeWidth={1.5} />}
            >
              {copied ? "Copied" : "Copy prompt"}
            </Button>
          )}
        </CopyButton>
      </div>
    </Paper>
  );
};

const ImageModal: React.FC<{
  generation: Doc<"generations">;
  imageIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}> = ({ generation, imageIndex, isOpen, onClose, onNavigate }) => {
  const { resetForm, setFormReferenceImage, setActiveTab } = useAppStore();
  const currentImage = generation.images[imageIndex];
  const totalImages = generation.images.length;
  const canGoPrevious = imageIndex > 0;
  const canGoNext = imageIndex < totalImages - 1;

  const handleEdit = () => {
    resetForm();
    setFormReferenceImage(currentImage.url);
    setActiveTab("image-edit");
    onClose();
  };

  const handleDownloadClick = () => {
    const suffix = totalImages === 1 ? "" : `_${imageIndex + 1}`;
    const fileName = `${generation.filename}${suffix}.jpg`;
    downloadImage(currentImage.url, fileName);
  };

  const handlePrevious = () => {
    if (canGoPrevious) {
      onNavigate(imageIndex - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onNavigate(imageIndex + 1);
    }
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size="auto"
      centered
      withCloseButton
      padding="lg"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-4">
          {totalImages > 1 && (
            <ActionIcon
              variant="subtle"
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              className="shrink-0"
            >
              <ChevronLeftIcon size={24} strokeWidth={2} />
            </ActionIcon>
          )}

          <div className="max-w-[80vw] max-h-[70vh] relative">
            {/** biome-ignore lint/performance/noImgElement: generated image */}
            <img
              src={currentImage.url}
              alt={currentImage.file_name}
              className="max-w-full max-h-[70vh] object-contain rounded"
            />
          </div>

          {totalImages > 1 && (
            <ActionIcon
              variant="subtle"
              onClick={handleNext}
              disabled={!canGoNext}
              className="shrink-0"
            >
              <ChevronRightIcon size={24} strokeWidth={2} />
            </ActionIcon>
          )}
        </div>

        <div className="flex items-center gap-2 justify-start w-full">
          <Button
            variant="outline"
            size="compact-sm"
            leftSection={<PencilIcon size={16} strokeWidth={1.5} />}
            onClick={handleEdit}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="compact-sm"
            color="gray"
            leftSection={<DownloadIcon size={16} strokeWidth={1.5} />}
            onClick={handleDownloadClick}
          >
            Download
          </Button>
        </div>
      </div>
    </Modal>
  );
};
