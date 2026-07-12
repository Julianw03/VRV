import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetRecentMatchesDto {
    @ApiProperty({
        description: 'Cursor to the oldest (newest) matchId known to the client.',
    })
    @IsOptional()
    @IsUUID()
    after?: UUID;

    @ApiProperty({
        description: 'Number of results to return',
        example: 10,
        minimum: 1,
        maximum: 20,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(20)
    limit = 20;
}
