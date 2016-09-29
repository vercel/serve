# list

[![Build Status](https://travis-ci.org/zeit/list.svg?branch=master)](https://travis-ci.org/zeit/list)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Slack Channel](https://zeit-slackin.now.sh/badge.svg)](https://zeit.chat/)

Ever wanted to share a certain directory on your network by running just a command? Then this module is exactly what you're looking for: It provides a neat interface for listing the directory's contents and switching into sub folders.

In addition, it's also awesome when it comes to serving static sites. If a directory contains an `index.html`, list will automatically render it instead of serving the file's content as plaintext.

Powers [now-serve](https://github.com/zeit/now-serve).

<img src="http://i.imgur.com/Fru8ufo.png">

## Usage

Install it (needs at least node v6)

```bash
$ npm install -g list
```

Run it

```bash
$ list [options] <path>
```

You can find a list of all options [below](#options).

### Options

| Usage                  | Description | Default value |
| ---------------------- | ----------- | ------------------ |
| -h, --help             | Output all available options | - |
| -v, --version          | The version tag of the list instance on your device | - |
| -p, --port [port]      | A custom port on which the app will be running | 3000 |
| -c, --cache [seconds]  | How long static files should be cached in the browser | 3600 |
| -s, --single           | Serve single page apps with only one `index.html` in the root directory | - |
| -u, --unzipped         | Disable gzip compression | false |

## Contribute

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Uninstall list if it's already installed: `npm uninstall -g list`
3. Link it to the global module directory: `npm link`
4. Transpile the source code and watch for changes: `npm start`

Yey! Now can use the `list` command everywhere.
