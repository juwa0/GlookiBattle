const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

// canvas size
canvas.width = 1024
canvas.height = 576

c.fillRect(0, 0, canvas.width, canvas.height)

const gravity = 0.5

//sprite class to create player and enemy characters
class Sprite {
    constructor({position, velocity}) {
        this.position = position
        this.velocity = velocity
        this.height = 150
        this.lastKey
        this.jumpCount = 0
        this.maxJumps = 2 // Only double jump
    }

    //draw the sprite
    draw() {
        c.fillStyle = 'red'
        c.fillRect(this.position.x, this.position.y, 50, this.height)
    }

    // update position and apply gravity
    update(){
        this.draw()
        
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y

        // make sure player can only jump twice
        if (this.position.y + this.height + this.velocity.y >= canvas.height){
            this.velocity.y = 0
            this.position.y = canvas.height - this.height // Ensures the player stays on the ground
            this.jumpCount = 0 // Reset jump count when the player touches the ground
        } else this.velocity.y += gravity 

    }
}

//initialize player
const player = new Sprite({
    position: {
    x: 0,
    y: 0
    }, 
    velocity: {
        x: 0,
        y: 0
    }
})

//initialize enemy
const enemy = new Sprite({
    position: {
    x: 400,
    y: 100
    }, 
    velocity: {
        x: 0,
        y: 0
    }
})

console.log(player)

// track state of key presses for movement
const keys = {
    a: {
        pressed: false
    },
    d: {
        pressed: false
    },
    ArrowRight: {
        pressed: false
    },
    ArrowLeft: {
        pressed: false
    }
}



function animate(){
    window.requestAnimationFrame(animate)
    c.fillStyle = 'black'
    c.fillRect(0,0, canvas.width, canvas.height)
    player.update()
    enemy.update()
    player.velocity.x = 0
    enemy.velocity.x = 0
    

    //player movement
    if (keys.a.pressed && player.lastKey === 'a'){
        player.velocity.x = - 5
    } else if (keys.d.pressed && player.lastKey === 'd') {
        player.velocity.x = 5
    }

    //enemy movement
    if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft'){
        enemy.velocity.x = -5
    } else if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') {
        enemy.velocity.x = 5
    }
}

animate()

// Event Listener to allow player control over each character
window.addEventListener('keydown', (event) => {
    console.log(event.key)
    switch (event.key) {
        case 'd':
            keys.d.pressed = true
            player.lastKey = 'd'
            break
        case 'a':
            keys.a.pressed = true
            player.lastKey = 'a'
            break
        case 'w':
            // Allow jump if less than max jumps
            if (player.jumpCount < player.maxJumps) {
                player.velocity.y = -18
                player.jumpCount++ // Increase jump count on each jump
            }
            break
        case 's':
            if (player.velocity.y < 0){
                player.velocity.y = 22
            }
            break

        case 'ArrowRight':
            keys.ArrowRight.pressed = true
            enemy.lastKey = 'ArrowRight'
            break
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = true
            enemy.lastKey = 'ArrowLeft'
            break
        case 'ArrowUp':
            if (enemy.jumpCount < enemy.maxJumps) {
                enemy.velocity.y = -18
                enemy.jumpCount++
            }
            break
        case 'ArrowDown':
            if (enemy.velocity.y < 0){
                enemy.velocity.y = 22
            }
            break
    }
    console.log(event.key);
})

// event listener for key releases to stop movement
window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'd':
            keys.d.pressed = false
            break
        case 'a':
            keys.a.pressed = false
            break
        
        //enemy keys
        case 'ArrowRight':
            keys.ArrowRight.pressed = false
            break
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = false
            break
    }
    console.log(event.key);
})
