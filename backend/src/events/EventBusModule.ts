import { Module } from '@nestjs/common';
import { SimpleEventBusImpl } from '@/events/impl/SimpleEventBusImpl';
import { SimpleEventBus } from '@/events/SimpleEventBus';
import { WSEventPublisher } from '@/events/WSEventPublisher';

@Module({
    imports: [],
    providers: [
        {
            provide: SimpleEventBus,
            useClass: SimpleEventBusImpl,
        },
        WSEventPublisher,
    ],
    exports: [SimpleEventBus],
})
export class EventBusModule {}
