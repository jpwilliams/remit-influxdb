const debug = require('debug')
const debuggers = {}

function getDebugger (code) {
  if (!debuggers[code]) debuggers[code] = debug(`remit:endpoint:${code}`)

  return debuggers[code]
}

module.exports = getDebugger
