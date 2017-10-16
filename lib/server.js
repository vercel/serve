// Native
const path = require('path')
const { parse, format } = require('url')

// Packages
const micro = require('micro')
const auth = require('basic-auth')
const { red } = require('chalk')
const fs = require('fs-extra')
const pathType = require('path-type')
const mime = require('mime-types')
const stream = require('send')
const { coroutine } = require('bluebird')

// Utilities
const renderDirectory = require('./render')

module.exports = coroutine(function*(req, res, flags, current, ignoredFiles) {
  const headers = {}

  if (flags.cors) {
    headers['Access-Control-Allow-Origin'] = '*'
    headers['Access-Control-Allow-Headers'] =
      'Origin, X-Requested-With, Content-Type, Accept, Range'
  }

  for (const header in headers) {
    if (!{}.hasOwnProperty.call(headers, header)) {
      continue
    }

    res.setHeader(header, headers[header])
  }

  if (flags.auth) {
    const credentials = auth(req)

    if (!process.env.SERVE_USER || !process.env.SERVE_PASSWORD) {
      const error =
        'The environment variables "SERVE_USER" ' +
        'and/or "SERVE_PASSWORD" are missing!'
      console.error(red(error))

      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(1)
    }

    if (
      !credentials ||
      credentials.name !== process.env.SERVE_USER ||
      credentials.pass !== process.env.SERVE_PASSWORD
    ) {
      res.statusCode = 401
      res.setHeader('WWW-Authenticate', 'Basic realm="User Visible Realm"')
      return micro.send(res, 401, 'Access Denied')
    }
  }

  const { pathname } = parse(req.url)
  const assetDir = path.normalize(process.env.ASSET_DIR)

  let related = path.parse(path.join(current, pathname))
  let assetRequest = false

  if (related.dir.indexOf(assetDir) > -1) {
    assetRequest = true
    const relative = path.relative(assetDir, pathname)
    related = path.parse(path.join(__dirname, '/../assets', relative))
  }

  related = decodeURIComponent(path.format(related))
  let notFoundResponse = 'Not Found'

  try {
    const custom404Path = path.join(current, '/404.html')
    notFoundResponse = yield fs.readFile(custom404Path, 'utf-8')
  } catch (err) {}

  // Don't allow rendering ignored files
  const ignored = !ignoredFiles.every(item => {
    return !pathname.includes(item)
  })

  if (ignored || (!assetRequest && related.indexOf(current) !== 0)) {
    return micro.send(res, 404, notFoundResponse)
  }

  const relatedExists = yield fs.exists(related)

  if (!relatedExists && !flags.single) {
    return micro.send(res, 404, notFoundResponse)
  }

  const streamOptions = {}

  if (flags.cache) {
    streamOptions.maxAge = flags.cache
  } else if (flags.cache === 0) {
    // Disable the cache control by `send`, as there's no support for `no-cache`.
    // Set header manually.
    streamOptions.cacheControl = false
    res.setHeader('Cache-Control', 'no-cache')
  } else if (flags.single) {
    // Cache assets of single page applications for a day.
    // Later in the code, we'll define that `index.html` never
    // gets cached!
    streamOptions.maxAge = 86400000
  }

  // Check if directory
  if (relatedExists && (yield pathType.dir(related))) {
    // Normalize path to trailing slash
    // Otherwise problems like #70 will occur
    const url = parse(req.url)

    if (url.pathname.substr(-1) !== '/') {
      url.pathname += '/'
      const newPath = format(url)

      res.writeHead(302, {
        Location: newPath
      })

      res.end()
      return
    }

    let indexPath = path.join(related, '/index.html')
    res.setHeader('Content-Type', mime.contentType(path.extname(indexPath)))

    if (!(yield fs.exists(indexPath))) {
      // Try to render the current directory's content
      const port = flags.port || req.socket.localPort
      const renderedDir = yield renderDirectory(
        port,
        current,
        related,
        ignoredFiles
      )

      // If it works, send the directory listing to the user
      // If is treeless, stepover
      if (renderedDir && !flags.treeless) {
        return micro.send(res, 200, renderedDir)
      }

      // And if it doesn't, see if it's a single page application
      // If that's not true either, send an error
      if (!flags.single) {
        return micro.send(res, 404, notFoundResponse)
      }

      // But IF IT IS true, then this is a hit to a directory with no `index.html`
      // Load the SPA's root index file
      indexPath = path.join(current, '/index.html')
    }

    if (flags.single && indexPath === path.join(current, '/index.html')) {
      // Don't cache the `index.html` file for single page applications
      streamOptions.maxAge = 0
    }

    return stream(req, indexPath, streamOptions).pipe(res)
  }

  // Serve `index.html` for single page applications if:
  // - The path does not match any file or directory OR
  // - The path matches exactly `/index.html`
  if (
    flags.single &&
      (!(yield fs.exists(related)) ||
      related === path.join(current, '/index.html'))
  ) {
    // Don't cache the `index.html` file for single page applications
    streamOptions.maxAge = 0

    // Load `index.html` and send it to the client
    const indexPath = path.join(current, '/index.html')
    return stream(req, indexPath, streamOptions).pipe(res)
  }

  // Serve files without a mime type as html for SPA, and text for non SPA
  // eslint-disable-next-line camelcase
  stream.mime.default_type = flags.single ? 'text/html' : 'text/plain'

  return stream(
    req,
    related,
    Object.assign(
      {
        dotfiles: 'allow'
      },
      streamOptions
    )
  ).pipe(res)
})
