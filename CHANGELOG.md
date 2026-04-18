> ## Persistent Storage Change
> The persistent storage location of this app has changed.
> From ```%LOCALAPPDATA%/VViewer``` to ```%LOCALAPPDATA%/ValorantReplayViewer```
> Should you notice any files missing copy all files from the old location to the new one.


## Changelog Version 0.3.0
- For faster feedback and the ability to react to external changes, the app now can modify parts of its behavior via
a configuration file. A simple editor has been added for that in the frontend.
If you really know what you are doing you can also change it at ```%LOCALAPPDATA%/ValorantReplayViewer/config-overrides.yml```

### Bug Fixes
- Fixed a bug where the current valorant version could not be loaded when the logs were cleared.

### Known Issues
- I have no way of verifying the SGP hosts for regions other than ``EU``. Should something NOT work for you and you are from outside the `EU` Region please do the following:
    - Start Valorant
    - Go to your match history and (re-) download a replay
    - Exit Valorant
    - ``%LOCALAPPDATA%/VALORANT/Saved/Logs`` should now contain a file called ``ShooterGame.log``. Please send me this file and the region you are playing in so I can add support for your region as well.
    **DO NOT UPLOAD THIS FILE TO GITHUB ISSUES. IT MAY CONTAIN SENSITIVE INFORMATION**. Instead, send it to me via discord: ``iambadatplaying``.
