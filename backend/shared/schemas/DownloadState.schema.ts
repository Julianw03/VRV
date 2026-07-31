import { z } from "zod";

export const DownloadState = {
    DOWNLOADING: "DOWNLOADING",
    DOWNLOADED: "DOWNLOADED",
    FAILED: "FAILED",
} as const;

export const DownloadStateSchema = z.enum(DownloadState);

export type DownloadState = z.infer<typeof DownloadStateSchema>;

export const DownloadStateDTOSchema = z.object({
    state: DownloadStateSchema,
});

export type DownloadStateDTO = z.infer<typeof DownloadStateDTOSchema>;