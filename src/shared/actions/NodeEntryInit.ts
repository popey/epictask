//region PROCESS_SETUP
require('source-map-support').install()
require('babel-polyfill')
process.env.BLUEBIRD_W_FORGOTTEN_RETURN = '0'

import 'reflect-metadata'
import 'shared/PromiseConfig'
import 'shared/ErrorHandling'
import 'shared/Globals'
//endregion

export {}