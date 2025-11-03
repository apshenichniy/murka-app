"use client";

import { Badge, Button, CopyButton, Paper, Text } from "@mantine/core";
import { useQuery } from "convex/react";
import { formatDistance } from "date-fns";
import { CopyIcon, PlayIcon } from "lucide-react";
import Image from "next/image";
import { type AspectRatio, MAX_IMAGES } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

export const History = () => {
  const generations = useQuery(api.generations.getUserGenerations);

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6">
      {generations?.map((generation) => (
        <GenerationCard key={generation._id} generation={generation} />
      ))}
    </div>
  );
};

const GenerationCard: React.FC<{ generation: Doc<"generations"> }> = ({
  generation,
}) => {
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
          {generation.images.map((image) => (
            <div key={image.url} className="relative h-32 aspect-square">
              <Image
                key={image.url}
                src={image.url}
                alt={image.file_name}
                fill
                className="object-cover rounded"
              />
            </div>
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
