import { z } from "zod";

export const GetRecentMatchesDTOSchema = z.object({
    after: z.uuid().optional(),
    limit: z.coerce.number().int().min(1).max(20).default(20),
});

export type GetRecentMatchesDTO = z.infer<typeof GetRecentMatchesDTOSchema>;