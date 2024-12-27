const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');
const socket = io();

let emojisOnCanvas = [];

let checkboxStates = new Map();

// Constants for gravitational pull
const GRAVITY_CONSTANT = 0.1;
const blackHoleX = canvas.width / 2;
const blackHoleY = canvas.height / 2;
const blackHoleRadius = 30;

// Calculate gravitational pull on an emoji
function calculateGravitationalPull(emoji) {
    const dx = blackHoleX - emoji.x;
    const dy = blackHoleY - emoji.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Prevent division by zero and limit the pull for very close distances
    const force = distance > 5 ? GRAVITY_CONSTANT / (distance * distance) : 0;

    return {
        forceX: dx * force,
        forceY: dy * force
    };
}

// Draw the black hole with glowing effect
function drawBlackHole() {
    const blackHoleRadius = 180;
    const borderThickness = 2;
    const borderColor = '#360342';
    const gradient = ctx.createRadialGradient(blackHoleX, blackHoleY, 0, blackHoleX, blackHoleY, blackHoleRadius);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(blackHoleX, blackHoleY, blackHoleRadius, 0, Math.PI * 2, false);
    ctx.fill();

    // Draw the border
    ctx.lineWidth = borderThickness;
    ctx.strokeStyle = borderColor;
    ctx.stroke();
}

// Draw emojis
function drawEmojis() {
    emojisOnCanvas.forEach((emoji) => {
        ctx.font = '30px Arial';
        ctx.fillText(emoji.emoji_symbol, emoji.x, emoji.y);
    });
}

// Check if emoji is inside the black hole
function checkCollision(emoji) {
    const dx = blackHoleX - emoji.x;
    const dy = blackHoleY - emoji.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If the emoji is inside the black hole's radius, disable it
    if (distance <= blackHoleRadius) {
        emoji.vx = 0; // Stop horizontal movement
        emoji.vy = 0; // Stop vertical movement
        emoji.isDisabled = true;
        return false;
    }
    return true;
}

// Update emoji positions based on gravitational pull
function updateEmojiPositions() {
    emojisOnCanvas.forEach((emoji) => {
        if (checkCollision(emoji)) {
            const { forceX, forceY } = calculateGravitationalPull(emoji);
            emoji.vx += forceX;
            emoji.vy += forceY;
            emoji.x += emoji.vx;
            emoji.y += emoji.vy;
        }
    });

    // Optionally, remove disabled emojis if you want to clean up the array
    emojisOnCanvas = emojisOnCanvas.filter((emoji) => !emoji.isDisabled);
}

// Function to draw a circle for debugging
function drawCircle(x, y, radius = 3, color = 'red') {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}

// Bind event listener to checkboxes
document.querySelectorAll('table input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
        drawLinesToBlackHole();
    });
});

// Function to draw a dotted line
function drawLine(x1, y1, x2, y2, color = 'yellow', width = 1, dashPattern = [3, 3]) {
    ctx.beginPath();
    ctx.setLineDash(dashPattern);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.setLineDash([]);
}

// Update the drawLinesToBlackHole function to verify coordinates
function drawLinesToBlackHole() {
    const emojiWidth = 30; // Approximate width of the emoji

    // Get all checkboxes from the table
    const checkboxes = document.querySelectorAll('table input[type="checkbox"]');

    // Check if any checkbox is selected
    const isAnyCheckboxSelected = Array.from(checkboxes).some(checkbox => checkbox.checked);

    if (isAnyCheckboxSelected) {
        Array.from(checkboxes).filter(checkbox => checkbox.checked).forEach((checkbox) => {
            const emojiId = checkbox.dataset.id;
            const emojiX = checkbox.dataset.x;
            const emojiY = checkbox.dataset.y;

            const emojiCenterX = emojiX + emojiWidth / 2;
            const emojiCenterY = emojiY;
            drawCircle(emojiCenterX, emojiCenterY);
            drawLine(blackHoleX, blackHoleY, emojiCenterX, emojiCenterY, 'yellow', 1, [3, 3]);
        });
    }

    emojisOnCanvas.forEach((emoji) => {
        // Calculate the center of the emoji
        const emojiCenterX = emoji.x + emojiWidth / 2;
        const emojiCenterY = emoji.y;
        drawCircle(emojiCenterX, emojiCenterY);
        drawLine(blackHoleX, blackHoleY, emojiCenterX, emojiCenterY, 'yellow', 1, [3, 3]);
    });
}

