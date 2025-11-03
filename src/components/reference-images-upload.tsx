"use client";

import { fal } from "@fal-ai/client";
import { Loader as MantineLoader, Skeleton } from "@mantine/core";
import { ImageIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { MAX_REFERENCE_IMAGES } from "@/lib/constants";

export const ReferenceImagesUpload = ({
  referenceImages,
  onChange,
}: {
  referenceImages: string[];
  onChange: (images: string[]) => void;
}) => {
  const slots = [];

  // Add preview slots for existing images
  for (let i = 0; i < referenceImages.length; i++) {
    slots.push(
      <ImagePreviewSlot
        key={referenceImages[i]}
        imageUrl={referenceImages[i]}
        onDelete={() => {
          const newImages = referenceImages.filter((_, index) => index !== i);
          onChange(newImages);
        }}
      />
    );
  }

  // Add upload slot if we haven't reached the limit
  if (referenceImages.length < MAX_REFERENCE_IMAGES) {
    slots.push(
      <ImageUploadSlot
        key="upload"
        onUploadComplete={(url) => {
          onChange([...referenceImages, url]);
        }}
      />
    );
  }

  return <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">{slots}</div>;
};

const ImageUploadSlot = ({
  onUploadComplete,
}: {
  onUploadComplete: (url: string) => void;
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    setIsUploading(true);
    try {
      const url = await fal.storage.upload(file);
      onUploadComplete(url);
    } catch (error) {
      console.error("Failed to upload image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    };
    input.click();
  };

  return (
    <button
      type="button"
      className={cn(
        "aspect-square border border-dashed rounded-md flex items-center justify-center cursor-pointer transition-colors",
        isDragOver
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      {isUploading ? (
        <MantineLoader size="md" />
      ) : (
        <ImageIcon size={32} strokeWidth={2} className="text-gray-400" />
      )}
    </button>
  );
};

const ImagePreviewSlot = ({
  imageUrl,
  onDelete,
}: {
  imageUrl: string;
  onDelete: () => void;
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  return (
    <div className="aspect-square relative rounded-md overflow-hidden group bg-gray-100">
      {/* Loading skeleton */}
      {!isImageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton />
        </div>
      )}

      {/** biome-ignore lint/performance/noImgElement: reference image */}
      <img
        src={imageUrl}
        alt="Reference"
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isImageLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setIsImageLoaded(true)}
      />

      {/* Delete button - only show when image is loaded */}
      {isImageLoaded && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-md transition-colors"
        >
          <XIcon size={16} strokeWidth={2} className="text-white" />
        </button>
      )}
    </div>
  );
};
