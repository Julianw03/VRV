import { Injectable } from '@nestjs/common';
import { MapDataManager } from '../base/MapDataManager';
import { ProductSessionSession } from '@/../gen';
import { ProductSessionDTO } from '@/caching/ProductSessionManager/ProductSessionDTO';

export type SessionId = string;

@Injectable()
export class ProductSessionManager extends MapDataManager<
    SessionId,
    ProductSessionSession,
    ProductSessionDTO
> {
    constructor() {
        super();
    }

    protected getViewForValue(
        value: ProductSessionSession | null,
    ): ProductSessionDTO | null {
        if (value === null) {
            return null;
        }

        const launchConfiguration = value.launchConfiguration!;

        return {
            productId: value.productId!,
            isInternal: value.isInternal!,
            launchConfiguration: {
                arguments: [...launchConfiguration.arguments!],
                executable: launchConfiguration.executable!,
                workingDirectory: launchConfiguration?.workingDirectory!,
                locale: launchConfiguration.locale!,
            },
        };
    }

    protected async resetInternalState(): Promise<void> {
        this.setState(new Map());
    }

    public getSessionByProductId(productId: string): ProductSessionDTO | null {
        const sessions = this.getView();
        if (!sessions) return null;

        const eligibleSession = Array.from(sessions.values()).find(
            (s) => s?.productId === productId,
        ) as ProductSessionDTO | undefined;

        return eligibleSession ?? null;
    }
}
