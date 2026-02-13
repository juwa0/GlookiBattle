const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
c.imageSmoothingEnabled = false

// canvas size
canvas.width = 1024
canvas.height = 576

c.fillRect(0, 0, canvas.width, canvas.height)

const gravity = 0.5

const story = {
    yourName: 'Chrissy',
    herName: 'Andrea',
    heartsToCollect: 7,
    loveCode: '0225'
}

//sprite class to create player and enemy characters
class Sprite {
    constructor({position, velocity, width = 50, height = 150, color = 'red', image = null, imageScale = 3}) {
        this.position = position
        this.velocity = velocity
        this.width = width
        this.height = height
        this.color = color
        this.image = image
        this.imageScale = imageScale
        this.idleImage = null
        this.jumpImage = null
        this.isGrounded = false
        this.lastKey
        this.jumpCount = 0
        this.maxJumps = 2 // Only double jump
    }

    //draw the sprite
    draw() {
        if (this.image && this.image.complete && this.image.naturalWidth > 0) {
            const w = this.image.naturalWidth * this.imageScale
            const h = this.image.naturalHeight * this.imageScale
            const x = Math.floor(this.position.x + (this.width - w) / 2)
            const y = Math.floor(this.position.y + (this.height - h))
            c.drawImage(this.image, x, y, w, h)
            return
        }

        c.fillStyle = this.color
        c.fillRect(this.position.x, this.position.y, this.width, this.height)
    }

    // update position and apply gravity
    update({platforms = []} = {}){
        this.isGrounded = false

        this.position.x += this.velocity.x
        this.position.y += this.velocity.y

        if (this.position.x < 0) this.position.x = 0
        if (this.position.x + this.width > canvas.width) this.position.x = canvas.width - this.width

        for (const platform of platforms) {
            const isFallingOntoPlatform =
                this.position.y + this.height <= platform.y &&
                this.position.y + this.height + this.velocity.y >= platform.y

            const overlapsHorizontally =
                this.position.x + this.width >= platform.x &&
                this.position.x <= platform.x + platform.width

            if (isFallingOntoPlatform && overlapsHorizontally) {
                this.velocity.y = 0
                this.position.y = platform.y - this.height
                this.isGrounded = true
                this.jumpCount = 0
            }
        }

        // make sure player can only jump twice
        if (this.position.y + this.height + this.velocity.y >= canvas.height){
            this.velocity.y = 0
            this.position.y = canvas.height - this.height // Ensures the player stays on the ground
            this.isGrounded = true
            this.jumpCount = 0 // Reset jump count when the player touches the ground
        } else this.velocity.y += gravity 

        if (this.idleImage) {
            this.image = this.isGrounded ? this.idleImage : (this.jumpImage || this.idleImage)
        }

        this.draw()

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
    },
    width: 42,
    height: 110,
    color: '#ff4d9d'
})

const playerSprite = new Image()
playerSprite.src = 'player.png'
const playerJumpSprite = new Image()
playerJumpSprite.src = 'playerjump.png'
player.idleImage = playerSprite
player.jumpImage = playerJumpSprite
player.image = playerSprite
player.imageScale = 3

//initialize enemy
const enemy = null

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

const GameMode = Object.freeze({
    TITLE: 'TITLE',
    DIALOG: 'DIALOG',
    HEARTS: 'HEARTS',
    BASKET: 'BASKET',
    LOCK: 'LOCK',
    TRIVIA: 'TRIVIA',
    QUESTION: 'QUESTION',
    END: 'END'
})

let mode = GameMode.TITLE

let dialogPages = []
let dialogIndex = 0
let afterDialog = null

let heartsCollected = 0
let hearts = []
let platforms = []

let lockInput = ''
let lockErrorFlash = 0

let questionSelection = 'YES'

let giftCount = 0
const gift1Audio = new Audio('gift1.mp3')

