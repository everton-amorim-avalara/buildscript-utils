//const through = require('through2')
const sudo = require('sudo')
const cp = require('child_process')
const fs = require('fs')
const yargs = require('yargs')
const path = require('path')
const glob = require('glob')
const chokidar = require('chokidar')
const promisify = require('promisify')
require('colors')

/**
 * Promisify: converts node-style callback to a promise
 */
exports.promisify = promisify.promisify
exports._p = promisify.promisify


/*
function prepend(text) {
    return through(function(chunk, enc, cb){
        let str = chunk.toString()
        str = text + str
        this.push(new Buffer(str))
        cb()
    })
}
*/

/*
function tempDir() {
    try {
        fs.statSync('_temp')
    } catch (err) {
        fs.mkdirSync('_temp')
    }
}
*/

/*
function createSh(cmd) {
    tempDir()
    const number = Math.ceil(Math.random() * 1000)
    if (!String(cmd).endsWith(';')) cmd += ';'
    let path = './_temp/' + number + '.sh'
    fs.writeFileSync(path, cmd)
    return path
}

exports.spawnBash = function (cmd, ...args) {
    if (process.platform !== 'win32') return exports.spawn(cmd, ...args)
    return Promise.resolve().then(() => {
        let created = createSh(cmd)
        return exports.spawn('/Program Files/Git/bin/sh.exe', [created], ...args)
    }).then(resp => {
        fs.unlinkSync(created)
        return resp
    })
}
*/


exports.spawnSilent = function (cmd, cwd, processCb) {
    return exports.spawn(cmd, cwd, processCb, true)
}

/**
 * Spawns process, pipes to stdout and stderr, returns promise which
 * resolves when process finishes
 * @returns {Promise}
 */
exports.spawn = function spawn(cmd, cwd, processCb, silent) {
    console.log('spawn'.yellow, cmd)
    var isSudo = false
    var split
    if (!Array.isArray(cmd)) split = cmd.split(' ')
    else split = cmd
    if (split[0] === 'sudo') {
        isSudo = true
        split.unshift()
    }
    var path = split[0]
    if (path.charAt(0) === '.') path = require('path').resolve(path)
    if (process.platform === 'win32') {
        let check = /node_modules\\\.bin/.test(path) || !path.endsWith('.exe')
        if (check && !String(path).endsWith('.cmd')) {
            path += '.cmd'
        }
    }

    split.shift()
    return new Promise( (resolve,reject) => {
        var opts = undefined
        if (cwd) {
            cwd = require('path').resolve(cwd)
            opts = { cwd }
        }
        let ps;
        if (!isSudo) ps = cp.spawn(path, split, opts)
        else {
            let args = [ path, ...split ]
            let sudoopts
            if ( cwd ) sudoopts = { spawnOptions : opts, cachePassword:false }
            ps = sudo(args, sudoopts)
        }
        let out = ps.stdout
        let err = ps.stderr
        if (!silent) {
            out.pipe(process.stdout)
            err.pipe(process.stderr)
        }
        ps.on('close', () => {
            console.log('end'.yellow, cmd)
            resolve()
        })
        ps.on('error', () => {
            console.log('error'.yellow, cmd)
            reject()
        })
        processCb && processCb(ps)
    })
}


/**
 * Copy a glob of files to a destination. Flattens the output tree.
 * To copy a whole folder whith its structure, use spawn fsync.
 */
exports.copyFn = function copyFn( _srcglob, _dest ) {
    if (!Array.isArray(_srcglob)) _srcglob = [_srcglob]
    return _srcglob.reduce( (chain, eachglob) => {
        return chain.then(() => {
            return exports._p( glob, eachglob ).then( ([files]) => {
                let all = files.map( f => {
                    let base = path.basename(f)
                    let src = path.resolve(f)
                    let dest =  _dest + '/' + base
                    return new Promise( res => {
                        fs.createReadStream(src)
                            .pipe(fs.createWriteStream(dest))
                            .on('finish', () => {
                                console.log('copyfn '.yellow + f + ' => '.red + dest)
                                res()
                            })
                    })
                })
                return Promise.all(all)
            })
        })
    }, Promise.resolve() )
}


var debouncer = {}
exports.debounce = function(id, delay, fn) {
    //console.log('deb1')
    return function(...args) {
        //console.log('deb2',id)
        var last = debouncer[id] || 0
        var now = new Date().getTime()
        if (now - last > delay) {
            debouncer[id] = now + delay
            setTimeout(() => fn(...args) ,delay)
        }
    }
}


exports.requestP = function(reqparams) {
    reqparams.json = reqparams.json || true
    console.log(reqparams.method, reqparams.url)
    var request = require('request')
    return new Promise( (res,rej) => {
        request( reqparams, (err,response,body) => {
            console.log('request responded')
            if (err) return rej(err)
            if (String(response.statusCode).charAt(0) !== '2') {
                console.error('response code', response.statusCode)
                if (Array.isArray(body)) {
                    let message = body.reduce((bef,curr)=>bef + curr.field + ': ' + curr.message +';','')
                    return rej({ message })
                }
                else rej(body)
            }
            if (reqparams.method === 'POST' && typeof body !== 'object')
                return rej(String(body));
            res(body||{})
        })
    })
}


//watch shorthand
exports.watch = function (target, event) {
    chokidar.watch(target).on('all', event)
}

// -- the Runner -- //

exports.runTask = function(tasksDef = {}) {
    let taskName = yargs.argv._[0]
    let fn = tasksDef[taskName]
    if (!fn) return console.error('Task ' + taskName + ' not found')
    var run = fn()

    //if the task is a promise, it will end sometime
    if (run && run.then) {
        run.then( () => {
            console.log('Finished')
            process.exit(0)
        })
        .catch( err => {
            console.error('Error on task'.red)
            console.error(err && (err.formatted || err))
            process.exit(0)
        })
    }
}