const semver = require('semver')
const Influx = require('influx')
const prettyBytes = require('pretty-bytes')
const humanizeTime = require('tiny-human-time').short
const getDebugger = require('./utils/getDebugger')
const getJsonSize = require('./utils/getJsonSize')

function register (remit, options = {}) {
  if (!remit) {
    throw new Error('Invalid remit version; must be ^2.0.0')
  }

  // influx setup
  const influx = new Influx.InfluxDB({
    username: options.username || process.env.INFLUX_USERNAME || 'root',
    password: options.password || process.env.INFLUX_PASSWORD || 'root',
    database: options.database || process.env.INFLUX_DATABASE || 'endpoints',
    host: options.host || process.env.INFLUX_HOST || 'localhost',
    port: options.port || process.env.INFLUX_PORT || 8086,
    protocol: options.protocol || process.env.INFLUX_PROTOCOL || 'http',
    options: options.options || {},
    pool: options.pool,
    schema: [{
      measurement: 'messages',
      fields: {
        elapsed: Influx.FieldType.INTEGER,
        incoming: Influx.FieldType.INTEGER,
        outgoing: Influx.FieldType.INTEGER
      },
      tags: [
        'service',
        'requester',
        'code'
      ]
    }]
  })

  // endpoint.ready
  remit
    .endpoint
    .ready((options) => {
      getDebugger(options.event)('✓')
    })

  // endpoint.data
  remit
    .endpoint
    .data((event) => {
      getDebugger(event.eventType)(`[${event.eventId}] <-- ${event.resource} (${prettyBytes(getJsonSize(event.data))})`)
    })

  // endpoint.done
  remit
    .endpoint
    .done((event, response) => {
      getDebugger(event.eventType)(`[${event.eventId}] --> (${prettyBytes(getJsonSize(response))}, ${humanizeTime(event.started, event.finished)})`)

      // push
      influx.writePoints([{
        measurement: 'messages',
        fields: {
          elapsed: event.finished.getTime() - event.started.getTime(),
          incoming: getJsonSize(event.data),
          outgoing: getJsonSize(response)
        },
        tags: {
          service: remit._options.name || 'none',
          requester: event.resource || 'none',
          code: event.eventType
        }
      }])
    })

  // listen.ready
  remit
    .listen
    .ready((options) => {
      getDebugger(options.event)('✓')
    })

  // listen.data
  remit
    .listen
    .data((event) => {
      getDebugger(event.eventType)(`[${event.eventId}] <-- ${event.resource} (${prettyBytes(getJsonSize(event.data))})`)
    })

  // listen.done
  remit
    .listen
    .done((event, response) => {
      getDebugger(event.eventType)(`[${event.eventId}] --> (${prettyBytes(getJsonSize(response))}, ${humanizeTime(event.started, event.finished)})`)

      // push
      influx.writePoints([{
        measurement: 'messages',
        fields: {
          elapsed: event.finished.getTime() - event.started.getTime(),
          incoming: getJsonSize(event.data),
          outgoing: getJsonSize(response)
        },
        tags: {
          service: remit._options.name || 'none',
          requester: event.resource || 'none',
          code: event.eventType
        }
      }])
    })
}

module.exports = register