let basketAngle = -0.9
let basketPower = 16
let basketBall = { x: 0, y: 0, vx: 0, vy: 0, inFlight: false }
const hoop = { x: 860, y: 260, w: 86, h: 10 }
const ballRadius = 14
const basketsToWin = 3
let basketsMade = 0
let basketScoreFlash = 0

const triviaQuestions = [
    {
        question: 'Where did we first kiss?',
        options: ['In the Q50 (RIP)', 'At the beach', 'At the movies', 'At the mall'],
        answerIndex: 0
    },
    {
        question: "How many Valentine’s have we now spent together?",
        options: ['3', '4', '5', '6'],
        answerIndex: 1
    },
    {
        question: 'What is our song?',
        options: ['Best I Ever Had by Drake', 'Thinking Out Loud by Ed Sheeran', 'Perfect by Ed Sheeran', 'Yellow by Coldplay'],
        answerIndex: 0
    }
]

let triviaIndex = 0
let triviaSelection = 0
let triviaErrorFlash = 0

const clouds = Array.from({ length: 8 }, () => ({
    x: Math.random() * canvas.width,
    y: 40 + Math.random() * 220,
    size: 26 + Math.random() * 44,
    speed: 0.25 + Math.random() * 0.55
}))

function fillPixelRect(x, y, w, h, color) {
    c.fillStyle = color
    c.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h))
}

function drawPixelSun() {
    const cx = 130
    const cy = 110
    const r = 44
    const step = 6

    for (let x = -r; x <= r; x += step) {
        for (let y = -r; y <= r; y += step) {
            const d = Math.sqrt(x * x + y * y)
            if (d <= r) {
                const color = d < r * 0.55 ? '#fff59a' : '#ffd24a'
                fillPixelRect(cx + x, cy + y, step, step, color)
            }
        }
    }

    for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2
        const ox = Math.cos(angle) * (r + 14)
        const oy = Math.sin(angle) * (r + 14)
        fillPixelRect(cx + ox, cy + oy, 8, 8, '#ffd24a')
    }
}

function drawPixelCloud(cloud) {
    const x = cloud.x
    const y = cloud.y
    const s = cloud.size
    const step = 8

    const blocks = [
        { dx: 0, dy: 1, w: 5, h: 2 },
        { dx: 1, dy: 0, w: 5, h: 3 },
        { dx: 4, dy: 0, w: 5, h: 3 },
        { dx: 7, dy: 1, w: 4, h: 2 }
    ]

    for (const b of blocks) {
        fillPixelRect(x + b.dx * step, y + b.dy * step, b.w * step, b.h * step, 'rgba(255,255,255,0.95)')
        fillPixelRect(x + b.dx * step, y + b.dy * step + b.h * step - 6, b.w * step, 6, 'rgba(220,235,255,0.55)')
    }

    fillPixelRect(x + 4 * step, y + 3 * step, 6 * step, 1 * step, 'rgba(255,255,255,0.92)')

    cloud.x += cloud.speed
    if (cloud.x > canvas.width + s * 8) {
        cloud.x = -s * 8
        cloud.y = 40 + Math.random() * 220
        cloud.size = 26 + Math.random() * 44
        cloud.speed = 0.25 + Math.random() * 0.55
    }
}

function drawHeart(x, y, size, color, alpha = 1) {
    c.save()
    c.globalAlpha = alpha
    c.fillStyle = color
    c.beginPath()
    const topCurveHeight = size * 0.3
    c.moveTo(x, y + topCurveHeight)
    c.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight)
    c.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 2, x, y + size)
    c.bezierCurveTo(x, y + (size + topCurveHeight) / 2, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight)
    c.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight)
    c.closePath()
    c.fill()
    c.restore()
}

function wrapText(text, maxWidth) {
    const words = String(text).split(' ')
    const lines = []
    let current = ''
    for (const word of words) {
        const test = current ? `${current} ${word}` : word
        if (c.measureText(test).width > maxWidth && current) {
            lines.push(current)
            current = word
        } else {
            current = test
        }
    }
    if (current) lines.push(current)
    return lines
}

