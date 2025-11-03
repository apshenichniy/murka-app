"use client";

import { useUser } from "@clerk/nextjs";
import {
  AppShell,
  AppShellMain,
  Avatar,
  NavLink,
  ScrollArea,
  Text,
} from "@mantine/core";
import { HistoryIcon, ImageIcon, WandIcon } from "lucide-react";
import { type AppStore, useAppStore } from "@/store/app-store";
import { History } from "./history";
import { Playground } from "./playground";
import { SignIn } from "./sign-in";

export const App = () => {
  const { activeTab, setActiveTab } = useAppStore();

  const { user } = useUser();
  if (!user) {
    return <SignIn />;
  }

  return (
    <AppShell
      padding="md"
      navbar={{
        width: 240,
        breakpoint: "sm",
        collapsed: {
          mobile: true,
          desktop: false,
        },
      }}
    >
      <AppShell.Navbar>
        <AppShell.Section className="h-12 border-b border-(--mantine-color-default-border) flex items-center justify-between px-3">
          <div className="flex flex-col">
            <Text size="sm" fw={500}>
              😻 Banana App
            </Text>
            <Text size="xs" c="dimmed">
              Made with ❤️ for Murka
            </Text>
          </div>
          <Avatar name={user.fullName ?? undefined} size="md" color="brand" />
        </AppShell.Section>
        <AppShell.Section grow className="flex flex-col gap-2 p-3">
          <NavLink
            component="button"
            label="Text to Image"
            leftSection={<WandIcon size={16} strokeWidth={1.5} />}
            variant="filled"
            active={activeTab === "text-to-image"}
            onClick={() => setActiveTab("text-to-image")}
          />
          <NavLink
            component="button"
            label="Image Edit"
            leftSection={<ImageIcon size={16} strokeWidth={1.5} />}
            active={activeTab === "image-edit"}
            variant="filled"
            onClick={() => setActiveTab("image-edit")}
          />
          <NavLink
            component="button"
            label="History"
            leftSection={<HistoryIcon size={16} strokeWidth={1.5} />}
            active={activeTab === "history"}
            variant="filled"
            onClick={() => setActiveTab("history")}
          />
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShellMain component={ScrollArea} bg="gray.0">
        <div className="flex flex-col md:p-6 gap-4 md:gap-6">
          <Header />
          {(activeTab === "image-edit" || activeTab === "text-to-image") && (
            <Playground />
          )}
          {activeTab === "history" && <History />}
        </div>
      </AppShellMain>
    </AppShell>
  );
};

const Header = () => {
  const titleMap: Record<
    AppStore["activeTab"],
    {
      title: string;
      description: string;
    }
  > = {
    "image-edit": {
      title: "Image Edit",
      description: "Transform existing images into new creations",
    },
    "text-to-image": {
      title: "Text to Image",
      description: "Generate stunning images from text descriptions",
    },
    history: {
      title: "History",
      description: "View and manage all your creations",
    },
  } as const;

  const { activeTab } = useAppStore();

  return (
    <div className="space-y-2">
      <Text size="24px" fw={600}>
        {titleMap[activeTab].title}
      </Text>
      <Text size="md" c="dimmed">
        {titleMap[activeTab].description}
      </Text>
    </div>
  );
};
