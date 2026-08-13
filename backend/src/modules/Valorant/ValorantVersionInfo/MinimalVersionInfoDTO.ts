import { z } from 'zod';

export const MinimalVersionSchema = z.object({
    version: z.string(),
});

export type MinimalVersionInfoDTO = z.infer<typeof MinimalVersionSchema>;