function drawTextBox({title, text, hint} = {}) {
    const pad = 28
    const boxW = canvas.width - pad * 2
    const boxH = 170
    const x = pad
    const y = canvas.height - boxH - pad

    c.save()
    c.fillStyle = 'rgba(0, 0, 0, 0.65)'
    c.fillRect(x, y, boxW, boxH)
    c.strokeStyle = 'rgba(255, 255, 255, 0.25)'
    c.strokeRect(x, y, boxW, boxH)

    c.fillStyle = '#ffffff'
    c.font = '20px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    if (title) c.fillText(title, x + 18, y + 32)

    c.font = '18px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    const lines = wrapText(text || '', boxW - 36)
    lines.slice(0, 5).forEach((line, i) => {
        c.fillText(line, x + 18, y + 64 + i * 24)
    })

    if (hint) {
        c.fillStyle = 'rgba(255,255,255,0.8)'
        c.font = '16px system-ui, -apple-system, Segoe UI, Roboto, Arial'
        c.fillText(hint, x + 18, y + boxH - 18)
    }

    c.restore()
}

function startDialog(pages, next) {
    dialogPages = pages
    dialogIndex = 0
    afterDialog = next
    mode = GameMode.DIALOG
}

function awardGift(next) {
    giftCount++
    let giftText = 'You have unlocked a gift! Accept your reward'
    let nextText = ''
    if (giftCount === 1) {
        giftText = 'Gift #1 is an audio message. Enjoy the beautiful music!'
        gift1Audio.currentTime = 0
        gift1Audio.play().catch(() => {})
        nextText = 'Now I know you have not played too much basketball, but its time to see if you still got it. For this quest, you must make 3 shots. Use ←/→ to aim, ↑/↓ for power, and Enter to shoot!'
    } else if (giftCount === 2) {
        nextText = `For this quest, you must open the Love Letter Lock. Type the 4-digit code and press Enter to continue.`
    }
    startDialog(
        [
            { title: `Gift #${giftCount}`, text: giftText },
            ...(nextText ? [{ title: story.yourName, text: nextText }] : [])
        ],
        next
    )
}

function startTrivia() {
    mode = GameMode.TRIVIA
    triviaIndex = 0
    triviaSelection = 0
    triviaErrorFlash = 0
}

function startHeartsGame() {
    mode = GameMode.HEARTS
    heartsCollected = 0

    player.position.x = 80
    player.position.y = canvas.height - player.height
    player.velocity.x = 0
    player.velocity.y = 0
    player.jumpCount = 0

    platforms = [
        { x: 120, y: 420, width: 240, height: 18 },
        { x: 440, y: 360, width: 220, height: 18 },
        { x: 720, y: 300, width: 190, height: 18 },
        { x: 510, y: 480, width: 180, height: 18 }
    ]

    hearts = [
        { x: 200, y: 370, collected: false },
        { x: 300, y: 370, collected: false },
        { x: 520, y: 310, collected: false },
        { x: 610, y: 310, collected: false },
        { x: 780, y: 250, collected: false },
        { x: 860, y: 250, collected: false },
        { x: 560, y: 430, collected: false },
        { x: 650, y: 430, collected: false },
        { x: 920, y: 520, collected: false }
    ]
}

function startBasketballGame() {
    mode = GameMode.BASKET
    basketAngle = -0.9
    basketPower = 16
    basketsMade = 0
    basketScoreFlash = 0
    basketBall = {
        x: 160,
        y: canvas.height - 170,
        vx: 0,
        vy: 0,
        inFlight: false
    }
}

function startLockGame() {
    mode = GameMode.LOCK
    lockInput = ''
    lockErrorFlash = 0
}

function startQuestion() {
    mode = GameMode.QUESTION
    questionSelection = 'YES'
}

