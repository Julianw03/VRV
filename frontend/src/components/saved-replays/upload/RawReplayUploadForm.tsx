import { useState } from 'react';
import { FileVideo } from 'lucide-react';
import { Input } from '@/components/ui/input.tsx';
import { ReplayUploadForm } from '@/components/saved-replays/upload/ReplayUploadForm.tsx';
import { GUIDSchema } from '#/schemas/GUIDSchema.ts';
import { ReplayFileTypeSchema, type ReplayImportRequest } from '#/schemas/upload/ImportReplay.schema.ts';

export function RawReplayUploadForm({ onUploaded }: { onUploaded: () => void }) {
    const [matchUuid, setMatchUuid] = useState('');
    const matchUuidValid = GUIDSchema.safeParse(matchUuid).success;

    return (
        <ReplayUploadForm
            extension=".vrf"
            icon={FileVideo}
            buildRequest={(): ReplayImportRequest | null =>
                matchUuidValid ? { type: ReplayFileTypeSchema.enum.replayFile, matchUuid } : null
            }
            onUploaded={onUploaded}
        >
            <div className="flex flex-col gap-1.5">
                <label htmlFor="match-uuid" className="text-sm font-medium">
                    Match UUID
                </label>
                <Input
                    id="match-uuid"
                    placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                    value={matchUuid}
                    onChange={(e) => setMatchUuid(e.target.value)}
                    aria-invalid={matchUuid.length > 0 && !matchUuidValid}
                />
                <p className="text-xs text-muted-foreground">
                    A raw <code className="font-mono">.vrf</code> file has no embedded match ID — provide the match
                    UUID this replay belongs to.
                </p>
            </div>
        </ReplayUploadForm>
    );
}
