# serve

[![Build Status](https://travis-ci.org/zeit/serve.svg?branch=master)](https://travis-ci.org/zeit/serve)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Slack Channel](https://zeit-slackin.now.sh/badge.svg)](https://zeit.chat/)

Ever wanted to share a certain directory on your network by running just a command? Then this module is exactly what you're looking for: It provides a neat interface for listing the directory's contents and switching into sub folders.

In addition, it's also awesome when it comes to serving static sites. If a directory contains an `index.html`, `serve` will automatically render it instead of serving the file's content as plaintext.

![screenshot](https://raw.githubusercontent.com/zeit/art/6f354dcc744ed03b022ea699c3ffa64d29714d78/serve/example.png)

## Usage

Install it (needs at least node v6)

```bash
$ npm install -g serve
```

Run it

```bash
$ serve <path> [options]
```

You can find a list of all options [below](#options).

### Options

| Usage                  | Description | Default value |
| ---------------------- | ----------- | ------------------ |
| -h, --help             | Output all available options | - |
| -v, --version          | The version tag of the `serve` instance on your device | - |
| -p, --port [port]      | A custom port on which the app will be running | 3000 |
| -c, --cache [seconds]  | How long static files should be cached in the browser | 3600 |
| -s, --single           | Serve single page apps with only one `index.html` in the root directory | - |
| -u, --unzipped         | Disable gzip compression | false |
| -i, --ignore           | Files and directories to hide from the directory listing | - |
| -a, --auth             | Enable HTTP authentication (read more [here](#authentication)) | false |

### Authentication

If you set the `--auth` flag, `serve` will look for a username and password in the `SERVE_USER` and `SERVE_PASSWORD` environment variables.

## Contribute

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Uninstall `serve` if it's already installed: `npm uninstall -g serve`
3. Link it to the global module directory: `npm link`
4. Transpile the source code and watch for changes: `npm run dev`

After that, you can use the `serve` command everywhere. [Here](https://github.com/zeit/serve/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+for+beginners%22)'s a list of issues that are great for beginners.

## Credits

This project used to be called "list". But thanks to [TJ Holowaychuk](https://github.com/tj) handing us the new name, it's now called "serve" (which is much more definite).
