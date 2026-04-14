import { Module } from '@nestjs/common';
import { RiotClientServiceImpl } from './RiotClientServiceImpl';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LockfileParameterAcquisitionStrategy } from './connection/LockfileParameterAcquisitionStrategy';
import {
    RIOT_CLIENT_PARAMETER_ACQUISITION_STRATEGY,
    RIOT_CLIENT_SERVICE,
} from './RiotClientTokens';
import { RiotClientController } from './RiotClientController';

@Module({
    imports: [EventEmitterModule.forRoot()],
    controllers: [RiotClientController],
    providers: [
        {
            provide: RIOT_CLIENT_PARAMETER_ACQUISITION_STRATEGY,
            useClass: LockfileParameterAcquisitionStrategy,
        },
        { provide: RIOT_CLIENT_SERVICE, useClass: RiotClientServiceImpl },
    ],
    exports: [RIOT_CLIENT_SERVICE],
})
export class RiotClientModule {}
