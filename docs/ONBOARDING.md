# Contributor Onboarding

Welcome to **Sheet Eats**, the FundRaising Mission Trip Batam application. This guide helps you get a local development environment running and explains how to contribute code.

## 1. Clone and Install

1. Fork the repository on GitHub and clone your fork.
2. Install dependencies with **npm**:

```bash
npm install
```

## 2. Environment Variables

Copy the example environment file and edit the values:

```bash
cp src/.env.example src/.env.local
```

The Google Sheets integration is optional but supported. If you plan to use it, fill in the required keys in `src/.env.local`.

## 3. Development Server

Run the application locally:

```bash
npm run dev
```

The site will be available at `http://localhost:9002`.

## 4. Project Overview

- **src/app/** – Next.js app router pages
- **src/components/** – reusable components
- **src/data/** – static data
- **src/hooks/** – custom hooks
- **src/lib/** – utilities and server actions
- **src/ai/** – Genkit AI flows and configuration

Explore these directories to get familiar with the codebase.

## 5. Architecture and Internals

This app uses **Next.js** with the App Router. Menu items come from a Google
Sheet via helper functions in `src/lib/google-sheets.ts`. The API route
`src/app/api/menu/route.ts` exposes this data so the client can fetch it.

Shopping cart state is handled by `src/components/OrderContext.tsx`, which
provides actions for adding or removing items. When a user confirms an order,
the server action `confirmOrder` in `src/lib/actions.ts` generates an order ID
and optionally writes the order to Google Sheets.

UI components are built with the **Shadcn** library under `src/components/ui`.
The `src/ai` directory contains optional Genkit flows for future AI features.

## 6. Before You Commit

Run the following checks to catch lint and type issues:

```bash
npm run lint
npm run typecheck
```

Fix any reported errors before opening a pull request.

## 7. Opening a Pull Request

1. Push your branch to your fork.
2. Open a pull request targeting the `main` branch of the upstream repository.
3. Include a clear description of your changes and reference any relevant issues.

Thank you for contributing!
