import { TooltipContent, TooltipTrigger, Tooltip } from '@/components/ui/tooltip.tsx';

export const InjectTooltip = ({
                           tooltip,
                           children,
                       }: {
    tooltip: string;
    children: React.ReactNode;
}) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <div>{children}</div>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
);