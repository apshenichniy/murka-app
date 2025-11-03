"use client";

import { Button, CopyButton, Paper, Text } from "@mantine/core";
import { useQuery } from "convex/react";
import { formatDistance } from "date-fns";
import { CopyIcon, PlayIcon } from "lucide-react";
import Image from "next/image";
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
  const distance = formatDistance(new Date(), new Date(generation.createdAt));

  return (
    <Paper shadow="md" p="md" className="flex items-center flex-col">
      <div className="flex items-center gap-4">
        <div className="flex flex-col flex-1 min-w-0 pr-4 gap-2">
          <Text size="md" fw={600}>
            {distance} ago
          </Text>
          <Text size="sm">{generation.prompt}</Text>
          <Text size="sm" c="dimmed">
            Aspect ratio: {generation.aspectRatio}
          </Text>
        </div>
        <div className="flex items-center gap-2 h-full">
          {generation.images.map((image) => (
            <div
              key={image.url}
              className="relative h-32 aspect-square shrink-0"
            >
              <Image
                key={image.url}
                src={image.url}
                alt={image.file_name}
                fill
                className="object-cover rounded"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-start w-full gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          leftSection={<PlayIcon size={16} strokeWidth={1.5} />}
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
