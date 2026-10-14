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
