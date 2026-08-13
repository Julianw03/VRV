import { type ChangeEvent, type DragEvent, type ReactNode, useRef, useState } from 'react';
import { AlertCircle, FileUp, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useUploadReplay } from '@/lib/queries';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';

export function UploadReplayDialog({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [override, setOverride] = useState(true);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadReplay = useUploadReplay();

    function reset() {
        setFile(null);
        setOverride(true);
        setDragOver(false);
        uploadReplay.reset();
    }

    function handleOpenChange(next: boolean) {
        setOpen(next);
        if (!next) reset();
    }

    function acceptFile(candidate: File | undefined) {
        if (!candidate) return;
        if (!candidate.name.toLowerCase().endsWith('.vrp')) return;
        uploadReplay.reset();
        setFile(candidate);
    }

    function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
        acceptFile(e.target.files?.[0]);
        e.target.value = '';
    }

    function handleDragOver(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setDragOver(true);
    }

    function handleDragLeave() {
        setDragOver(false);
    }

    function handleDrop(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setDragOver(false);
        acceptFile(e.dataTransfer.files?.[0]);
    }

    function handleUpload() {
        if (!file) return;
        uploadReplay.mutate(
            { file, override },
            {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload Replay</DialogTitle>
                    <DialogDescription>
                        Select a <code className="font-mono text-xs">.vrp</code> replay package file to import into
                        storage.
                    </DialogDescription>
                </DialogHeader>

                {/* Drop zone */}
                <div
                    role="button"
                    tabIndex={0}
                    aria-label="Select .vrp file"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
                        dragOver
                            ? 'border-primary bg-primary/5'
                            : file
                                ? 'border-border bg-muted/30'
                                : 'border-border hover:border-muted-foreground/50 hover:bg-muted/20',
                    )}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".vrp"
                        className="hidden"
                        onChange={handleFileInputChange}
                    />

                    {file ? (
                        <>
                            <FileUp className="size-7 text-muted-foreground" />
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(1)} MB — click to change
                            </p>
                        </>
                    ) : (
                        <>
                            <Upload className="size-7 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                Drop a <span className="font-medium text-foreground">.vrp</span> file here, or click to
                                browse
                            </p>
                        </>
                    )}
                </div>

                {/* Override option */}
                <label className="mt-4 flex cursor-pointer items-center gap-3">
                    <Checkbox
                        checked={override}
                        onCheckedChange={(v) => setOverride(v === true)}
                    />
                    <div>
                        <p className="text-sm font-medium">Override if already exists</p>
                        <p className="text-xs text-muted-foreground">
                            Replace the stored replay if this match ID is already present.
                        </p>
                    </div>
                </label>

                {/* Error */}
                {uploadReplay.isError && (
                    <div
                        className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        <AlertCircle className="size-4 shrink-0" />
                        {uploadReplay.error?.message ?? 'Upload failed'}
                    </div>
                )}

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={uploadReplay.isPending}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        onClick={handleUpload}
                        disabled={!file || uploadReplay.isPending}
                    >
                        <Upload className={cn(uploadReplay.isPending && 'animate-pulse')} />
                        {uploadReplay.isPending ? 'Uploading…' : 'Upload'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
