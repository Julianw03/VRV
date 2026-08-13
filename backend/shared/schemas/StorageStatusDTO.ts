import { z } from "zod";

export const StorageStatusDTOSchema = z.object({
    isSetup: z.boolean(),
    matchCount: z.number(),
    totalSizeBytes: z.number(),
});

export type StorageStatusDTO = z.infer<typeof StorageStatusDTOSchema>;