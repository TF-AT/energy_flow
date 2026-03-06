# Shared UI Components

A collection of shared React components for the Energy Flow project.

## Components

- `Button`: Standard button component.
- `Card`: Container for dashboard metrics and cards.
- `Code`: Inline code formatting.

## Usage

In any Next.js app within the monorepo:

```tsx
import { Button } from "@repo/ui";

export default function Page() {
  return <Button>Click Me</Button>;
}
```

## Development

- **Build**: `npm run build`
- **Lint**: `npm run lint`