function restartGame() {
    keys.a.pressed = false
    keys.d.pressed = false
    keys.ArrowLeft.pressed = false
    keys.ArrowRight.pressed = false
    player.velocity.x = 0
    player.velocity.y = 0
    player.jumpCount = 0
    giftCount = 0
    triviaIndex = 0
    triviaSelection = 0
    triviaErrorFlash = 0
    mode = GameMode.TITLE
}

function drawBackground() {
    const g = c.createLinearGradient(0, 0, 0, canvas.height)
    g.addColorStop(0, '#6fd2ff')
    g.addColorStop(1, '#b8f0ff')
    c.fillStyle = g
    c.fillRect(0, 0, canvas.width, canvas.height)

    fillPixelRect(0, canvas.height - 140, canvas.width, 140, '#66d36e')
    fillPixelRect(0, canvas.height - 140, canvas.width, 12, 'rgba(255,255,255,0.25)')

    drawPixelSun()
    for (const cloud of clouds) {
        drawPixelCloud(cloud)
    }
}

function drawPlatforms() {
    c.save()
    c.fillStyle = 'rgba(255,255,255,0.16)'
    for (const p of platforms) {
        c.fillRect(p.x, p.y, p.width, p.height)
    }
    c.restore()
}

function drawHearts() {
    for (const h of hearts) {
        if (h.collected) continue
        drawHeart(h.x, h.y, 22, '#ff3b7a', 0.95)
    }
}

function spriteHitsHeart(sprite, heart) {
    const cx = sprite.position.x + sprite.width / 2
    const cy = sprite.position.y + sprite.height / 2
    const dx = cx - heart.x
    const dy = cy - heart.y
    return (dx * dx + dy * dy) <= 50 * 50
}

function updateHeartsGame() {
    player.velocity.x = 0

    if (keys.a.pressed && player.lastKey === 'a'){
        player.velocity.x = -5
    } else if (keys.d.pressed && player.lastKey === 'd') {
        player.velocity.x = 5
    }

    drawPlatforms()
    drawHearts()
    player.update({ platforms })

    for (const h of hearts) {
        if (h.collected) continue
        if (spriteHitsHeart(player, h)) {
            h.collected = true
            heartsCollected++
        }
    }

    c.save()
    c.fillStyle = 'rgba(255,255,255,0.9)'
    c.font = '18px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    c.fillText(`Hearts: ${Math.min(heartsCollected, story.heartsToCollect)} / ${story.heartsToCollect}`, 24, 34)
    c.restore()

    if (heartsCollected >= story.heartsToCollect) {
        startDialog(
            [
                { title: story.yourName, text: `You did it, ${story.herName}. That was so freakin awesome B)` },
                { title: story.yourName, text: `You just unlocked your first reward.` }
            ],
            () => awardGift(startBasketballGame)
        )
    }
}

function drawBasketballHUD() {
    c.save()
    c.fillStyle = 'rgba(0,0,0,0.35)'
    c.fillRect(18, 18, 310, 68)
    c.fillStyle = 'rgba(255,255,255,0.92)'
    c.font = '18px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    c.fillText('Basketball', 30, 44)
    c.font = '16px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    c.fillText(`Angle: ${Math.round((basketAngle * 180) / Math.PI)}°`, 30, 68)
    c.fillText(`Power: ${Math.round(basketPower)}`, 170, 68)
    c.fillText(`Made: ${basketsMade}/${basketsToWin}`, 250, 44)
    c.restore()
}

function drawBasketballCourt() {
    fillPixelRect(0, canvas.height - 140, canvas.width, 140, '#d3a05b')
    fillPixelRect(0, canvas.height - 140, canvas.width, 10, 'rgba(255,255,255,0.25)')
    fillPixelRect(0, canvas.height - 110, canvas.width, 6, 'rgba(255,255,255,0.14)')

    c.save()
    c.strokeStyle = 'rgba(255,255,255,0.55)'
    c.lineWidth = 4
    c.beginPath()
    c.arc(320, canvas.height - 60, 44, 0, Math.PI * 2)
    c.stroke()
    c.restore()
}

