# Halfloop

A full day script named half loop because I wrote it when I was only doing 1 run a day

## Installation

```
git checkout pstalcup/halfloop release
```

## Development

Build the script into `dist/scripts/halfloop/`:

```bash
yarn run build
```

Symlink the built files into your KoLmafia directory (pass the path if it isn't the default location):

```bash
yarn run install-mafia
```

Rebuild automatically while you work:

```bash
yarn run watch
```

Run `yarn run format` before committing.

## Notifications

Halfloop can send a push notification through [ntfy](https://ntfy.sh) when a run finishes or aborts. Subscribe to a topic in the ntfy app, then pass it as an arg:

```
halfloop ntfy=my-secret-topic
```

Use a hard-to-guess topic name, since anyone who knows it can read your notifications. For a self-hosted server, pass the full URL instead (`ntfy=https://ntfy.example.com/my-topic`). Without `ntfy`, no notifications are sent.

## Relay page

Halfloop installs a relay script. In the KoLmafia relay browser, pick `halfloop` from the relay script dropdown in the top menu. It shows:

- the status of today's run, with the final results once halfloop has finished (or the error if it aborted)
- current stats: path, turns, adventures, organs, fights, swagger, today's halfloop and garbo results so far, and a rollover forecast
- a settings form for every halfloop arg. Saved values become the new defaults, and anything passed on the command line still overrides them.

While a run is in progress, the page refreshes itself every minute and shows an **Interrupt halfloop** button. It works like garbo's: garbo stops at its next task, and halfloop stops before starting its next step. Other loop scripts (phccs, loopstar, sebastian, ...) aren't interrupted, so halfloop stops once the current one finishes.
