import { z } from "zod";

export const EntitlementTokenDTOSchema = z.object({
    accessToken: z.string(),
    entitlements: z.array(z.string()),
    issuer: z.string(),
    subject: z.string(),
    token: z.string(),
});

export type EntitlementTokenDTO = z.infer<typeof EntitlementTokenDTOSchema>;