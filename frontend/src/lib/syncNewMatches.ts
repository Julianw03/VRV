import type { InfiniteData } from '@tanstack/react-query';
import type { RiotMatchApiResponseDTO } from '#/dto/RiotMatchApiReponseDTO.ts';
import { queryClient } from '@/lib/queryClient';
import { queryKeys } from '@/lib/queries';
import { useAppStore } from '@/store/useAppStore';

/**
 * Keeps the `recentMatches` query cache in sync with `ValorantMatchStatsManager` WS
 * events (fired when a match ends and its stats have been fetched): any match not yet
 * known to the cache is inserted at the position matching its `gameStartMillis`, so
 * newly finished matches show up without polling the REST API.
 *
 * This is a plain module-level subscription rather than a hook — it has no props, no
 * render output, and no per-page lifecycle, so it's registered once here (imported for
 * its side effect in `main.tsx`) instead of being mounted from a component tree.
 */
useAppStore.subscribe((state, prevState) => {
    const cache = state.matchStatsCache;
    if (cache === null || cache === prevState.matchStatsCache) return;

    for (const [matchId, result] of Object.entries(cache)) {
        if (result.type !== 'SUCCESS' || prevState.matchStatsCache?.[matchId] === result) continue;

        const match = result.data;
        queryClient.setQueryData<InfiniteData<RiotMatchApiResponseDTO[], UUID | null>>(
            queryKeys.recentMatches,
            (old) => {
                if (!old || old.pages.some((page) => page.some((m) => m.matchInfo.matchId === matchId))) {
                    return old;
                }
                const firstPage = old.pages[0] ?? [];
                const insertAt = firstPage.findIndex(
                    (m) => m.matchInfo.gameStartMillis < match.matchInfo.gameStartMillis,
                );
                const newFirstPage =
                    insertAt === -1
                        ? [...firstPage, match]
                        : [...firstPage.slice(0, insertAt), match, ...firstPage.slice(insertAt)];
                return { ...old, pages: [newFirstPage, ...old.pages.slice(1)] };
            },
        );
    }
});
