# buildscript-utils

> _I am a hipster and I don't need gulp!_

**Stub module status:** This is a "stub" module. It's someting taken out from a another
project, it will mostly work fine since its "battle-tested", but it's not polished
enough to deserve an npm module.

## Why not gulp

  - Easier debugging  
  - Flat dependencies. (No gulp plugins which require the real APIs)
  - The use of gulp tasks as async dependencies is BAD (admitelly said by their creators)
  - Because it is not needed
  - Because I'm a hipster and I like to invent wheels


## Tools in a nutshell

### runTask(tasksDef : { [taskName] : () => Promise|void })

The task runner. Provide and object which keys will be the task names.

```javascript
//build.js
var tasks = {
    bundle() {
        return doSomething()
    } 
}
buildscript.runTask(tasks)
//call in console:
//node build bundle
```
Dependencies? Do them yourself using promises and raw functions.  
Parameters? Do them yourself in your favorite way. (todo: add default CLI param passing)

### _p or promisify( fn, ...args ) => Promise<any[]>

Convert a generic callback-style function to a Promise.  
The last argument is assumed as the node-style callback `(err, result) => {}`.

You may need to rebind the function/method if the source API has OOP-style.

```javascript
const request = require('request')
bs._p( request , { method : 'GET', url: 'url' } )
    .then( [response, body] => {
        console.log(body)
    })
```

### spawn( command, cwd?, processCb? : (process) => any ) : Promise<void>

Spawns a CLI tool.  
TODO: Add option to automatically prepend '../node_modules/.bin'.

**processCb** Callback which provides the created process object.
You are not supposed to use this unless you want to -- say -- programatically
send input or kill the process.

```javascript
var tasks = {
    watch() {
        bs.spawn('../node_modules/.bin/tsc -w')
        bs.spawn('../node_modules/.bin/livereload')
    }
}
bs.runTask(tasks)
```

### copyFn( srcglob, dest ) : Promise<void>

Copies a glob of files to a destination, flattening the output tree.
To copy a folder without flattening, use `spawn('rsync ...')` instead.


---

_(The other functions inside here either dont belong here, or are not being used:
therefore are badly tested.)_