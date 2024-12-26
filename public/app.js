const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');
const socket = io(); // Connect to backend

let emojisOnCanvas = []; // Track emojis on the canvas

// Constants for gravitational pull and orbit simulation
const GRAVITY_CONSTANT = 0.1; // Adjust for gravitational pull strength
const blackHoleX = canvas.width / 2;
const blackHoleY = canvas.height / 2;
let blackHoleRadius = 50; // Black hole's radius

// Function to calculate gravitational force and update emoji velocity
function calculateGravitationalForce(emoji) {
    const dx = blackHoleX - emoji.x;
    const dy = blackHoleY - emoji.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) { // Avoid too strong forces if too close
        // Gravitational force is proportional to mass and inversely proportional to distance squared
        const force = GRAVITY_CONSTANT / (distance * distance);
        const angle = Math.atan2(dy, dx);

        // Calculate the gravitational acceleration components
        return {
            forceX: Math.cos(angle) * force,
            forceY: Math.sin(angle) * force
        };
    }
    return { forceX: 0, forceY: 0 }; // If too close to the black hole, no force
}

// Initialize orbital parameters
function initializeOrbitalMotion(emoji, x, y, initialVelocityX, initialVelocityY) {
    emoji.x = x;
    emoji.y = y;
    emoji.vx = initialVelocityX; // Tangential velocity (X-component)
    emoji.vy = initialVelocityY; // Tangential velocity (Y-component)
    emoji.isDisabled = false; // Initially, the emoji is not disabled
}

// Check if emoji is inside the black hole
function checkCollision(emoji) {
    const dx = blackHoleX - emoji.x;
    const dy = blackHoleY - emoji.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If the emoji is inside the black hole's radius, disable it
    if (distance <= blackHoleRadius) {
        emoji.isDisabled = true; // Disable the emoji
        emoji.vx = 0; // Stop horizontal movement
        emoji.vy = 0; // Stop vertical movement
        emojisOnCanvas = emojisOnCanvas.filter(e => e !== emoji); // Remove from canvas
        socket.emit('removeEmoji', emoji.id); // Optionally, send remove request to server
    }
}

// Function to calculate gravitational pull (you can adjust the strength of gravity here)
function calculateGravitationalPull(emoji) {
    const gravityStrength = 0.01; // Change this for more/less gravity
    const dx = blackHoleX - emoji.x;
    const dy = blackHoleY - emoji.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const force = gravityStrength / (distance * distance); // Inverse square law
    const forceX = force * dx / distance; // Normalize to get direction
    const forceY = force * dy / distance; // Normalize to get direction
    
    return { forceX, forceY };
}

// Update emoji positions based on gravitational pull
function updateEmojiPositions() {
    emojisOnCanvas.forEach((emoji) => {
        // Skip disabled emojis
        if (emoji.isDisabled) return;

        const { forceX, forceY } = calculateGravitationalPull(emoji);
        emoji.vx += forceX;
        emoji.vy += forceY;

        // Update emoji position
        emoji.x += emoji.vx;
        emoji.y += emoji.vy;

        // Check if the emoji has entered the black hole
        if (checkCollision(emoji)) {
            emoji.isDisabled = true; // Disable the emoji
            emoji.vx = 0; // Stop horizontal movement
            emoji.vy = 0; // Stop vertical movement
        }
    });
}

// Draw the black hole at the center
function drawBlackHole() {
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(blackHoleX, blackHoleY, blackHoleRadius, 0, Math.PI * 2);
    ctx.fill();
}

// Draw emojis on the canvas
function drawEmojis() {
    emojisOnCanvas.forEach((emoji) => {
        // Only draw the emoji if it's not disabled
        if (!emoji.isDisabled) {
            ctx.font = '30px Arial';
            ctx.fillText(emoji.emoji_symbol, emoji.x, emoji.y);
        }
    });
}

// Update the canvas
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    drawBlackHole(); // Draw black hole
    drawEmojis(); // Draw emojis
    updateEmojiPositions(); // Apply gravitational force and update positions
    requestAnimationFrame(render); // Continuous rendering loop
}

render();

// Handle emoji dragging to the canvas
const emojis = document.querySelectorAll('.emoji');
emojis.forEach((emoji) => {
    emoji.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('emoji_symbol', emoji.textContent);
    });
});

// Handle the emoji drop event on the canvas
canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const emoji_symbol = e.dataTransfer.getData('emoji_symbol');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Assign initial orbital velocity components for elliptical orbit
    const initialVelocityX = 2; // Adjust initial velocity for orbiting behavior
    const initialVelocityY = 0; // Tangential velocity, you can modify this for elliptical effect

    // Initialize emoji motion in orbit
    const emoji = { emoji_symbol, vx: 0, vy: 0, isDisabled: false };
    initializeOrbitalMotion(emoji, x, y, initialVelocityX, initialVelocityY);

    emojisOnCanvas.push(emoji);
    socket.emit('saveEmoji', { emoji_symbol, x, y }); // Send data to backend
});

socket.on('saveEmoji', (data) => {
    // Save emoji data to your database (MySQL or other)
    const query = 'INSERT INTO emojis (emoji_symbol, x, y) VALUES (?, ?, ?)';
    db.query(query, [data.emoji_symbol, data.x, data.y], (err, result) => {
        if (err) throw err;
        console.log('Emoji data saved:', result);

        // Send updated data to all clients
        socket.emit('update', result);  // Send updated emoji list to all connected clients
    });
});

