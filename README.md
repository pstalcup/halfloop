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
