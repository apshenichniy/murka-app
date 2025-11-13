export type ClientPreset = {
  id: string;
  name: string;
  prompt: string;
  description: string;
  tags: string[];
  visibility: "private" | "public" | "system";
  isDefault: boolean;
  isSystem: boolean;
  isOwner: boolean;
  isFavorite: boolean;
  usageCount: number;
  aspectRatio: string | null;
  numberOfImages: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PresetsResponse = {
  personal: ClientPreset[];
  shared: ClientPreset[];
  stylePacks: ClientPreset[];
};
