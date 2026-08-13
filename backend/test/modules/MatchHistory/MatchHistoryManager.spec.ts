import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Subject } from 'rxjs';
import { MatchHistoryManager } from '@/modules/Valorant/MatchHistory/MatchHistoryManager';
import { RiotValorantAPIManager } from '@/integrations/riot/RiotValorantAPIManager';
import { ValorantMatchStatsManager } from '@/modules/Valorant/ValorantMatchStatsModule/ValorantMatchStatsManager';
import { SimpleEventBus } from '@/core/events/SimpleEventBus';
import { EventType } from '@/core/events/EventTypes';
import * as rxjsAdapters from '@/core/events/adapters/rxjsAdapters';
import { MatchStatusSchema } from '@/modules/Valorant/ValorantGameSessionModule/MatchStatus.schema';

// We mock the adapter so we can push events into a Subject we control,
// instead of needing a real SimpleEventBus wiring.
vi.mock('@/core/events/adapters/rxjsAdapters');

function makeMatch(id: string, gameStartTime: number) {
    return { MatchID: id, GameStartTime: gameStartTime } as any;
}

describe('MatchHistoryManager', () => {
    let manager: MatchHistoryManager;
    let riot: RiotValorantAPIManager & { getMatchHistory: ReturnType<typeof vi.fn> };
    let stats: ValorantMatchStatsManager & {
        requestMatchFetch: ReturnType<typeof vi.fn>;
        getBestEffortBatchedResult: ReturnType<typeof vi.fn>;
    };
    let eventBus: SimpleEventBus;
    let eventSubject: Subject<any>;

    beforeEach(() => {
        riot = {
            getMatchHistory: vi.fn(),
        } as any;
        // Safe default so any incidental auto-triggered loadMore() (e.g. from
        // getMatchIdsAfter's `orderedMatchIds.length < limit` check) doesn't
        // crash on an unmocked call. Individual tests override this as needed.
        riot.getMatchHistory.mockResolvedValue([]);

        stats = {
            requestMatchFetch: vi.fn(),
            getBestEffortBatchedResult: vi.fn().mockResolvedValue({}),
        } as any;

        eventBus = {} as any;

        eventSubject = new Subject();
        (rxjsAdapters.onSource as ReturnType<typeof vi.fn>).mockReturnValue(eventSubject);

        manager = new MatchHistoryManager(riot, eventBus, stats);
        manager.onModuleInit();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // ---------------------------------------------------------------------
    // prepend (via event subscription)
    // ---------------------------------------------------------------------
    describe('event-driven prepend', () => {
        it('prepends a match and requests its data when status is ENDED', async () => {
            eventSubject.next({
                type: EventType.KeyValueUpdated,
                payload: { key: 'match-1', value: MatchStatusSchema.enum.ENDED },
            });

            const ids = await manager.getMatchIdsAfter(null, 10);
            expect(ids).toEqual(['match-1']);
            expect(stats.requestMatchFetch).toHaveBeenCalledWith('match-1');
        });

        it('ignores KeyValueUpdated events whose value is not ENDED', async () => {
            eventSubject.next({
                type: EventType.KeyValueUpdated,
                payload: { key: 'match-1', value: MatchStatusSchema.enum.IN_PROGRESS },
            });

            riot.getMatchHistory.mockResolvedValue([]);
            const ids = await manager.getMatchIdsAfter(null, 10);
            expect(ids).toEqual([]);
            expect(stats.requestMatchFetch).not.toHaveBeenCalled();
        });

        it('ignores events of a different type entirely', async () => {
            eventSubject.next({ type: 'SomethingElse', payload: {} });
            expect(stats.requestMatchFetch).not.toHaveBeenCalled();
        });

        it('ignores a duplicate match id (no double insert, no double fetch)', async () => {
            const evt = {
                type: EventType.KeyValueUpdated,
                payload: { key: 'match-1', value: MatchStatusSchema.enum.ENDED },
            };
            eventSubject.next(evt);
            eventSubject.next(evt);

            const ids = await manager.getMatchIdsAfter(null, 10);
            expect(ids).toEqual(['match-1']);
            expect(stats.requestMatchFetch).toHaveBeenCalledTimes(1);
        });

        it('newly-ended matches are placed before previously loaded ones', async () => {
            riot.getMatchHistory.mockResolvedValue([makeMatch('old-1', 100)]);
            await manager.getMatchIdsAfter(null, 10); // loads old-1

            eventSubject.next({
                type: EventType.KeyValueUpdated,
                payload: { key: 'new-1', value: MatchStatusSchema.enum.ENDED },
            });

            const ids = await manager.getMatchIdsAfter(null, 10);
            expect(ids).toEqual(['new-1', 'old-1']);
        });

        it('keeps a live-prepended match at the front when it arrives mid-flight of a loadMore fetch', async () => {
            // Control exactly when the Riot fetch resolves so we can fire the
            // "match ended" event while the fetch is still pending.
            let resolvePage: (v: any) => void;
            riot.getMatchHistory.mockReturnValue(
                new Promise((resolve) => {
                    resolvePage = resolve;
                }),
            );

            const pending = manager.getMatchIdsAfter(null, 10); // triggers loadMore, now in flight

            // The live match ends *while* the historical fetch is still pending.
            eventSubject.next({
                type: EventType.KeyValueUpdated,
                payload: { key: 'live-1', value: MatchStatusSchema.enum.ENDED },
            });

            // The pending historical page resolves afterward.
            resolvePage!([makeMatch('hist-1', 200), makeMatch('hist-2', 100)]);
            const ids = await pending;

            // The live match must stay at the front; the historical page
            // (sorted desc by GameStartTime) is appended after it.
            expect(ids).toEqual(['live-1', 'hist-1', 'hist-2']);
            expect(stats.requestMatchFetch).toHaveBeenCalledWith('live-1');
            expect(stats.requestMatchFetch).toHaveBeenCalledWith('hist-1');
            expect(stats.requestMatchFetch).toHaveBeenCalledWith('hist-2');
        });

        it('does not double-insert when the in-flight page eventually also contains the live-prepended match', async () => {
            let resolvePage: (v: any) => void;
            riot.getMatchHistory.mockReturnValue(
                new Promise((resolve) => {
                    resolvePage = resolve;
                }),
            );

            const pending = manager.getMatchIdsAfter(null, 10);

            eventSubject.next({
                type: EventType.KeyValueUpdated,
                payload: { key: 'live-1', value: MatchStatusSchema.enum.ENDED },
            });

            // Simulate Riot's own paginated history having since caught up and
            // now also reporting the just-ended match.
            resolvePage!([makeMatch('live-1', 500), makeMatch('hist-1', 100)]);
            const ids = await pending;

            expect(ids).toEqual(['live-1', 'hist-1']);
            expect(stats.requestMatchFetch).toHaveBeenCalledTimes(2); // once for live-1 (via prepend), once for hist-1
            expect(stats.requestMatchFetch).toHaveBeenCalledWith('live-1');
            expect(stats.requestMatchFetch).toHaveBeenCalledWith('hist-1');
        });
    });

    // ---------------------------------------------------------------------
    // account uuid change -> state reset (via event subscription)
    // ---------------------------------------------------------------------
    describe('account uuid change resets state', () => {
        function pushUuid(uuid: string | null) {
            eventSubject.next({
                type: EventType.StateUpdated,
                payload: { value: uuid === null ? null : { uuid } },
            });
        }

        it('clears loaded matches and the exhausted flag when the uuid changes', async () => {
            // Short page marks history as exhausted for the current user.
            riot.getMatchHistory.mockResolvedValueOnce([makeMatch('a', 100)]);
            const ids = await manager.getMatchIdsAfter(null, 10);
            expect(ids).toEqual(['a']);

            riot.getMatchHistory.mockClear();
            await manager.getMatchIdsAfter(null, 100);
            expect(riot.getMatchHistory).not.toHaveBeenCalled(); // still exhausted, proves 'a' was cached

            pushUuid('user-2');

            // A fresh fetch must happen: neither the old match nor the
            // exhausted flag should have survived the uuid change.
            riot.getMatchHistory.mockResolvedValueOnce([makeMatch('b', 50)]);
            const idsAfterReset = await manager.getMatchIdsAfter(null, 10);
            expect(idsAfterReset).toEqual(['b']);
            expect(riot.getMatchHistory).toHaveBeenCalledWith(0, 20);
        });

        it('allows a previously-seen match id to be re-prepended after a reset', async () => {
            eventSubject.next({
                type: EventType.KeyValueUpdated,
                payload: { key: 'match-1', value: MatchStatusSchema.enum.ENDED },
            });
            expect(stats.requestMatchFetch).toHaveBeenCalledTimes(1);

            pushUuid('user-2');

            eventSubject.next({
                type: EventType.KeyValueUpdated,
                payload: { key: 'match-1', value: MatchStatusSchema.enum.ENDED },
            });

            const ids = await manager.getMatchIdsAfter(null, 10);
            expect(ids).toEqual(['match-1']);
            expect(stats.requestMatchFetch).toHaveBeenCalledTimes(2);
        });

        it('does not reset state when the same uuid is emitted again', async () => {
            pushUuid('user-1');

            riot.getMatchHistory.mockResolvedValueOnce([makeMatch('a', 100)]);
            await manager.getMatchIdsAfter(null, 10);
            riot.getMatchHistory.mockClear();

            pushUuid('user-1'); // same uuid again, must be a no-op (distinctUntilChanged)

            const ids = await manager.getMatchIdsAfter(null, 10);
            expect(ids).toEqual(['a']);
            expect(riot.getMatchHistory).not.toHaveBeenCalled();
        });

        it('treats a transition to a null uuid (logout) as a change and resets state', async () => {
            pushUuid('user-1');

            riot.getMatchHistory.mockResolvedValueOnce([makeMatch('a', 100)]);
            await manager.getMatchIdsAfter(null, 10);

            pushUuid(null);

            riot.getMatchHistory.mockResolvedValueOnce([makeMatch('b', 50)]);
            const ids = await manager.getMatchIdsAfter(null, 10);
            expect(ids).toEqual(['b']);
        });
    });

    // ---------------------------------------------------------------------
    // loadMore / doLoadMore (exercised through getMatchIdsAfter(null, ...))
    // ---------------------------------------------------------------------
    describe('loading match history from Riot', () => {
        it('requests the correct offset range and sorts results by GameStartTime desc', async () => {
            riot.getMatchHistory.mockResolvedValue([
                makeMatch('a', 100),
                makeMatch('b', 300),
                makeMatch('c', 200),
            ]);

            const ids = await manager.getMatchIdsAfter(null, 10);

            expect(riot.getMatchHistory).toHaveBeenCalledWith(0, 20);
            expect(ids).toEqual(['b', 'c', 'a']);
            expect(stats.requestMatchFetch).toHaveBeenCalledTimes(3);
        });

        it('skips entries that are already known', async () => {
            // Seed a full page (== default count of 20) so `exhausted` stays false;
            // a short first page would otherwise mark us exhausted and mask the
            // very shortfall-triggered load this test is meant to exercise.
            const seedPage = Array.from({ length: 20 }, (_, i) => makeMatch(`seed${i}`, 1000 - i));
            riot.getMatchHistory.mockResolvedValueOnce(seedPage);
            await manager.getMatchIdsAfter(null, 20); // seeds seed0..seed19 (in that order)

            // Asking after the *last* seeded match creates a genuine shortfall,
            // which triggers a second loadMore() call.
            riot.getMatchHistory.mockResolvedValueOnce([
                makeMatch('seed19', 1000 - 19), // duplicate, must be skipped
                makeMatch('new-1', 5),
            ]);

            stats.requestMatchFetch.mockClear();
            const ids = await manager.getMatchIdsAfter('seed19', 5);
            expect(ids).toEqual(['new-1']);
            expect(stats.requestMatchFetch).toHaveBeenCalledTimes(1);
            expect(stats.requestMatchFetch).toHaveBeenCalledWith('new-1');
        });

        it('marks history as exhausted once a short page is returned, and stops calling Riot', async () => {
            riot.getMatchHistory.mockResolvedValueOnce(
                Array.from({ length: 5 }, (_, i) => makeMatch(`m${i}`, i)),
            ); // shorter than default count of 20 -> exhausted

            await manager.getMatchIdsAfter(null, 10);
            expect(riot.getMatchHistory).toHaveBeenCalledTimes(1);

            // Ask for more than we have; since exhausted, Riot must not be called again.
            const ids = await manager.getMatchIdsAfter(null, 100);
            expect(riot.getMatchHistory).toHaveBeenCalledTimes(1);
            expect(ids).toHaveLength(5);
        });

        it('de-duplicates concurrent loadMore calls into a single Riot request', async () => {
            let resolvePage: (v: any) => void;
            riot.getMatchHistory.mockReturnValue(
                new Promise((resolve) => {
                    resolvePage = resolve;
                }),
            );

            const p1 = manager.getMatchIdsAfter(null, 10);
            const p2 = manager.getMatchIdsAfter(null, 10);

            resolvePage!([makeMatch('a', 1)]);
            await Promise.all([p1, p2]);

            expect(riot.getMatchHistory).toHaveBeenCalledTimes(1);
        });
    });

    // ---------------------------------------------------------------------
    // getMatchIdsAfter
    // ---------------------------------------------------------------------
    describe('getMatchIdsAfter', () => {
        it('returns [] when afterMatchId is unknown', async () => {
            const ids = await manager.getMatchIdsAfter('unknown-id', 10);
            expect(ids).toEqual([]);
            expect(riot.getMatchHistory).not.toHaveBeenCalled();
        });

        it('does not call loadMore when enough matches already follow afterMatchId', async () => {
            riot.getMatchHistory.mockResolvedValue([
                makeMatch('a', 300),
                makeMatch('b', 200),
                makeMatch('c', 100),
            ]);
            await manager.getMatchIdsAfter(null, 10); // seeds a,b,c
            riot.getMatchHistory.mockClear();

            const ids = await manager.getMatchIdsAfter('a', 2);
            expect(ids).toEqual(['b', 'c']);
            expect(riot.getMatchHistory).not.toHaveBeenCalled();
        });

        it('caps the loadMore request size at 20 when the shortfall is larger', async () => {
            // Seed a full page (== default count) so `exhausted` stays false.
            riot.getMatchHistory.mockResolvedValueOnce(
                Array.from({ length: 20 }, (_, i) => makeMatch(`seed${i}`, i)),
            );
            await manager.getMatchIdsAfter(null, 20); // fills 20, not exhausted (page.length === count)

            riot.getMatchHistory.mockResolvedValueOnce(
                Array.from({ length: 20 }, (_, i) => makeMatch(`more${i}`, 100 + i)),
            );
            await manager.getMatchIdsAfter('seed0', 50); // large shortfall

            expect(riot.getMatchHistory).toHaveBeenLastCalledWith(20, 40); // count capped to 20
        });

        it('does not call loadMore when history is already exhausted, even with a shortfall', async () => {
            riot.getMatchHistory.mockResolvedValueOnce([makeMatch('a', 100)]); // short page -> exhausted
            await manager.getMatchIdsAfter(null, 10);
            riot.getMatchHistory.mockClear();

            const ids = await manager.getMatchIdsAfter('a', 10);
            expect(ids).toEqual([]);
            expect(riot.getMatchHistory).not.toHaveBeenCalled();
        });
    });

    // ---------------------------------------------------------------------
    // getMatchDataAfter
    // ---------------------------------------------------------------------
    describe('getMatchDataAfter', () => {
        it('resolves ids then delegates to stats.getBestEffortBatchedResult with a 5s timeout', async () => {
            riot.getMatchHistory.mockResolvedValue([makeMatch('a', 100)]);
            await manager.getMatchDataAfter(null, 10);

            expect(stats.getBestEffortBatchedResult).toHaveBeenCalledWith(['a'], 5_000);
        });
    });

    // ---------------------------------------------------------------------
    // getMatchIdsBefore / getMatchDataBefore
    // ---------------------------------------------------------------------
    describe('getMatchIdsBefore', () => {
        beforeEach(async () => {
            riot.getMatchHistory.mockResolvedValue([
                makeMatch('a', 400),
                makeMatch('b', 300),
                makeMatch('c', 200),
                makeMatch('d', 100),
            ]);
            await manager.getMatchIdsAfter(null, 10); // seeds a,b,c,d in that order
        });

        it('returns [] when beforeMatchId is unknown', async () => {
            const ids = await manager.getMatchIdsBefore('unknown', 10);
            expect(ids).toEqual([]);
        });

        it('returns the slice preceding the given match id', async () => {
            const ids = await manager.getMatchIdsBefore('c', 10);
            expect(ids).toEqual(['a', 'b']);
        });

        it('clamps the start index to 0 when limit exceeds available preceding items', async () => {
            const ids = await manager.getMatchIdsBefore('b', 10);
            expect(ids).toEqual(['a']);
        });
    });

    describe('getMatchDataBefore', () => {
        it('resolves ids then delegates to stats.getBestEffortBatchedResult with a 5s timeout', async () => {
            riot.getMatchHistory.mockResolvedValue([makeMatch('a', 200), makeMatch('b', 100)]);
            await manager.getMatchIdsAfter(null, 10);

            await manager.getMatchDataBefore('b', 10);
            expect(stats.getBestEffortBatchedResult).toHaveBeenCalledWith(['a'], 5_000);
        });
    });
});