setInterval(updateEmojiPositions, 16); // Update every 16ms (~60fps)

let rotationAngle = 0;
// Function to draw the white border with rotation
function drawWhiteBorder() {
    const borderThickness = 2;
    const borderColor = '#7b767cc9';

    // Save the current canvas state
    ctx.save();

    // Move the origin to the center of the canvas (so rotation happens around the center)
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Set up the dashed line pattern [dash length, gap length]
    ctx.setLineDash([4, 4]);

    // Rotate the canvas clockwise by the desired angle (e.g., update this continuously)
    ctx.rotate(rotationAngle);  // Rotate by the updated angle

    // Draw the dashed border
    ctx.lineWidth = borderThickness;
    ctx.strokeStyle = borderColor;
    ctx.beginPath();
    ctx.arc(0, 0, blackHoleRadius + borderThickness / 2, 0, Math.PI * 2); // Border around the black hole
    ctx.stroke();

    // Restore the canvas state to avoid affecting other drawings
    ctx.restore();

    // Reset line dash for other drawings
    ctx.setLineDash([]);  // Reset to solid line for subsequent drawings
}

// Update the rotation angle for the clockwise rotation effect
function updateRotation() {
    rotationAngle += Math.PI / 180;  // Increase by 1 degree per frame (adjust for speed)
    if (rotationAngle >= Math.PI * 2) {
        rotationAngle = 0;  // Reset to 0 after a full rotation
    }
}

// Update the canvas
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBlackHole();
    drawWhiteBorder();  // This border will rotate
    updateRotation();
    drawLinesToBlackHole(); // Draw lines connecting emojis to the black hole
    drawEmojis();
    updateEmojiPositions(); // Apply gravitational pull
    requestAnimationFrame(render);
}

render();

// Handle emoji dragging
const emojis = document.querySelectorAll('.emoji');
emojis.forEach((emoji) => {
    emoji.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('emoji_symbol', emoji.textContent);
    });
});

canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const emoji_symbol = e.dataTransfer.getData('emoji_symbol');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + 10;
    const y = e.clientY - rect.top + 10;

    // Store the emoji with its x, y, and axis data
    emojisOnCanvas.push({ emoji_symbol, x, y, vx: 0, vy: 0 });

    // Save to MySQL database
    const data = {
        emoji_symbol: emoji_symbol,
        x: Number(x.toFixed(3)),
        y: Number(y.toFixed(3))
    };

    // Send data to the backend API via POST
    fetch('/api/saveEmoji', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(savedEmoji => {
            const tableBody = document.querySelector('#dataTable tbody');
            if (tableBody) {
                insertRow(tableBody, savedEmoji);
            }
        });
});

fetch('/api/data')
.then(response => response.json())
.then(data => {
        const tableBody = document.getElementById('dataTable').getElementsByTagName('tbody')[0];

        // Save current checkbox states before updating
        document.querySelectorAll('.row-checkbox').forEach(checkbox => {
            checkboxStates.set(checkbox.dataset.id, checkbox.checked);
        });

        tableBody.innerHTML = '';

        data.forEach(emoji => {
            insertRow(tableBody, emoji);
        });
    updateSelectedCount();
});

function insertRow(tableBody, emoji){
    const row = tableBody.insertRow();
    const isChecked = checkboxStates.get(emoji.id.toString()) || false;
    row.innerHTML = `
        <td>${emoji.id}</td>
        <td>${emoji.x}</td>
        <td>${emoji.y}</td>
        <td>${emoji.emoji_symbol}</td>
        <td class="checkbox-column">
            <input type="checkbox" class="row-checkbox" data-id="${emoji.id}" data-x="${emoji.x}" data-y="${emoji.y}" ${isChecked ? 'checked' : ''}>
        </td>
    `;
    // Add event listener to checkbox for tracking selection
    row.querySelector('.row-checkbox').addEventListener('change', (e) => {
        checkboxStates.set(emoji.id.toString(), e.target.checked);
        updateSelectedCount();
    });
}

// Function to update the count of selected emojis
function updateSelectedCount() {
    const selectedCount = Array.from(document.querySelectorAll('.row-checkbox'))
        .filter(checkbox => checkbox.checked)
        .length;
    document.getElementById('selectedCount').textContent = `Selected: ${selectedCount}`;
}

// Function to handle the "Select All" checkbox
document.getElementById('selectAll').addEventListener('change', function () {
    const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
    });
    updateSelectedCount();
});