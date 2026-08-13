## Changelog Version 0.8.0
> ## Breaking Change
> The format of replay metadata has been changed and is no longer compatible.
> The old format was kinda hacked together and the current one should support extension / migration a lot easier.
> You can still find the old replays under ```%LOCALAPPDATA%\ValorantReplayViewer\old_replays```

### Overview
- You can now upload partial replay data.
- You can now also download the match data when the match does not have a replay. Only the match summary will be downloaded then.
- The UI now shows if a replay is available for a recent match.
- Unknown Version compatibility will now still allow you to inject the replay (as raw .vrf replay files do not store their version nicely)
- Backend now does stricter validation of DTOs / Schemas using zod.

### Advanced Round Details
Now has a Versus Tab where you can compare your performance over the game against an enemy.
Pretty number based for now. I still hope that this may offer some value and if not I would appreciate constructive feedback.

### Bug Fixes
- Fixed an issue where the match history would show a stale state when switching accounts.

### Known Issues
- Cancelling a Replay Injection will not restore the original match.
- Custom Games cannot be viewed in match details. Reason for this is that there is no "queue" in custom games. The program can not infer what mode is being
played and therefore won't display any stats. Might change this in the future to be customizable by the user in the UI.

- Replay injection will fail if, within your last 20 matches, you have not played any game that has a replay available.

  This can be fixed by:
    - Starting Valorant and loading into the main menu
    - Playing a game that has a replay available (e.g. Competitive, Unrated, Swiftplay)
    - Reloading your recent matches