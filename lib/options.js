exports.options = [
  {
    name: 'port',
    description: 'Port to listen on',
    defaultValue: process.env.PORT || 5000
  },
  {
    name: 'cache',
    description: 'Time in milliseconds for caching files in the browser',
    defaultValue: 3600
  },
  {
    name: 'single',
    description: 'Serve single page apps with only one index.html'
  },
  {
    name: 'unzipped',
    description: 'Disable GZIP compression'
  },
  {
    name: 'ignore',
    description: 'Files and directories to ignore'
  },
  {
    name: 'auth',
    description: 'Serve behind basic auth'
  },
  {
    name: 'cors',
    description: 'Setup * CORS headers to allow requests from any origin',
    defaultValue: false
  },
  {
    name: 'silent',
    description: `Don't log anything to the console`
  },
  {
    name: ['n', 'clipless'],
    description: `Don't copy address to clipboard`,
    defaultValue: false
  },
  {
    name: 'open',
    description: 'Open local address in browser',
    defaultValue: false
  }
]

exports.minimist = {
  alias: {
    a: 'auth',
    C: 'cors',
    S: 'silent',
    s: 'single',
    u: 'unzipped',
    n: 'clipless',
    o: 'open'
  },
  boolean: ['auth', 'cors', 'silent', 'single', 'unzipped', 'clipless', 'open']
}
