"use client";

import { fal } from "@fal-ai/client";
import { Loader as MantineLoader, Skeleton } from "@mantine/core";
import { ImageIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { MAX_REFERENCE_IMAGES } from "@/lib/constants";

// Type to track both preview and remote URL
type ImageReference = {
  id: string; // Stable unique identifier
  previewUrl: string; // Local blob URL, then switches to remote URL
  remoteUrl?: string; // Remote URL after upload
  isUploading?: boolean;
};

export const ReferenceImagesUpload = ({
  referenceImages,
  onChange,
}: {
  referenceImages: string[];
  onChange: (images: string[]) => void;
}) => {
  // Track images with upload state
  const [imageRefs, setImageRefs] = useState<ImageReference[]>(
    referenceImages.map((url) => ({
      id: url, // Use URL as ID for existing images
      previewUrl: url,
      remoteUrl: url,
    }))
  );

  // Sync with external referenceImages changes
  useEffect(() => {
    setImageRefs(
      referenceImages.map((url) => ({
        id: url, // Use URL as ID for existing images
        previewUrl: url,
        remoteUrl: url,
      }))
    );
  }, [referenceImages]);

  // Update parent when remote URLs change
  useEffect(() => {
    const allRemoteUrls = imageRefs
      .map((ref) => ref.remoteUrl)
      .filter((url): url is string => url !== undefined);

    // Only call onChange if the URLs actually changed
    const currentUrls = allRemoteUrls.sort().join(",");
    const externalUrls = referenceImages.sort().join(",");

    if (currentUrls !== externalUrls) {
      onChange(allRemoteUrls);
    }
  }, [imageRefs, onChange, referenceImages]);

  const slots = [];

  // Add preview slots for existing images
  for (let i = 0; i < imageRefs.length; i++) {
    const ref = imageRefs[i];
    slots.push(
      <ImagePreviewSlot
        key={ref.id}
        imageUrl={ref.previewUrl}
        isUploading={ref.isUploading}
        onDelete={() => {
          // Clean up blob URL if it exists
          if (ref.previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(ref.previewUrl);
          }
          setImageRefs((prev) => prev.filter((r) => r.id !== ref.id));
        }}
      />
    );
  }

  // Add upload slot if we haven't reached the limit
  if (imageRefs.length < MAX_REFERENCE_IMAGES) {
    slots.push(
      <ImageUploadSlot
        key="upload"
        onUploadStart={(file) => {
          // Create local preview URL immediately
          const previewUrl = URL.createObjectURL(file);
          const id = `${Date.now()}-${Math.random()}`;
          const newRef: ImageReference = {
            id,
            previewUrl,
            isUploading: true,
          };
          setImageRefs((prev) => [...prev, newRef]);
          return id;
        }}
        onUploadComplete={(id, remoteUrl) => {
          // Update with remote URL and switch preview to remote
          setImageRefs((prev) =>
            prev.map((ref) => {
              if (ref.id === id) {
                // Clean up blob URL
                if (ref.previewUrl.startsWith("blob:")) {
                  URL.revokeObjectURL(ref.previewUrl);
                }
                return {
                  ...ref,
                  previewUrl: remoteUrl, // Switch to remote URL
                  remoteUrl,
                  isUploading: false,
                };
              }
              return ref;
            })
          );
        }}
        onUploadError={(id) => {
          // Remove failed upload and clean up
          setImageRefs((prev) => {
            const ref = prev.find((r) => r.id === id);
            if (ref?.previewUrl.startsWith("blob:")) {
              URL.revokeObjectURL(ref.previewUrl);
            }
            return prev.filter((r) => r.id !== id);
          });
        }}
      />
    );
  }

  return <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">{slots}</div>;
};

const ImageUploadSlot = ({
  onUploadStart,
  onUploadComplete,
  onUploadError,
}: {
  onUploadStart: (file: File) => string; // Returns unique ID
  onUploadComplete: (id: string, remoteUrl: string) => void;
  onUploadError: (id: string) => void;
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const id = onUploadStart(file);

    try {
      const remoteUrl = await fal.storage.upload(file);
      onUploadComplete(id, remoteUrl);
    } catch (error) {
      console.error("Failed to upload image:", error);
      onUploadError(id);
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
      <ImageIcon size={32} strokeWidth={2} className="text-gray-400" />
    </button>
  );
};

const ImagePreviewSlot = ({
  imageUrl,
  isUploading,
  onDelete,
}: {
  imageUrl: string;
  isUploading?: boolean;
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

      {/* Upload loader overlay */}
      {isUploading && isImageLoaded && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <MantineLoader size="md" color="white" />
        </div>
      )}

      {/* Delete button - only show when image is loaded and not uploading */}
      {isImageLoaded && !isUploading && (
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
