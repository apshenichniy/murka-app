"use client";

import { useUser } from "@clerk/nextjs";
import {
  AppShell,
  AppShellMain,
  Avatar,
  Burger,
  NavLink,
  ScrollArea,
  Text,
  Title,
} from "@mantine/core";
import { HistoryIcon, ImageIcon, WandIcon } from "lucide-react";
import { type AppStore, useAppStore } from "@/store/app-store";
import { History } from "./history";
import { Playground } from "./playground";
import { SignIn } from "./sign-in";

export const App = () => {
  const { activeTab, navbarOpened, toggleNavbar } = useAppStore();

  const { user } = useUser();
  if (!user) {
    return <SignIn />;
  }

  return (
    <AppShell
      layout="alt"
      padding={{
        base: 12,
        md: "lg",
      }}
      header={{
        height: 48,
      }}
      navbar={{
        breakpoint: "sm",
        width: 240,
        collapsed: {
          mobile: !navbarOpened,
          desktop: false,
        },
      }}
    >
      <AppShell.Header className="flex items-center px-2 gap-2">
        <Burger
          opened={navbarOpened}
          onClick={toggleNavbar}
          hiddenFrom="sm"
          size="sm"
        />
        <Title order={3}>{titleMap[activeTab].title}</Title>
      </AppShell.Header>
      <AppShell.Navbar px={12} py={{ base: 12, md: 50 }}>
        <Navbar />
      </AppShell.Navbar>
      <AppShell.Footer>
        <Text size="xs" fw={500} className="text-center md:translate-x-[120px]">
          Made with ❤️ for Murka · Valencia, 2025
        </Text>
      </AppShell.Footer>

      <AppShellMain component={ScrollArea} bg="gray.0">
        <div
          className={
            activeTab === "image-edit" || activeTab === "text-to-image"
              ? "block"
              : "hidden"
          }
        >
          <Playground />
        </div>
        <div className={activeTab === "history" ? "block" : "hidden"}>
          <History />
        </div>
      </AppShellMain>
    </AppShell>
  );
};

const Navbar = () => {
  const { activeTab, navigateTo } = useAppStore();

  return (
    <div className="space-y-1">
      <NavLink
        component="button"
        label="Text to Image"
        leftSection={<WandIcon size={16} strokeWidth={2} />}
        variant="filled"
        active={activeTab === "text-to-image"}
        fw={500}
        onClick={() => navigateTo("text-to-image")}
      />
      <NavLink
        component="button"
        label="Image Edit"
        leftSection={<ImageIcon size={16} strokeWidth={2} />}
        active={activeTab === "image-edit"}
        fw={500}
        variant="filled"
        onClick={() => navigateTo("image-edit")}
      />
      <NavLink
        component="button"
        label="History"
        leftSection={<HistoryIcon size={16} strokeWidth={2} />}
        active={activeTab === "history"}
        fw={500}
        variant="filled"
        onClick={() => navigateTo("history")}
      />
    </div>
  );
};

export const App2 = () => {
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
      <AppShell.Header>
        <Header />
      </AppShell.Header>
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
      </AppShell.Navbar>
    </AppShell>
  );
};

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

const Header = () => {
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
