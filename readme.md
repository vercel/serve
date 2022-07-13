![Serve Logo](https://raw.githubusercontent.com/vercel/serve/main/media/banner.png)

<div align="center">
  <a aria-label="Vercel logo" href="https://vercel.com">
    <img src="https://img.shields.io/badge/made%20by-vercel-%23000000">
  </a>
  <br>
  <a aria-label="Install Size" href="https://packagephobia.com/result?p=serve">
    <img src="https://packagephobia.com/badge?p=serve">
  </a>
  <a aria-label="Stars" href="https://github.com/vercel/serve/stargazers">
    <img src="https://img.shields.io/github/stars/vercel/serve">
  </a>
  <a aria-label="Build Status" href="https://github.com/vercel/serve/actions/workflows/ci.yaml">
    <img src="https://github.com/vercel/serve/actions/workflows/ci.yaml/badge.svg">
  </a>
</div>

---

`serve` helps you serve a static site, single page application or just a static file (no matter if on your device or on the local network). It also provides a neat interface for listing the directory's contents:

![Listing UI](https://raw.githubusercontent.com/vercel/serve/main/media/listing-ui.png)

> Once it's time to push your site to production, we recommend using [Vercel](https://vercel.com).

## Usage

> `serve` v14 onwards requires Node v14 to run. Please use `serve` v13 if you cannot upgrade to Node v14.

The quickest way to get started is to just run `npx serve` in your project's directory.

If you prefer, you can also install the package globally (you'll need at least [Node LTS](https://github.com/nodejs/Release#release-schedule)):

```bash
> npm install --global serve
```

Once that's done, you can run this command inside your project's directory...

```bash
> serve
```

...or specify which folder you want to serve:

```bash
> serve folder-name/
```

Finally, run this command to see a list of all available options:

```bash
> serve --help
```

Now you understand how the package works! :tada:

## Configuration

To customize `serve`'s behavior, create a `serve.json` file in the public folder and insert any of [these properties](https://github.com/vercel/serve-handler#options).

## API

The core of `serve` is [`serve-handler`](https://github.com/vercel/serve-handler), which can be used as middleware in existing HTTP servers:

```js
const handler = require('serve-handler');
const http = require('http');

const server = http.createServer((request, response) => {
  // You pass two more arguments for config and middleware
  // More details here: https://github.com/vercel/serve-handler#options
  return handler(request, response);
});

server.listen(3000, () => {
  console.log('Running at http://localhost:3000');
});
```

> You can also replace `http.createServer` with [`micro`](https://github.com/vercel/micro).

## Issues and Contributing

If you want a feature to be added, or wish to report a bug, please open an issue [here](https://github.com/vercel/serve/issues/new).

If you wish to contribute to the project, please read the [contributing guide](contributing.md) first.

## Credits

This project used to be called `list` and `micro-list`. But thanks to [TJ Holowaychuk](https://github.com/tj) handing us the new name, it's now called `serve` (which is much more definite).

## Author

Leo Lamprecht ([@notquiteleo](https://twitter.com/notquiteleo))
