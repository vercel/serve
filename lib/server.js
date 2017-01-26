// Native
const path = require('path')
const {parse} = require('url')

// Packages
const {StringDecoder} = require('string_decoder')
const micro = require('micro')
const auth = require('basic-auth')
const {red} = require('chalk')
const fs = require('fs-promise')
const pathType = require('path-type')
const mime = require('mime-types')
const stream = require('send')
const {isBinarySync} = require('istextorbinary')

// Ours
const renderDirectory = require('./render')

module.exports = async (req, res, flags, current, ignoredFiles) => {
  if (flags.auth) {
    const credentials = auth(req)

    if (!process.env.SERVE_USER || !process.env.SERVE_PASSWORD) {
      console.error(red('You are running serve with basic auth but did not set the SERVE_USER and SERVE_PASSWORD environment variables.'))
      process.exit(1)
    }

    if (!credentials || credentials.name !== process.env.SERVE_USER || credentials.pass !== process.env.SERVE_PASSWORD) {
      res.statusCode = 401
      res.setHeader('WWW-Authenticate', 'Basic realm="User Visible Realm"')
      return micro.send(res, 401, 'Access Denied')
    }
  }

  const {pathname} = parse(req.url)
  const assetDir = path.normalize(process.env.ASSET_DIR)
  let related = path.parse(path.join(current, pathname))

  if (related.dir.indexOf(assetDir) > -1) {
    const relative = path.relative(assetDir, pathname)
    related = path.parse(path.join(__dirname, '/../assets', relative))
  }

  related = decodeURIComponent(path.format(related))

  const relatedExists = fs.existsSync(related)

  let notFoundResponse = 'Not Found'

  try {
    const custom404Path = path.join(current, '/404.html')
    notFoundResponse = await fs.readFile(custom404Path, 'utf-8')
  } catch (err) {}

  if (!relatedExists && flags.single === undefined) {
    return micro.send(res, 404, notFoundResponse)
  }

  // Check if file or directory path
  if (relatedExists && await pathType.dir(related)) {
    let indexPath = path.join(related, '/index.html')

    res.setHeader('Content-Type', mime.contentType(path.extname(indexPath)))

    if (!fs.existsSync(indexPath)) {
      // Try to render the current directory's content
      const port = flags.port || req.socket.localPort
      const renderedDir = await renderDirectory(port, current, related, ignoredFiles)

      // If it works, send the directory listing to the user
      if (renderedDir) {
        return micro.send(res, 200, renderedDir)
      }

      // And if it doesn't, see if it's a single page application
      // If that's not true either, send an error
      if (!flags.single) {
        return micro.send(res, 404, notFoundResponse)
      }

      // But IF IT IS true, load the SPA's root index file
      indexPath = path.join(current, '/index.html')
    }

    let indexContent

    try {
      indexContent = await fs.readFile(indexPath, 'utf8')
    } catch (err) {
      throw err
    }

    return micro.send(res, 200, indexContent)
  }

  if (!fs.existsSync(related) && flags.single) {
    const indexPath = path.join(current, '/index.html')
    let indexContent

    try {
      indexContent = await fs.readFile(indexPath, 'utf8')
    } catch (err) {
      return micro.send(res, 404, notFoundResponse)
    }

    return micro.send(res, 200, indexContent)
  }

  let body = 'Not able to load file!'
  let stats

  try {
    body = await fs.readFile(related)
    stats = await fs.stat(related)
  } catch (err) {
    if (err instanceof RangeError) {
      return stream(req, related).pipe(res)
    }

    throw err
  }

  const binaryStat = isBinarySync(path.parse(related).base, body)
  const getETag = s => '"' + s.dev + '-' + s.ino + '-' + s.mtime.getTime() + '"'

  let requestDate = req.headers['if-modified-since']
  let statusCode = 200

  if (requestDate) {
    requestDate = new Date(requestDate)

    if (requestDate.getTime() === stats.mtime.getTime()) {
      statusCode = 304
    }
  }

  const defaultHeaders = {
    'Cache-Control': 'public, max-age=' + flags.cache,
    Pragma: 'public',
    ETag: getETag(stats)
  }

  // Using same --cors behavior as in http-server:
  // https://github.com/indexzero/http-server/blob/fed98f2dbb87f1ea7a793e48a1975c20c9e970fa/lib/http-server.js#L68
  if (flags.cors) {
    defaultHeaders['Access-Control-Allow-Origin'] = '*'
    defaultHeaders['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Range'
  }

  for (const header in defaultHeaders) {
    if (!{}.hasOwnProperty.call(defaultHeaders, header)) {
      continue
    }

    res.setHeader(header, defaultHeaders[header])
  }

  const contentType = mime.contentType(path.extname(related)) || mime.contentType('text')
  res.setHeader('Content-Type', contentType)

  if (binaryStat) {
    res.statusCode = statusCode
    res.end(body, 'binary')
  } else {
    const decoder = new StringDecoder('utf8')

    micro.send(res, statusCode, decoder.write(body))
  }
}