function drawHoop() {
    fillPixelRect(hoop.x + 50, hoop.y - 120, 12, 130, 'rgba(60,50,40,0.85)')
    fillPixelRect(hoop.x + 18, hoop.y - 120, 70, 54, 'rgba(255,255,255,0.65)')
    fillPixelRect(hoop.x + 22, hoop.y - 116, 62, 46, 'rgba(255,255,255,0.22)')

    fillPixelRect(hoop.x, hoop.y, hoop.w, hoop.h, '#ff4d3a')
    fillPixelRect(hoop.x + 6, hoop.y + 10, hoop.w - 12, 6, 'rgba(255,255,255,0.18)')
}

function drawBall(x, y) {
    const step = 4
    const r = ballRadius
    for (let dx = -r; dx <= r; dx += step) {
        for (let dy = -r; dy <= r; dy += step) {
            const d = Math.sqrt(dx * dx + dy * dy)
            if (d <= r) {
                const color = d < r * 0.55 ? '#ffb24a' : '#f07d2c'
                fillPixelRect(x + dx, y + dy, step, step, color)
            }
        }
    }
    fillPixelRect(x - 2, y - r, 4, r * 2, 'rgba(60,30,20,0.35)')
    fillPixelRect(x - r, y - 2, r * 2, 4, 'rgba(60,30,20,0.25)')
}

function circleHitsRect(cx, cy, r, rect) {
    const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w))
    const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h))
    const dx = cx - closestX
    const dy = cy - closestY
    return dx * dx + dy * dy <= r * r
}

function shootBall() {
    if (basketBall.inFlight) return
    basketBall.inFlight = true
    basketBall.vx = Math.cos(basketAngle) * basketPower
    basketBall.vy = Math.sin(basketAngle) * basketPower
}

function updateBasketballGame() {
    drawBasketballCourt()
    drawHoop()

    const backboard = {
        x: hoop.x + 18,
        y: hoop.y - 120,
        w: 70,
        h: 54
    }

    if (basketBall.inFlight) {
        basketBall.x += basketBall.vx
        basketBall.y += basketBall.vy
        basketBall.vy += 0.55
        basketBall.vx *= 0.995

        if (circleHitsRect(basketBall.x, basketBall.y, ballRadius, backboard)) {
            basketsMade++
            basketScoreFlash = 26

            basketBall.inFlight = false
            basketBall.x = 160
            basketBall.y = canvas.height - 170
            basketBall.vx = 0
            basketBall.vy = 0

            if (basketsMade >= basketsToWin) {
                startDialog(
                    [
                        { title: story.yourName, text: `You did it! You made ${basketsToWin} shots, looks like the old dog still got its tricks B).` },
                        { title: story.yourName, text: `You just unlocked your next reward.` }
                    ],
                    () => awardGift(startLockGame)
                )
            }
        }

        if (basketBall.y > canvas.height - 154) {
            basketBall.y = canvas.height - 154
            basketBall.vy *= -0.55
            basketBall.vx *= 0.85
            if (Math.abs(basketBall.vy) < 2) {
                basketBall.inFlight = false
                basketBall.vx = 0
                basketBall.vy = 0
            }
        }

        if (basketBall.x < -50 || basketBall.x > canvas.width + 50 || basketBall.y < -50) {
            basketBall.inFlight = false
            basketBall.x = 160
            basketBall.y = canvas.height - 170
            basketBall.vx = 0
            basketBall.vy = 0
        }

    } else {
        const ax = basketBall.x + Math.cos(basketAngle) * 70
        const ay = basketBall.y + Math.sin(basketAngle) * 70
        c.save()
        c.strokeStyle = 'rgba(255,255,255,0.7)'
        c.lineWidth = 3
        c.beginPath()
        c.moveTo(basketBall.x, basketBall.y)
        c.lineTo(ax, ay)
        c.stroke()
        c.restore()
    }

    drawBall(basketBall.x, basketBall.y)

    if (basketScoreFlash > 0) {
        basketScoreFlash--
        c.save()
        c.fillStyle = 'rgba(255,255,255,0.95)'
        c.font = '28px system-ui, -apple-system, Segoe UI, Roboto, Arial'
        c.fillText(`SCORE! ${basketsMade}/${basketsToWin}`, 420, 110)
        c.restore()
    }

    drawBasketballHUD()
}

