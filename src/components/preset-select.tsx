"use client";

import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  Drawer,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useMutation, useQuery } from "convex/react";
import {
  PencilIcon,
  PlusIcon,
  Settings2Icon,
  SparklesIcon,
  StarIcon,
  StarOffIcon,
  TrashIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ASPECT_RATIOS } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ClientPreset, PresetsResponse } from "@/types/presets";

type PresetFormState = {
  name: string;
  prompt: string;
  description: string;
  tags: string;
  visibility: "private" | "public";
  aspectRatio: string;
  numberOfImages: string;
};

const defaultFormState = (preset?: Partial<ClientPreset>): PresetFormState => ({
  name: preset?.name ?? "",
  prompt: preset?.prompt ?? "",
  description: preset?.description ?? "",
  tags: preset?.tags?.join(", ") ?? "",
  visibility:
    preset?.visibility === "public" || preset?.visibility === "system"
      ? "public"
      : "private",
  aspectRatio: preset?.aspectRatio ?? "",
  numberOfImages: preset?.numberOfImages
    ? preset.numberOfImages.toString()
    : "",
});

const parseTags = (tags: string) =>
  tags
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

type PresetModalProps = {
  opened: boolean;
  title: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    prompt: string;
    description: string;
    tags: string[];
    visibility: "private" | "public";
    aspectRatio: string | null;
    numberOfImages: number | null;
  }) => Promise<void>;
  initialPreset?: Partial<ClientPreset>;
};

const PresetModal = ({
  opened,
  onClose,
  submitLabel,
  title,
  onSubmit,
  initialPreset,
}: PresetModalProps) => {
  const [formState, setFormState] = useState<PresetFormState>(
    defaultFormState(initialPreset)
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (opened) {
      setFormState(defaultFormState(initialPreset));
    }
  }, [opened, initialPreset]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: formState.name.trim(),
        prompt: formState.prompt.trim(),
        description: formState.description.trim(),
        tags: parseTags(formState.tags),
        visibility: formState.visibility,
        aspectRatio: formState.aspectRatio || null,
        numberOfImages: formState.numberOfImages
          ? Number(formState.numberOfImages)
          : null,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const aspectRatioOptions = useMemo(
    () => [
      { value: "", label: "No preference" },
      ...ASPECT_RATIOS.map(({ value, label }) => ({ value, label })),
    ],
    []
  );

  return (
    <Modal opened={opened} onClose={onClose} title={title} size="lg" centered>
      <Stack gap="sm">
        <TextInput
          label="Preset name"
          placeholder="Cinematic Portrait"
          value={formState.name}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, name: event.currentTarget.value }))
          }
          required
        />
        <Textarea
          label="Prompt"
          minRows={6}
          autosize
          value={formState.prompt}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, prompt: event.currentTarget.value }))
          }
          required
        />
        <Textarea
          label="Description"
          placeholder="Short description to remember what this preset does"
          minRows={3}
          autosize
          value={formState.description}
          onChange={(event) =>
            setFormState((prev) => ({
              ...prev,
              description: event.currentTarget.value,
            }))
          }
        />
        <TextInput
          label="Tags"
          description="Separate with commas, e.g. portrait, cinematic, neon"
          placeholder="portrait, cinematic, neon"
          value={formState.tags}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, tags: event.currentTarget.value }))
          }
        />
        <Group gap="sm" grow>
          <Select
            label="Visibility"
            data={[
              { value: "private", label: "Private" },
              { value: "public", label: "Public" },
            ]}
            value={formState.visibility}
            onChange={(value) =>
              setFormState((prev) => ({
                ...prev,
                visibility: (value as "private" | "public") ?? "private",
              }))
            }
          />
          <Select
            label="Preset aspect ratio"
            data={aspectRatioOptions}
            value={formState.aspectRatio}
            onChange={(value) =>
              setFormState((prev) => ({
                ...prev,
                aspectRatio: value ?? "",
              }))
            }
          />
          <Select
            label="Number of images"
            data={[
              { value: "", label: "Use current setting" },
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
            ]}
            value={formState.numberOfImages}
            onChange={(value) =>
              setFormState((prev) => ({
                ...prev,
                numberOfImages: value ?? "",
              }))
            }
          />
        </Group>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={formState.name.trim().length < 2 || formState.prompt.trim().length < 10}
          >
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

const usePresetOptions = (data?: PresetsResponse) => {
  const list = useMemo(() => {
    if (!data) {
      return {
        grouped: [],
        map: new Map<string, ClientPreset>(),
      };
    }

    const entries: ClientPreset[] = [
      ...data.personal,
      ...data.shared,
      ...data.stylePacks,
    ];
    const map = new Map(entries.map((preset) => [preset.id, preset]));

    const grouped = [
      ...(data.personal.length
        ? [
            {
              group: "My Presets",
              items: data.personal.map((preset) => ({
                value: preset.id,
                label: preset.name,
                description: preset.description,
              })),
            },
          ]
        : []),
      ...(data.shared.length
        ? [
            {
              group: "Shared Presets",
              items: data.shared.map((preset) => ({
                value: preset.id,
                label: preset.name,
                description: preset.description,
              })),
            },
          ]
        : []),
      ...(data.stylePacks.length
        ? [
            {
              group: "Style Packs",
              items: data.stylePacks.map((preset) => ({
                value: preset.id,
                label: `${preset.name} • style pack`,
                description: preset.description,
              })),
            },
          ]
        : []),
    ];

    return { grouped, map };
  }, [data]);

  return list;
};

