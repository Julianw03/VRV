import { z } from "zod";

export const GetNewMatchesDTOSchema = z.object({
    since: z.uuid(),
    limit: z.coerce.number().int().min(1).max(20).default(10),
});

export type GetNewMatchesDTO = z.infer<typeof GetNewMatchesDTOSchema>;