import { groupBy } from '@/lib/utils.ts';
import SlantedDisplay, { FacingDirections } from '@/components/advancedDetails/SlantedDisplay.tsx';
import AgentDisplayComponent from '@/components/advancedDetails/AgentDisplayComponent.tsx';
import type { ReplayMetadataV2 } from '#/schemas/ReplayFormatV2.schema.ts';

export interface VersusTabProps {
    data: ReplayMetadataV2
}

export function VersusTab({ data }: VersusTabProps) {
    const activePlayersByTeam = Object.values(groupBy((p => p.teamId), ...data.riotMatchMetadata.matchMetadata.players.filter(p => !p.isObserver)));
    const puuidResolver = data.riotMatchMetadata.puuidResolver;
    return (
        <div className={'w-full aspect-[10] flex overflow-hidden'}>
            <div className="flex-1">
                <SlantedDisplay
                    tilt={35}
                    gap={5}
                    tiltTowards={FacingDirections.LEFT}
                    renderItem={(teamEntry, props) => (
                        <AgentDisplayComponent
                            agentId={teamEntry.characterId}
                            gameName={puuidResolver[teamEntry.subject].gameName}
                            tagLine={puuidResolver[teamEntry.subject].tagLine}
                            {...props}
                        />
                    )}
                    items={
                        activePlayersByTeam[0]
                    } />
            </div>
            <div className={'w-8'}></div>
            <div className="flex-1">
                <SlantedDisplay
                    tilt={50}
                    gap={10}
                    tiltTowards={FacingDirections.RIGHT}
                    renderItem={(teamEntry, props) => (
                        <AgentDisplayComponent
                            agentId={teamEntry.characterId}
                            gameName={puuidResolver[teamEntry.subject].gameName}
                            tagLine={puuidResolver[teamEntry.subject].tagLine}
                            {...props}
                        />
                    )}
                    items={
                        activePlayersByTeam[1]
                    } />
            </div>
        </div>
    );
}
