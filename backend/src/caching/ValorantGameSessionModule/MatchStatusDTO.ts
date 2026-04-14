import { IsEnum } from 'class-validator';
import { MatchStatus } from '@/caching/ValorantGameSessionModule/MatchStatus';

export class MatchStatusDTO {
    @IsEnum(MatchStatus)
    readonly status: MatchStatus;
}
