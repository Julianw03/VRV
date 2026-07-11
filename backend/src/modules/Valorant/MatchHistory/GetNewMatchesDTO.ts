import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetNewMatchesDto {
    @ApiProperty({
        description: 'Cursor to the latest (newest) matchId known to the client.',
    })
    @IsUUID()
    since: UUID;

    @ApiProperty({
        description: 'Number of results to return',
        example: 5,
        minimum: 1,
        maximum: 10,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(10)
    limit = 20;
}
