![](https://assets.zeit.co/image/upload/v1527770721/repositories/serve/serve-repo-banner.png)

[![Build Status](https://circleci.com/gh/zeit/serve.svg?&style=shield)](https://circleci.com/gh/zeit/serve)
[![Install Size](https://packagephobia.now.sh/badge?p=serve)](https://packagephobia.now.sh/result?p=serve)
[![Join the community on Spectrum](https://withspectrum.github.io/badge/badge.svg)](https://spectrum.chat/zeit)

Assuming you would like to serve a static site, single page application or just a static file (no matter if on your device or on the local network), this package is just the right choice for you.

It behaves exactly like static deployments on [Now](https://zeit.co/now), so it's perfect for developing your static project. Then, when it's time to push it into production, you [deploy it](https://zeit.co/docs/examples/static).

Furthermore, it provides a neat interface for listing the directory's contents:

![screenshot](https://user-images.githubusercontent.com/6170607/40541195-167ff460-601b-11e8-8f66-3b0c7ff96cbb.png)

## Usage

The quickest way to get started is to just run `npx serve` in your project's directory.

If you prefer, you can also install the package globally using [Yarn](https://yarnpkg.com/en/) (you'll need at least [Node.js LTS](https://nodejs.org/en/)):

```bash
yarn global add serve
```

Once that's done, you can run this command inside your project's directory:

```bash
serve
```

Finally, run this command to see a list of all available options:

```bash
serve --help
```

Now you understand how the package works! :tada:

## Configuration

To customize `serve`'s behavior, create a `serve.json` file in the public folder and insert any of [these properties](https://github.com/zeit/serve-handler#options).

## API

The core of `serve` is [serve-handler](https://github.com/zeit/serve-handler), which can be used as middleware in existing HTTP servers:

```js
const handler = require('serve-handler');
const http = require('http');

const server = http.createServer((request, response) => {
  // You pass two more arguments for config and middleware
  // More details here: https://github.com/zeit/serve-handler#options
  return handler(request, response);
})

server.listen(3000, () => {
  console.log('Running at http://localhost:3000');
});
```

**NOTE:** You can also replace `http.createServer` with [micro](https://github.com/zeit/micro), if you want.

## Contributing

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Uninstall `serve` if it's already installed: `npm uninstall -g serve`
3. Link it to the global module directory: `npm link`

After that, you can use the `serve` command everywhere. [Here](https://github.com/zeit/serve/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+for+beginners%22)'s a list of issues that are great for beginners.

## Credits

This project used to be called "list" and "micro-list". But thanks to [TJ Holowaychuk](https://github.com/tj) handing us the new name, it's now called "serve" (which is much more definite).

## Author

Leo Lamprecht ([@notquiteleo](https://twitter.com/notquiteleo)) - [ZEIT](https://zeit.co)
