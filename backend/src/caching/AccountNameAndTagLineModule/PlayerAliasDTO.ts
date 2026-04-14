import { IsString } from 'class-validator';

export class PlayerAliasDTO {
    @IsString()
    readonly tagLine: string;
    @IsString()
    readonly gameName: string;
}
