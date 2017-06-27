function getJsonSize (value) {
  if (!value) return 0

  return ~-encodeURI(JSON.stringify(value)).split(/%..|./).length
}

module.exports = getJsonSize
