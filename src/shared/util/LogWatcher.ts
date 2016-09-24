

import * as fs from 'fs'
import {EnumEventEmitter} from "shared/util/EnumEventEmitter"

const log = getLogger(__filename)

export enum LogWatcherEvent {
	Start = 1,
	Opened,
	Line,
	JsonObject,
	JsonObjectError,
	End,
	Stop,
	Error
}

export class LogWatcher extends EnumEventEmitter<LogWatcherEvent> {
	
	private static watchers:{[filename:string]:LogWatcher} = {}
	
	
	static getInstance(filename:string,isJson:boolean = false) {
		let watcher = LogWatcher.watchers[filename]
		if (!watcher)
			watcher = LogWatcher.watchers[filename] = new LogWatcher(filename,isJson)
		
		return watcher
	}
	
	/**
	 * Watching file
	 *
	 * @type {boolean}
	 */
	private _watching:boolean = false
	
	get watching() {
		return this._watching
	}
	
	
	/**
	 * All string lines
	 *
	 * @type {string[]}
	 */
	allLines:string[] = []
	
	/**
	 * All Json Objects
	 * @type {aby[]}
	 */
	allJsons:any[] = []
	
	private failed = false
	
	private position = 0
	
	private stream:fs.ReadStream = null
	
	private watcher:fs.FSWatcher = null
	
	private buf = []
	
	private fileExistTimer
	
	get lineCount() {
		return this.allLines.length
	}
	
	get fileExists() {
		return this.stream || fs.existsSync(this.filename)
	}
	
	/**
	 * Create log watcher for a file
	 *
	 * @param filename
	 * @param isJson
	 */
	private constructor(
		public readonly filename:string,
		public readonly isJson:boolean = true
	) {
		super(LogWatcherEvent)
	}
	
	
	private clearTimer() {
		if (this.fileExistTimer) {
			clearTimeout(this.fileExistTimer)
			this.fileExistTimer = null
		}
	}
	
	/**
	 * This is pretty simple on a change if the stream isnt open then open it
	 *
	 * @param eventType
	 * @param filename
	 */
	private onWatchEvent = (eventType,filename) => {
		if (!this.stream)
			this.openStream()
	}
	
	/**
	 * On stream data
	 *
	 * @param data
	 */
	private onData = (data:Array<any>) => {
		this.buf.push(...data)
		this.position += data.length
		
		// Find a line return
		const
			bufSize = this.buf.length
			
		
		
		while(true) {
			let
				index = this.buf.indexOf('\n')
			
			if (index === -1) {
				index = this.buf.indexOf(10)
				if (index === -1) {
					log.info(`Line return not detected yet`)
					break
				}
			}
			
			if (index === 0) {
				this.buf.splice(0,1)
				continue
			}
			
			// Get the line return data and reset the buffer
			
			log.info(`Return found at index ${index}`)
			const
				lineBuf = this.buf.slice(0, index),
				lineStr = String.fromCharCode(...lineBuf)
			
			
			this.buf.splice(0, index)
			log.info(`Buf size went from ${bufSize} to ${this.buf.length} - JSON size is ${lineBuf.length}`, lineStr)
			
			if (lineStr.length === 0) {
				log.warn(`Line str length is 0`, lineStr, this.buf)
				continue
			}
			
			
			// Trigger events
			this.emit(LogWatcherEvent.Line, lineStr)
			if (this.isJson) {
				try {
					const json = JSON.parse(lineStr)
					this.allJsons.push(json)
					log.info(`Parsed json from ${this.filename}`,json)
					this.emit(LogWatcherEvent.JsonObject, this, json, lineStr)
				} catch (err) {
					log.error(`Failed to parse json from ${lineStr}`, lineStr, err)
					this.emit(LogWatcherEvent.JsonObjectError, this, lineStr)
				}
			}
		}
		
		
	}
	
	
	private openStream() {
		try {
			if (this.stream || !this.fileExists) {
				return this.stream
			}
			
			fs
				.createReadStream(this.filename, {
					start: this.position
				})
				.on('open', () => {
					log.info(`File opened log read stream ${this.filename}`)
					this.emit(LogWatcherEvent.Opened, this, this.filename)
				})
				.on('data', this.onData)
				.on('end', () => {
					log.info(`File end log read stream ${this.filename}`)
					this.emit(LogWatcherEvent.End, this, this.filename)
					if (this.stream) {
						try {
							this.stream.close()
						} catch (err) {
							log.error(`Unable to close stream on end`,err)
						}
						this.stream = null
					}
				})
				.on('error', (err) => {
					log.error(`File error log read stream ${this.filename}`, err)
					this.emit(LogWatcherEvent.Error, this, this.filename, err)
				})
		} catch (err) {
			log.error(`Failed to start / open file stream error for ${this.filename}`,err)
			this.emit(LogWatcherEvent.Error, this, this.filename, err)
			this.stop()
			
		}
			
	}
	
	/**
	 * Stop the watcher
	 */
	stop() {
		log.info(`Stopping ${this.filename}`)
		if (!this.watching) {
			log.info(`Not currently watching ${this.filename} - can not stop`)
			return
		}
		
		this._watching = false
		this.clearTimer()
		
		if (this.watcher) {
			try{
				this.watcher.close()
			} catch (err) {
				log.error(`Failed to stop watcher`,err)
			}
			this.watcher = null
		}
		
		if (this.stream) {
			try {
				this.stream.close()
			} catch (err) {
				log.error(`Failed to close read stream for ${this.filename}`, err)
			} finally {
				this.stream = null
			}
		}
		
		this.emit(LogWatcherEvent.Stop,this)
		
		
		
	}
	
	
	/**
	 * Start the watcher
	 */
	start() {
		if (this.watching) {
			log.warn(`already started for ${this.filename}`)
			return
		}
		
		this._watching = true
		this.emit(LogWatcherEvent.Start,this)
		
		// Retry-able
		const tryToOpen = () => {
			this.clearTimer()
			
			// Check to make sure everything is ready
			if (!this.watching) {
				log.info(`Watching has stopped before file was opened`)
				return
			} else if (!this.fileExists) {
				this.fileExistTimer = setTimeout(tryToOpen,100)
				return
			}
			
			
			
			log.info(`File is ready to open stream ${this.filename}`)
			this.openStream()
			
			this.watcher = fs.watch(this.filename,{
				persistent: false
			}, this.onWatchEvent)
		}
		
		
		
		log.info(`Trying to open log ${this.filename}`)
		tryToOpen()
		
	}
	
}
