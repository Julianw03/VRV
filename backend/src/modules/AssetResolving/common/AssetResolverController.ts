import { Get, NotFoundException, Param } from '@nestjs/common';
import { KeyDataViewable } from '@/core/data/interfaces/capabilities/KeyDataViewable';

/**
 * Base for asset resolver controllers: exposes `GET /:id` and `GET /` over a
 * `KeyDataViewable` manager. Subclasses just need their own `@Controller`
 * decorator and a constructor forwarding the concrete manager + a label used
 * in not-found messages. Nest merges route handlers up the prototype chain,
 * so the inherited `@Get` routes are registered on the subclass as-is.
 */
export abstract class AssetResolverController<TId extends PropertyKey, TDto> {
    protected constructor(
        protected readonly assetResolver: KeyDataViewable<TId, TDto>,
        protected readonly assetLabel: string,
    ) {
    }

    @Get('/:id')
    public async getOne(@Param('id') id: TId) {
        const asset = this.assetResolver.getKeyView(id);
        if (!asset) {
            throw new NotFoundException(`${this.assetLabel} asset not found for path: ${String(id)}`);
        }
        return asset;
    }

    @Get('/')
    public async getAll() {
        const allAssets = this.assetResolver.getView();
        if (!allAssets) {
            throw new NotFoundException(`${this.assetLabel} assets not ready yet.`);
        }
        return allAssets;
    }
}
