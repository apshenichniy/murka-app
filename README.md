# Murka App

An AI-powered image generation web application built with love in Valencia. This tool leverages the Nano Banana text-to-image model to create and transform images based on text prompts and reference images.

A labor of love, built in Valencia, 2025 ❤️

## Features

- **Text-to-Image Generation**: Create stunning images from text descriptions using the Nano Banana model
- **Image Editing**: Transform existing images with AI-guided modifications using reference images
- **Generation History**: Browse and manage all your previously generated creations
- **User Authentication**: Secure access with Clerk authentication
- **Real-time Updates**: Live status tracking during image generation process

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **Mantine v8** - Component library (core, dropzone, hooks)
- **Tailwind CSS v4** - Utility-first CSS framework
- **Lucide React** - Icon library

### Backend & Services
- **Convex** - Backend database and real-time data synchronization
- **Clerk** - User authentication and management
- **FAL.AI** - AI image generation using Nano Banana models
- **Vercel AI SDK** - AI integration utilities

### State Management & Utilities
- **Zustand** - Lightweight state management
- **Zod** - Schema validation
- **date-fns** - Date manipulation and formatting

### Development Tools
- **Biome** - Fast linter and formatter
- **TypeScript** - Type-safe JavaScript
- **Bun** - Package manager and runtime

## Project Structure

```
/src
  /app          - Next.js App Router pages and API routes
  /components   - React UI components
  /store        - Zustand state management
  /lib          - Utility functions and constants
  /context      - React context providers

/convex         - Backend schema and server functions
  schema.ts     - Database schema definitions
  generations.ts - Image generation logic
  auth.config.ts - Authentication configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Convex account
- Clerk account for authentication
- FAL.AI API access

### Installation

1. Install dependencies:

```bash
bun install
```

2. Set up environment variables:

Create a `.env.local` file with the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

# Convex
NEXT_PUBLIC_CONVEX_URL=your_convex_url
CONVEX_DEPLOY_KEY=your_convex_deploy_key

# FAL.AI
FAL_KEY=your_fal_api_key
```

### Development

1. Start Convex development server:

```bash
npx convex dev
```

2. In a separate terminal, start the Next.js development server:

```bash
bun dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Code Quality

```bash
# Run linter
bun run lint

# Format code
bun run format
```

## Deployment

This application is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy Convex backend: `npx convex deploy`

For detailed deployment instructions, see the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## License

Private project - All rights reserved.
