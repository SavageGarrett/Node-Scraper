let p = new Promise((resolve, reject) => {
    let a = 1 + 1
    if (a == 2) {
        resolve('Success!')
    } else {
        reject('Failed')
    }
})


p.then((message) => {
    console.log('Then: ' + message)
}).catch((message) => {
    console.log('Catch: ' + message)
})

let userLeft = false;
let userWatchingCatMeme = true;

function watchTutorialPromise() {
    return new Promise((resolve, reject) => {
        if (userLeft) {
            reject({
                name: 'User Left',
                message: ':('
            })
        } else if (userWatchingCatMeme) {
            reject({
                name: 'User Watching Cat Meme',
                message: 'WebDevSimplified < Cat'
            })
        } else {
            resolve('Thumbs up and Subscribe')
        }
    })
}

watchTutorialPromise().then((message) => {
    console.log(message)
}).catch((error) => {
    console.log(error.name + " " + error.message)
})


