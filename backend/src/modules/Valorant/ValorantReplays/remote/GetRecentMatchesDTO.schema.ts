import { z } from "zod";

export const GetRecentMatchesDTOSchema = z.object({
    offset: z.coerce.number().int().min(0),
    limit: z.coerce.number().int().min(1).max(20),
});

export type GetRecentMatchesDTO = z.infer<typeof GetRecentMatchesDTOSchema>;