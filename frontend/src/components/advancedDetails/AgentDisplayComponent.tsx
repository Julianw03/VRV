import { FacingDirections, type ItemProps } from './SlantedDisplay.tsx';
import { useAgentRegistry } from '@/lib/queries.ts';
import type { GUID } from '#/schemas/GUIDSchema.ts';

export interface AgentDisplayProps extends ItemProps {
    agentId: GUID,
    nameBgColorHex: string,
    gameName: string,
    tagLine: string
}

const AgentDisplayComponent = (
    {
        agentId,
        gameName,
        isSelected,
        nameBgColorHex,
        direction,
        currentTilt,
    }: AgentDisplayProps,
) => {

    const agent = useAgentRegistry()?.[agentId];

    if (!agent) {
        return null;
    }

    const gradient =
        agent.backgroundGradientColors && agent.backgroundGradientColors.length > 0
            ? `linear-gradient(
            45deg,
            ${agent.backgroundGradientColors
                ?.map(
                    (color, index) =>
                        `#${color} ${(index * 100) / (agent.backgroundGradientColors!.length - 1)}%`,
                )
                ?.join(', ') ?? "#FFFFFF"}
        )`
            : undefined;

    const offset = {
        backgroundColor: nameBgColorHex,
    } as React.CSSProperties;
    if (direction === FacingDirections.LEFT) {
        offset.paddingLeft = `${currentTilt}px`;
    } else {
        offset.paddingRight = `${currentTilt}px`;
    }


    const bgMask = isSelected ? {
        backgroundImage: gradient ? `${gradient}` : undefined,
        WebkitMaskImage: `url(${agent.background})`,
        maskImage: `url(${agent.background})`,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskSize: 'cover',
        maskSize: 'cover',
    } as React.CSSProperties : undefined;

    return (
        <div className="relative h-full w-full flex flex-col overflow-hidden justify-center items-center">
            <div
                className={`relative min-h-0 flex-1 overflow-hidden transition-[width] duration-300 ${isSelected ? 'w-full' : 'w-1/2'} `}>
                <img src={agent.fullPortrait!}
                     className={`absolute object-cover scale-x-[2.5] scale-y-[2.5] origin-[50%_15%] z-1`}
                />
                <div
                    className={`absolute inset-0 transition-opacity duration-500 ${isSelected ? '' : 'opacity-0'}`}
                    style={bgMask}
                >
                </div>
            </div>
            <div className={'flex w-full justify-center items-center z-1'} style={{background: nameBgColorHex}}>
                <span className={'flex-1 shrink-0 truncate text-center text-sm'}
                      style={offset}>{gameName}</span>
            </div>
        </div>
    );
};

export default AgentDisplayComponent;