const PresetManagerCard = ({
  preset,
  onEdit,
  onDelete,
  onFavoriteToggle,
}: {
  preset: ClientPreset;
  onEdit?: (preset: ClientPreset) => void;
  onDelete?: (preset: ClientPreset) => void;
  onFavoriteToggle?: (preset: ClientPreset) => void;
}) => {
  const showFavorite = !!onFavoriteToggle && !preset.isSystem;
  const canEdit = !!onEdit && preset.isOwner && !preset.isSystem;
  const canDelete = !!onDelete && preset.isOwner && !preset.isSystem && !preset.isDefault;

  return (
    <Paper withBorder p="sm" radius="md">
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start">
          <div>
            <Group gap={6}>
              <Text fw={600}>{preset.name}</Text>
              <Badge size="sm" color={preset.visibility === "public" ? "blue" : "gray"}>
                {preset.visibility === "system" ? "style pack" : preset.visibility}
              </Badge>
              {preset.isFavorite && <Badge size="sm" color="yellow">favorite</Badge>}
            </Group>
            {preset.description && (
              <Text size="sm" c="dimmed" mt={4}>
                {preset.description}
              </Text>
            )}
          </div>
          <Group gap={6}>
            {showFavorite && (
              <ActionIcon
                variant="subtle"
                color={preset.isFavorite ? "yellow" : "gray"}
                onClick={() => onFavoriteToggle?.(preset)}
              >
                {preset.isFavorite ? (
                  <StarIcon size={16} strokeWidth={1.5} />
                ) : (
                  <StarOffIcon size={16} strokeWidth={1.5} />
                )}
              </ActionIcon>
            )}
            {canEdit && (
              <ActionIcon variant="subtle" onClick={() => onEdit?.(preset)}>
                <PencilIcon size={16} strokeWidth={1.5} />
              </ActionIcon>
            )}
            {canDelete && (
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={() => onDelete?.(preset)}
              >
                <TrashIcon size={16} strokeWidth={1.5} />
              </ActionIcon>
            )}
          </Group>
        </Group>
        <Group gap={4}>
          <Badge size="sm" variant="light">
            {preset.usageCount} uses
          </Badge>
          {preset.tags.map((tag) => (
            <Badge key={tag} size="sm" color="gray" variant="light">
              {tag}
            </Badge>
          ))}
        </Group>
      </Stack>
    </Paper>
  );
};

