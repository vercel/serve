// Native
const path = require('path')

// Packages
const fs = require('fs-extra')
const { compile } = require('handlebars')

function jsonRenderer(details) {
  const files = details.files.map(
    ({ base, ext, name, relative, size, title }) => {
      return { base, ext, name, relative, size, title }
    }
  )

  return { files }
}

module.exports = renderJson => {
  if (renderJson) {
    return jsonRenderer
  }

  let viewContent = false
  const viewPath = path.normalize(path.join(__dirname, '/../views/index.hbs'))

  try {
    viewContent = fs.readFileSync(viewPath, 'utf8')
  } catch (err) {
    throw err
  }

  return compile(viewContent)
}
