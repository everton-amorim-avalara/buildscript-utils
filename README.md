# buildscript-utils


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

**windows**

Sometimes we need to add `.cmd` extension in windows.

I will do that if

  - Path starts with `./node_modules/.bin`
  - You append `@` to a path i.e. `npm@ install`

### copyFn( srcglob, dest ) : Promise<void>

Copies a glob of files to a destination, flattening the output tree.
To copy a folder without flattening, use `spawn('rsync ...')` instead.


### watch(targetGlob, cb)

Watch a folder using chokidar.


---

_(The other functions inside here either dont belong here, or are not being used:
therefore are badly tested.)_