export const PresetSelect = () => {
  const presets = useQuery(api.presets.listPresets);
  const createPreset = useMutation(api.presets.createPreset);
  const updatePreset = useMutation(api.presets.updatePreset);
  const deletePreset = useMutation(api.presets.deletePreset);
  const toggleFavorite = useMutation(api.presets.toggleFavorite);
  const trackPresetUsage = useMutation(api.presets.trackPresetUsage);

  const {
    formPrompt,
    formAspectRatio,
    formNumberOfImages,
    selectedPresetId,
    isPresetDirty,
    applyPreset,
    setSelectedPresetId,
  } = useAppStore();

  const { grouped, map } = usePresetOptions(presets);

  const [createModalOpened, createModalHandlers] = useDisclosure(false);
  const [manageOpened, manageHandlers] = useDisclosure(false);
  const [editingPreset, setEditingPreset] = useState<ClientPreset | null>(null);

  const handleApply = async (preset: ClientPreset) => {
    applyPreset({
      id: preset.id,
      prompt: preset.prompt,
      aspectRatio: (preset.aspectRatio as typeof formAspectRatio | null) ?? null,
      numberOfImages: preset.numberOfImages ?? null,
    });

    if (!preset.isSystem) {
      try {
        await trackPresetUsage({ presetId: preset.id as Id<"presets"> });
      } catch (error) {
        console.error("Failed to track preset usage", error);
      }
    }
  };

  const handleSelectChange = async (value: string | null) => {
    if (!value) {
      setSelectedPresetId(null);
      return;
    }

    const preset = map.get(value);
    if (!preset) {
      return;
    }

    await handleApply(preset);
  };

  const handleCreatePreset = async (payload: {
    name: string;
    prompt: string;
    description: string;
    tags: string[];
    visibility: "private" | "public";
    aspectRatio: string | null;
    numberOfImages: number | null;
  }) => {
    const presetId = await createPreset({
      ...payload,
      aspectRatio: payload.aspectRatio ?? undefined,
      numberOfImages: payload.numberOfImages ?? undefined,
    });
    setSelectedPresetId(presetId);
  };

  const handleUpdatePreset = async (
    presetId: Id<"presets">,
    payload: {
      name: string;
      prompt: string;
      description: string;
      tags: string[];
      visibility: "private" | "public";
      aspectRatio: string | null;
      numberOfImages: number | null;
    }
  ) => {
    await updatePreset({
      presetId,
      ...payload,
      aspectRatio: payload.aspectRatio ?? undefined,
      numberOfImages: payload.numberOfImages ?? undefined,
    });
  };

  const handleDeletePreset = async (preset: ClientPreset) => {
    await deletePreset({ presetId: preset.id as Id<"presets"> });
    if (selectedPresetId === preset.id) {
      setSelectedPresetId(null);
    }
  };

  const handleToggleFavorite = async (preset: ClientPreset) => {
    try {
      await toggleFavorite({ presetId: preset.id as Id<"presets"> });
    } catch (error) {
      console.error("Failed to toggle favorite", error);
    }
  };

  const currentSelection = selectedPresetId ? map.get(selectedPresetId) : undefined;

  return (
    <>
      <Stack gap="xs">
        <Group align="flex-end" gap="sm">
          <Stack gap={2} className="flex-1">
            <Group gap={6}>
              <Text fw={500} size="sm" c="dimmed">
                Prompt preset
              </Text>
              {isPresetDirty && currentSelection && (
                <Tooltip label="You have modified this preset. Reapply to reset.">
                  <Badge color="yellow" size="xs" variant="light">
                    modified
                  </Badge>
                </Tooltip>
              )}
            </Group>
            <Select
              placeholder="Choose a preset or style pack"
              data={grouped}
              value={selectedPresetId}
              onChange={handleSelectChange}
              nothingFoundMessage="No presets yet"
              comboboxProps={{ withinPortal: false }}
            />
          </Stack>
          <Button
            variant="light"
            leftSection={<PlusIcon size={16} strokeWidth={1.5} />}
            onClick={() => {
              setEditingPreset(null);
              createModalHandlers.open();
            }}
            disabled={formPrompt.trim().length < 10}
          >
            Save preset
          </Button>
          <Tooltip label="Manage presets and style packs">
            <ActionIcon
              variant="light"
              size="lg"
              onClick={manageHandlers.open}
            >
              <Settings2Icon size={18} strokeWidth={1.5} />
            </ActionIcon>
          </Tooltip>
        </Group>
        {currentSelection && (
          <Group gap="sm">
            <Text size="xs" c="dimmed">
              Applied: {currentSelection.name}
            </Text>
            {currentSelection.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} size="xs" variant="light">
                {tag}
              </Badge>
            ))}
          </Group>
        )}
      </Stack>

      <PresetModal
        opened={createModalOpened}
        onClose={createModalHandlers.close}
        title="Save current prompt as preset"
        submitLabel="Save preset"
        initialPreset={{
          name: "",
          prompt: formPrompt,
          description: "",
          tags: [],
          visibility: "private",
          aspectRatio: formAspectRatio,
          numberOfImages: formNumberOfImages,
        }}
        onSubmit={handleCreatePreset}
      />

      <PresetModal
        opened={!!editingPreset}
        onClose={() => setEditingPreset(null)}
        title="Update preset"
        submitLabel="Update preset"
        initialPreset={editingPreset ?? undefined}
        onSubmit={async (payload) => {
          if (!editingPreset) return;
          await handleUpdatePreset(editingPreset.id as Id<"presets">, payload);
          setEditingPreset(null);
        }}
      />

      <Drawer
        opened={manageOpened}
        onClose={manageHandlers.close}
        title="Preset manager"
        position="right"
        size="md"
      >
        <Stack gap="md">
          <div>
            <Group gap={6} mb="xs">
              <SparklesIcon size={16} strokeWidth={1.5} />
              <Text fw={600}>Style packs</Text>
            </Group>
            <Stack gap="xs">
              {presets?.stylePacks.map((preset) => (
                <PresetManagerCard
                  key={preset.id}
                  preset={preset}
                />
              )) ?? (
                <Text size="sm" c="dimmed">
                  No style packs available yet.
                </Text>
              )}
            </Stack>
          </div>

          <Divider />

          <div>
            <Group gap={6} mb="xs">
              <Text fw={600}>My presets</Text>
            </Group>
            <Stack gap="xs">
              {presets?.personal.length ? (
                presets.personal.map((preset) => (
                  <PresetManagerCard
                    key={preset.id}
                    preset={preset}
                    onEdit={setEditingPreset}
                    onDelete={handleDeletePreset}
                  />
                ))
              ) : (
                <Text size="sm" c="dimmed">
                  Save a preset to see it here.
                </Text>
              )}
            </Stack>
          </div>

          <Divider />

          <div>
            <Group gap={6} mb="xs">
              <Text fw={600}>Shared presets</Text>
            </Group>
            <Stack gap="xs">
              {presets?.shared.length ? (
                presets.shared.map((preset) => (
                  <PresetManagerCard
                    key={preset.id}
                    preset={preset}
                    onFavoriteToggle={handleToggleFavorite}
                  />
                ))
              ) : (
                <Text size="sm" c="dimmed">
                  Explore published presets from your team here.
                </Text>
              )}
            </Stack>
          </div>
        </Stack>
      </Drawer>
    </>
  );
};
