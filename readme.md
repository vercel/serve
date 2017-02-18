# serve

[![Build Status](https://travis-ci.org/zeit/serve.svg?branch=master)](https://travis-ci.org/zeit/serve)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Slack Channel](https://zeit-slackin.now.sh/badge.svg)](https://zeit.chat/)

Ever wanted to share a certain directory on your network by running just a command? Then this module is exactly what you're looking for: It provides a neat interface for listing the directory's contents and switching into sub folders.

In addition, it's also awesome when it comes to serving static sites. If a directory contains an `index.html`, `serve` will automatically render it instead of serving the file's content as plaintext.

![screenshot](https://raw.githubusercontent.com/zeit/art/6f354dcc744ed03b022ea699c3ffa64d29714d78/serve/example.png)

## Usage

Install it (needs at least Node LTS):

```bash
npm install -g serve
```

And run this command in your terminal:

```bash
serve <path> [options]
```

### Options

Run this command to see a list of all available options:

```bash
serve help
```

### Authentication

If you set the `--auth` flag, the package will look for a username and password in the `SERVE_USER` and `SERVE_PASSWORD` environment variables.

## API

Install it (needs at least Node LTS):

```bash
npm install serve
```

You can now use it in your code:

```js
const serve = require('serve')

const options = {
  port: 1337,
  cache: 0
}

const server = serve(options)

// ...

server.stop()

```

### Options

#### `port: number`

Port to listen on

#### `cache: number`

Time in milliseconds for caching files in the browser

#### `single: boolean`

Serve single page apps with only one `index.html`

#### `unzipped: boolean`

Disable GZIP compression

#### `ignore: string[]`

Files and directories to ignore

#### `auth: boolean`

Serve behind basic auth

#### `cors: boolean`

Setup * CORS headers to allow requests from any origin

## Contributing

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Uninstall `serve` if it's already installed: `npm uninstall -g serve`
3. Link it to the global module directory: `npm link`

After that, you can use the `serve` command everywhere. [Here](https://github.com/zeit/serve/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+for+beginners%22)'s a list of issues that are great for beginners.

## Credits

This project used to be called "list" and "micro-list". But thanks to [TJ Holowaychuk](https://github.com/tj) handing us the new name, it's now called "serve" (which is much more definite).

## Author

Leo Lamprecht ([@notquiteleo](https://twitter.com/notquiteleo)) - [▲ZEIT](https://zeit.co)