function drawTitle() {
    c.save()
    c.fillStyle = 'rgba(255,255,255,0.95)'
    c.font = '48px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    c.fillText("The Legendary Quest", 70, 200)

    c.font = '22px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    c.fillStyle = 'rgba(255,255,255,0.85)'
    c.fillText(`Starring: ${story.herName}`, 380, 248)
    c.fillText('Press Enter to begin', 380, 310)
    c.fillText('Press R anytime to restart', 360, 348)
    c.restore()
}

function drawDialog() {
    const page = dialogPages[dialogIndex]
    drawTextBox({
        title: page?.title,
        text: page?.text,
        hint: 'Enter / Space to continue'
    })
}

function drawLock() {
    c.save()
    c.fillStyle = 'rgba(255,255,255,0.95)'
    c.font = '36px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    c.fillText('Unlock the Love Letter', 280, 170)

    c.font = '18px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    c.fillStyle = 'rgba(255,255,255,0.8)'
    c.fillText('Type the 4-digit code and press Enter', 330, 210)

    const boxW = 300
    const boxH = 70
    const x = (canvas.width - boxW) / 2
    const y = 250

    if (lockErrorFlash > 0) {
        c.fillStyle = `rgba(255, 60, 110, ${Math.min(lockErrorFlash / 18, 0.55)})`
        c.fillRect(x - 6, y - 6, boxW + 12, boxH + 12)
        lockErrorFlash--
    }

    c.fillStyle = 'rgba(0,0,0,0.55)'
    c.fillRect(x, y, boxW, boxH)
    c.strokeStyle = 'rgba(255,255,255,0.25)'
    c.strokeRect(x, y, boxW, boxH)

    c.font = '44px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
    c.fillStyle = 'rgba(255,255,255,0.95)'
    const shown = lockInput.padEnd(4, '•')
    c.fillText(shown, x + 70, y + 52)

    c.font = '16px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    c.fillStyle = 'rgba(255,255,255,0.75)'
    c.fillText('Hint: it’s a date that feels like us', 390, 350)
    c.restore()
}

function drawTrivia() {
    const q = triviaQuestions[triviaIndex]
    if (!q) return

    const pad = 24
    const boxW = canvas.width - pad * 2
    const boxH = 320
    const x = pad
    const y = 140

    c.save()
    c.fillStyle = 'rgba(0,0,0,0.55)'
    c.fillRect(x, y, boxW, boxH)
    c.strokeStyle = 'rgba(255,255,255,0.25)'
    c.strokeRect(x, y, boxW, boxH)

    if (triviaErrorFlash > 0) {
        c.fillStyle = `rgba(255, 60, 110, ${Math.min(triviaErrorFlash / 18, 0.35)})`
        c.fillRect(x, y, boxW, boxH)
        triviaErrorFlash--
    }

    c.fillStyle = 'rgba(255,255,255,0.95)'
    c.font = '22px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    c.fillText(`Trivia ${triviaIndex + 1} / ${triviaQuestions.length}`, x + 18, y + 40)

    c.font = '24px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    const lines = wrapText(q.question, boxW - 36)
    lines.slice(0, 2).forEach((line, i) => {
        c.fillText(line, x + 18, y + 84 + i * 30)
    })

    const startY = y + 160
    c.font = '20px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    q.options.forEach((opt, i) => {
        const oy = startY + i * 46
        const isSelected = i === triviaSelection
        if (isSelected) {
            c.fillStyle = 'rgba(255,255,255,0.18)'
            c.fillRect(x + 14, oy - 26, boxW - 28, 36)
        }
        c.fillStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.85)'
        c.fillText(opt, x + 28, oy)
    })

    c.font = '16px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    c.fillStyle = 'rgba(255,255,255,0.75)'
    c.textBaseline = 'bottom'
    c.fillText('↑/↓ to choose, Enter to confirm', x + 18, y + boxH - 1)
    c.textBaseline = 'alphabetic'

    c.restore()
}

