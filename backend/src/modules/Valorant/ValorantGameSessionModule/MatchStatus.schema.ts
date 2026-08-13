import { z } from "zod";

export const MatchStatusSchema = z.enum({
    CHAMPION_SELECTION: "CHAMPION_SELECTION",
    IN_PROGRESS: "IN_PROGRESS",
    ENDED: "ENDED",
    ASSUMED_CANCELLED: "ASSUMED_CANCELLED",
});

export type MatchStatus = z.infer<typeof MatchStatusSchema>;