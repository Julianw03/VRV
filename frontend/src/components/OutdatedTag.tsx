import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useShippingVersion } from '@/lib/queries';
import { checkCompatibility, VersionComparisonResult } from '@/lib/VersionUtils.ts';

interface OutdatedTagProps {
    matchGameVersion: string | null;
}

export function OutdatedTag({ matchGameVersion }: OutdatedTagProps) {
    const shippingVersion = useShippingVersion();
    const versionCompatibility = checkCompatibility(shippingVersion, matchGameVersion);

    switch (versionCompatibility) {
        case VersionComparisonResult.PROBABLY_COMPATIBLE:
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="cursor-default rounded-md border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                            Outdated
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>
                            This match was played on an older game version, but may still be compatible.
                        </p>
                    </TooltipContent>
                </Tooltip>
            );

        case VersionComparisonResult.INCOMPATIBLE:
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="cursor-default rounded-md border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                            Incompatible
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>
                            This match was played on a significantly older game version and will very likely lead to a crash when being injected.
                        </p>
                    </TooltipContent>
                </Tooltip>
            );

        case VersionComparisonResult.UNKNOWN:
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="cursor-default rounded-md border border-gray-500/30 bg-gray-500/20 px-2 py-0.5 text-xs font-medium text-gray-400">
                            Unknown
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>
                            Unable to determine version compatibility for this match game version.
                        </p>
                    </TooltipContent>
                </Tooltip>
            );
        case VersionComparisonResult.EXACT_MATCH:
        default:
            return null;
    }
}