function drawQuestion() {
    c.save()
    c.fillStyle = 'rgba(255,255,255,0.95)'
    c.font = '44px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    c.fillText(`${story.herName}, will you be my Valentine?`, 110, 210)

    const yesX = 360
    const noX = 560
    const y = 300

    c.font = '30px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    c.fillStyle = questionSelection === 'YES' ? '#ff4d9d' : 'rgba(255,255,255,0.8)'
    c.fillText('[ YES ]', yesX, y)
    c.fillStyle = questionSelection === 'NO' ? '#ff4d9d' : 'rgba(255,255,255,0.8)'
    c.fillText('[ NO ]', noX, y)

    c.font = '18px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    c.fillStyle = 'rgba(255,255,255,0.7)'
    c.fillText('Use ← / → and press Enter', 380, 350)
    c.restore()
}

function drawEnd() {
    c.save()
    c.fillStyle = 'rgba(255,255,255,0.95)'
    c.font = '54px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    c.fillText('Happy Valentine’s Day!', 210, 210)

    c.font = '26px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    c.fillStyle = 'rgba(255,255,255,0.85)'
    c.fillText(`I love you so so much ${story.herName}. Thank you for being the most amazing girlfriend ever!`, 80, 270)
    c.fillText('I hope you enjoy the gifts <3', 80, 305)
    c.fillText(`— ${story.yourName}`, 450, 345)

    c.font = '18px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    c.fillStyle = 'rgba(255,255,255,0.7)'
    c.fillText('Press R to replay', 430, 370)
    c.restore()
}

function animate(){
    window.requestAnimationFrame(animate)
    drawBackground()

    if (mode === GameMode.TITLE) {
        drawTitle()
    }

    if (mode === GameMode.DIALOG) {
        drawDialog()
    }

    if (mode === GameMode.HEARTS) {
        updateHeartsGame()
    }

    if (mode === GameMode.BASKET) {
        updateBasketballGame()
    }

    if (mode === GameMode.LOCK) {
        drawLock()
    }

    if (mode === GameMode.TRIVIA) {
        drawTrivia()
    }

    if (mode === GameMode.QUESTION) {
        drawQuestion()
    }

    if (mode === GameMode.END) {
        drawEnd()
    }
}

animate()

