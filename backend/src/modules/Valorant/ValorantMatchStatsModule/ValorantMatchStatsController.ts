import {
    BadRequestException,
    ClassSerializerInterceptor,
    Controller,
    HttpCode,
    HttpStatus,
    Logger,
    NotFoundException,
    Param,
    Post,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { RiotClientReadyGuard } from '@/core/riotclient/RiotClientReadyGuard';
import { ValorantMatchStatsManager } from '@/modules/Valorant/ValorantMatchStatsModule/ValorantMatchStatsManager';
import { ProductSessionGuard, RequiredProduct } from '@/modules/ProductSessionModule/ProductSessionGuard';
import type { GUID } from '#/schemas/GUIDSchema';

@RequiredProduct('valorant')
@UseGuards(RiotClientReadyGuard, ProductSessionGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller({
    version: '1',
    path: 'caching/valorant-game-stats',
})
export class ValorantMatchStatsController {
    private readonly logger = new Logger(this.constructor.name);

    constructor(
        protected readonly valorantMatchEndedManager: ValorantMatchStatsManager,
    ) {
    }

    // @Get('')
    // @ApiExtraModels(Pending, Success, Failure, RiotMatchApiResponseDTOSchema)
    // @ApiOkResponse({
    //     schema: {
    //         type: 'object',
    //         additionalProperties: AsyncResultSchema(
    //             getSchemaPath(RiotMatchApiResponseDTOSchema),
    //         ),
    //     },
    // })
    public async getMatchOverview() {
        const view = this.valorantMatchEndedManager.getView();

        if (view === null) {
            throw new NotFoundException();
        }

        return view;
    }

    // @Get(':id')
    // @ApiExtraModels(Success, Failure, Pending, RiotMatchApiResponseDTOSchema)
    // @ApiOkResponse({
    //     schema: AsyncResultSchema(getSchemaPath(RiotMatchApiResponseDTOSchema)),
    // })
    public async getById(@Param('id') id: GUID) {
        if (!id) return new BadRequestException();
        const viewEntry = this.valorantMatchEndedManager.getKeyView(id);

        if (viewEntry === null) {
            throw new NotFoundException('No data for the given match ID');
        }

        return viewEntry;
    }

    @Post(':id/fetch')
    @HttpCode(HttpStatus.ACCEPTED.valueOf())
    public triggerFetch(@Param('id') id: GUID) {
        if (!id) throw new BadRequestException();
        this.valorantMatchEndedManager.requestMatchFetch(id);
    }
}
