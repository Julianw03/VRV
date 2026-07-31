import { z } from "zod";
import { MatchStatusSchema } from '@/modules/Valorant/ValorantGameSessionModule/MatchStatus.schema';

export const MatchStatusDTOSchema = z.object({
    status: MatchStatusSchema,
});

export type MatchStatusDTO = z.infer<typeof MatchStatusDTOSchema>;