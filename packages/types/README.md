# Shared Types

Centralized TypeScript definitions and models for the Energy Flow platform.

## Usage

These types are used to ensure consistency between the API responses and the Frontend data models.

```ts
import { Transformer, Reading } from "@repo/types";
```

## Maintenance

Update these types whenever:
1. The Prisma schema is updated.
2. API endpoint response structures change.
3. Common domain models are introduced.
