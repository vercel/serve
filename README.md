# micro-list

Ever wanted to share a certain directory on your network by running just a command? Then micro-list is exactly what you're looking for: It provides a neat interface for listing the directory's contents and switching into sub folders.

Powers [now-serve](https://github.com/zeit/now-serve).

<img src="http://i.imgur.com/gYrAYyU.png">

## Usage

Install it

```bash
▲ npm install micro-list -g
```

Run it

```bash
▲ list [options] <path>
```

You can find a list of all options [below](#options).

### Options

| Usage                  | Description |
| ---------------------- | ----------- |
| -h, --help             | Output all available options |
| -V, --version          | The version tag of the micro-list instance on your device |
| -p, --port [port]      | A custom port on which the app will be running |

## Contribute

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Uninstall now-serve if it's already installed: `npm uninstall micro-list -g`
3. Link it to the global module directory: `npm link`
4. Transpile the source code and watch for changes: `gulp`

Yey! Now can use the `list` command everywhere.

## Credits

- Copyright © 2016 Zeit, Inc and project authors.
- Licensed under MIT.
- ▲
