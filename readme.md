# serve

[![Build Status](https://travis-ci.org/zeit/serve.svg?branch=master)](https://travis-ci.org/zeit/serve)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Slack Channel](http://zeit-slackin.now.sh/badge.svg)](https://zeit.chat/)

Ever wanted to share a project on your network by running just a command? Then this module is exactly what you're looking for: It provides a neat interface for listing the directory's contents and switching into sub folders.

In addition, it's also awesome when it comes to serving static sites!

![screenshot](https://raw.githubusercontent.com/zeit/art/4bafffc43b38f3b796eb2f9071292d13d129a7d8/serve/example.png)

## Usage

Install it (needs at least Node LTS):

```bash
npm install -g serve
```

And run this command in your terminal:

```bash
serve [options] <path>
```

### Options

Run this command to see a list of all available options:

```bash
serve help
```

### Authentication

If you set the `--auth` flag, the package will look for a username and password in the `SERVE_USER` and `SERVE_PASSWORD` environment variables.

As an example, this is how such a command could look like:

```bash
SERVE_USER=leo SERVE_PASSWORD=1234 serve --auth
```

## API

You can also use the package inside your application. Just load it:

```js
const serve = require('serve')
```

And call it with flags (run [this command](#options) for the full list):

```js
const server = serve(__dirname, {
  port: 1337,
  ignore: ['node_modules']
})
```

Later in the code, you can stop the server using this method:

```js
server.stop()
```

## Contributing

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Uninstall `serve` if it's already installed: `npm uninstall -g serve`
3. Link it to the global module directory: `npm link`

After that, you can use the `serve` command everywhere. [Here](https://github.com/zeit/serve/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+for+beginners%22)'s a list of issues that are great for beginners.

## Credits

This project used to be called "list" and "micro-list". But thanks to [TJ Holowaychuk](https://github.com/tj) handing us the new name, it's now called "serve" (which is much more definite).

## Author

Leo Lamprecht ([@notquiteleo](https://twitter.com/notquiteleo)) - [ZEIT](https://zeit.co)
