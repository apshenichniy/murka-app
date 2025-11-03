"use client";

import { useUser } from "@clerk/nextjs";
import { App } from "@/components/app";
import { SignIn } from "@/components/sign-in";

export default function Home() {
  const { isSignedIn, user } = useUser();

  if (isSignedIn && user) {
    return <App />;
  }

  return <SignIn />;
}
