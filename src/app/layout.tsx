import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
import type { Metadata } from "next";
import theme from "./theme";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/context/convex-provider";

export const metadata: Metadata = {
  title: "Banana App",
  description: "Image editor app made for Murka",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" {...mantineHtmlProps} className="overflow-hidden h-full">
      <head>
        <ColorSchemeScript />
      </head>
      <body className="antialiased overflow-auto h-full">
        <MantineProvider theme={theme}>
          <ClerkProvider>
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </ClerkProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
