import { Controller, Get, HttpStatus, Logger, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiNotFoundResponse, ApiResponse } from '@nestjs/swagger';
import { RiotClientReadyGuard } from '@/core/riotclient/RiotClientReadyGuard';
import { AccountPuuidManager } from '@/modules/Account/AccountPuuidModule/AccountPuuidManager';

@UseGuards(RiotClientReadyGuard)
@Controller({
    path: 'caching/riot-account',
    version: '1',
})
export class AccountPuuidController {
    private readonly logger = new Logger(this.constructor.name);

    constructor(
        protected readonly accountPuuidManager: AccountPuuidManager,
    ) {
    }

    @Get('puuid')
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Returns the active account name and tag line.',
    })
    @ApiNotFoundResponse({
        description:
            'Returned when the active accounts puuid can not be found, possibly because the user is not logged in.',
        type: NotFoundException,
    })
    public async getActiveAccountNameAndTagLine() {
        const optState = this.accountPuuidManager.getView();
        if (optState === null) {
            throw new NotFoundException(
                'Active account name and tag line not found, maybe you are not logged in?',
            );
        }
        return optState;
    }
}
