## Changelog Version 0.7.0
### Overview
- You can now view advanced round details for replays that you download with this new version.
- Changes to the match history handling (mostly in the backend to avoid rate limiting / general requests to Riot's API)

### Advanced Round Details
Compatible Replays will show a new symbol next to the inject button where you will be able to view advanced round details
for that match. Currently implemented is:
- Round results
- Round-by-round timeline
- Round-by-round economy

You can get access to this information for older replays if you simply delete and re-download the specified replay.

This feature is still in development, and you can expect more features in the future. If you have any suggestions for what you would like to see in this feature,
feel free to open an issue on GitHub.

### Bug Fixes
- Fixed an issue where the replay injection would fail if it was NOT Competitive, Unrated, Swiftplay or Spikerush. Instead,
the replay injector will now choose a placeholder for injection that has its replay recorded. (Within the last 20 matches)

### Known Issues
- Replay injection will fail if, within your last 20 matches, you have not played any game that has a replay available.

  This can be fixed by:
    - Starting Valorant and loading into the main menu
    - Playing a game that has a replay available (e.g. Competitive, Unrated, Swiftplay)
    - Reloading your recent matches