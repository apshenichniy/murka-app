"use client";

import { SignIn as ClerkSignIn } from "@clerk/nextjs";

export const SignIn = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <ClerkSignIn />
    </div>
  );
};