// Event Listener to allow player control over each character
window.addEventListener('keydown', (event) => {
    if (event.key === ' ' || event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'Backspace') {
        event.preventDefault()
    }
    switch (event.key) {
        case 'r':
        case 'R':
            restartGame()
            break
        case ' ': 
        case 'Enter':
            if (mode === GameMode.BASKET) {
                shootBall()
                break
            }
            if (mode === GameMode.TITLE) {
                startDialog(
                    [
                        { title: story.yourName, text: `Hello ${story.herName}... Welcome on your journey to complete the Saint Valentine's quest!` },
                        { title: story.yourName, text: `You may take on the quest... if you dare! If you are successful, the reward will be excellent!` }
                    ],
                    () => startDialog(
                        [{ title: story.herName, text: `Okay. Where shall we begin oh quest master Chrissy?` }],
                        () => startDialog(
                            [{ title: story.yourName, text: `First we must collect some hearts. They were scattered around and must be recovered to save the village. Use W to jump and A/D to move!` }],
                            startHeartsGame
                        )
                    )
                )
                break
            }
            if (mode === GameMode.DIALOG) {
                dialogIndex++
                if (dialogIndex >= dialogPages.length) {
                    const next = afterDialog
                    afterDialog = null
                    if (typeof next === 'function') next()
                }
                break
            }
            if (mode === GameMode.LOCK) {
                if (lockInput.length === 4) {
                    if (lockInput === String(story.loveCode)) {
                        startDialog(
                            [
                                { title: story.yourName, text: `Successfully unlocked. Well done Andrea! You are eating this quest up on period.` },
                                { title: story.yourName, text: `You have finally made it to the final quest. To unlock your final reward, you must now answer my riddles three 0_0` }
                            ],
                            startTrivia
                        )
                    } else {
                        lockInput = ''
                        lockErrorFlash = 18
                    }
                } else {
                    lockErrorFlash = 18
                }
                break
            }
            if (mode === GameMode.TRIVIA) {
                const q = triviaQuestions[triviaIndex]
                if (q && triviaSelection === q.answerIndex) {
                    triviaIndex++
                    triviaSelection = 0
                    triviaErrorFlash = 0
                    if (triviaIndex >= triviaQuestions.length) {
                        startDialog(
                            [{ title: story.yourName, text: 'Andrea, you are a genius!! You have passed all the trials and proven yourself worthy. Congratulations young quest enjoyer. Saint Valetine will be quite pleased. Now, you must answer one final question!' }],
                            startQuestion
                        )
                    }
                } else {
                    triviaErrorFlash = 18
                }
                break
            }
            if (mode === GameMode.QUESTION) {
                if (questionSelection === 'YES') {
                    mode = GameMode.END
                } else {
                    startDialog(
                        [{ title: story.yourName, text: `Error 404: Incorrect answer. Please try again.` }],
                        startQuestion
                    )
                }
                break
            }
            break
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
            if (mode === GameMode.HEARTS) {
                if (player.jumpCount < player.maxJumps) {
                    player.velocity.y = -10
                    player.jumpCount++ // Increase jump count on each jump
                }
            }
            break
        case 's':
            if (mode === GameMode.HEARTS) {
                if (player.velocity.y < 0){
                    player.velocity.y = 22
                }
            }
            break
        case 'ArrowLeft':
            if (mode === GameMode.QUESTION) questionSelection = 'YES'
            if (mode === GameMode.BASKET) {
                basketAngle = Math.max(-1.55, basketAngle - 0.08)
                break
            }
            if (mode === GameMode.TRIVIA) {
                triviaSelection = (triviaSelection - 1 + triviaQuestions[triviaIndex].options.length) % triviaQuestions[triviaIndex].options.length
                break
            }
            break
        case 'ArrowRight':
            if (mode === GameMode.QUESTION) questionSelection = 'NO'
            if (mode === GameMode.BASKET) {
                basketAngle = Math.min(-0.1, basketAngle + 0.08)
                break
            }
            if (mode === GameMode.TRIVIA) {
                triviaSelection = (triviaSelection + 1) % triviaQuestions[triviaIndex].options.length
                break
            }
            break
        case 'ArrowUp':
            if (mode === GameMode.BASKET) {
                basketPower = Math.min(26, basketPower + 0.8)
            }
            if (mode === GameMode.TRIVIA) {
                triviaSelection = (triviaSelection - 1 + triviaQuestions[triviaIndex].options.length) % triviaQuestions[triviaIndex].options.length
                break
            }
            break
        case 'ArrowDown':
            if (mode === GameMode.BASKET) {
                basketPower = Math.max(8, basketPower - 0.8)
            }
            if (mode === GameMode.TRIVIA) {
                triviaSelection = (triviaSelection + 1) % triviaQuestions[triviaIndex].options.length
                break
            }
            break
        case 'Backspace':
            if (mode === GameMode.LOCK) {
                lockInput = lockInput.slice(0, -1)
            }
            break
        default:
            if (mode === GameMode.LOCK) {
                if (/^\d$/.test(event.key) && lockInput.length < 4) {
                    lockInput += event.key
                }
            }
            break
    }
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
    }
})
