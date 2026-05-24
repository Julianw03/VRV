## Changelog Version 0.6.0
### Overview
- There are now simple labels that indicate whether a version is either:
    - *Outdated*: Older than your current game version but probably still replayable (this is not a guarantee, but rather a rough estimate)
    - *Incompatible*: Significantly older than your current game version by a major or minor version difference, and thus most likely not replayable

- You can now trigger a shutdown from within the application via the shutdown button.


### Bug Fixes
- A stale version may initially be read, but it should update itself after a few seconds. This should only happen when the last
  match you played was on a different version than the current game version. Should you still see stale lockfile information,
  change your config to use a longer version read timeout.

### Known Issues
- Replay injection will fail if, within your last 10 matches, you have not played any game that has a replay available.

  This can be fixed by:
    - Starting Valorant and loading into the main menu
    - Playing a game that has a replay available (e.g. Competitive, Unrated, Swiftplay)
    - Reloading your recent matches