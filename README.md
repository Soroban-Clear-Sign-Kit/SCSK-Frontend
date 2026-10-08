# Soroban Clear-Sign Kit - Frontend React Kit (`@clearsign/react`)

The Frontend package of the **Soroban Clear-Sign Kit (SCSK)** provides React context providers, hooks, and presentation components for inspecting, simulating, and previewing Soroban and Stellar transactions with human-readable clarity.

## Features

- **`ClearSignModal`**: A plug-and-play UI component to safely preview, simulate, and request signatures for transactions.
- **`useClearSign`**: A hook that manages the UI state for transaction previews and leverages `@clearsign/core` to build transaction summaries and decode arguments.
- **Accessibility & UX**: Built with modern CSS modules, offering clean diffs, warning cards, and structured invocation displays.

## Installation

```bash
pnpm install
```

## Running the Demo

A full Vite + React demo application is included:

```bash
cd example
pnpm install
pnpm run dev
```

## Building

```bash
pnpm run build
```

## Testing

```bash
pnpm run test
```
