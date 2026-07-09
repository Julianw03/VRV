import { groupBy } from '@/lib/utils.ts';
import type { RiotMatchApiResponse } from '@/lib/api.ts';
import SlantedDisplay, { FacingDirections } from '@/components/advancedDetails/SlantedDisplay.tsx';
import AgentDisplayComponent from '@/components/advancedDetails/AgentDisplayComponent.tsx';

export interface VersusTabProps {
    data: RiotMatchApiResponse;
}

export function VersusTab({ data }: VersusTabProps) {
    const activePlayersByTeam = groupBy((p => p.teamId), ...data.players.filter(p => !p.isObserver));

    return (
        <div className={'w-full aspect-[10] flex'}>
            {
                Object.entries(activePlayersByTeam).map(([, members], index) => {
                    return (
                        <>
                            <div className="flex-1">
                                <SlantedDisplay
                                    tilt={50}
                                    gap={10}
                                    tiltTowards={index === 0 ? FacingDirections.LEFT : FacingDirections.RIGHT}
                                    renderItem={(teamEntry, props) => (
                                        <AgentDisplayComponent
                                            agentId={teamEntry.characterId}
                                            gameName={teamEntry.gameName}
                                            nameBgColorHex={'#ff00ff'}
                                            tagLine={teamEntry.tagLine}
                                            {...props}
                                        />
                                    )}
                                    items={
                                        members
                                    } />
                            </div>
                            {index == 0 && (
                                <div className={'w-8'}></div>
                            )}
                        </>
                    );
                })
            }
        </div>
    );
}
