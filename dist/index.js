
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./google-maps-draw-shape-lib.cjs.production.min.js')
} else {
  module.exports = require('./google-maps-draw-shape-lib.cjs.development.js')
}
