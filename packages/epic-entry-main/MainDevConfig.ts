// import Reactotron from 'reactotron-react-js'
//
// Reactotron
// 	.configure() // we can use plugins here -- more on this later
// 	.connect()

import { acceptHot } from  "epic-global"
import { RemoteDebuggingPort } from "epic-global/Constants"
import {app} from 'electron'

/**
 * In debug mode enable remote debugging
 */
if (Env.isMain && Env.isDev) {
	app.commandLine.appendSwitch('remote-debugging-port', RemoteDebuggingPort)
}

const
	log = getLogger(__filename),
	{
		"default": installExtension,
		REACT_DEVELOPER_TOOLS,
		JQUERY_DEBUGGER,
		REDUX_DEVTOOLS,
		REACT_PERF
	} = require('electron-devtools-installer')

const
	ScratchDevToolId = "alploljligeomonipppgaahpkenfnfkn",
	ExtendedJsConsoleId = "ieoofkiofkkmikbdnmaoaemncamdnhnd",
	BigConsoleId = 'klommbdmeefgobphaflhmnieheipjajm',
	ImmutableObjectFormat = "hgldghadipiblonfkkicmgcbbijnpeog",
	JetBrainsId = "hmhgeddbohgjknpmjagkdomcpobmllji"

installExtension(REACT_DEVELOPER_TOOLS)
installExtension(REACT_PERF)
installExtension(JQUERY_DEBUGGER)
installExtension(REDUX_DEVTOOLS)
//installExtension(JetBrainsId)
installExtension(BigConsoleId)
installExtension(ScratchDevToolId)
//installExtension(ExtendedJsConsoleId)
installExtension(ImmutableObjectFormat)


acceptHot(module,log)
