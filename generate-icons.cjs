const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// The sizes required by KaiOS
const sizes = [56, 112];

function drawStoreIcon(size) {
    // Create a new canvas of the requested size
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Scale factors to keep proportions identical across 56px and 112px
    const scale = size / 112; 

    // 1. Draw Background (Smooth Dark Blue)
    ctx.fillStyle = '#2c3e50'; 
    // Add slightly rounded corners (common in KaiOS icons)
    const radius = 16 * scale;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();
    // Clip further drawing inside this rounded box
    ctx.clip(); 

    // 2. Draw a subtle diagonal highlight gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // 3. Draw the Store Icon Graphic (A stylized shopping bag with a D-Pad cross)
    
    // Center positioning
    const cx = size / 2;
    const cy = size / 2;

    // Bag Handle
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy - (15 * scale), 14 * scale, Math.PI, 0);
    ctx.stroke();

    // Bag Body
    ctx.fillStyle = '#3498db'; // KaiOS blue accent
    ctx.beginPath();
    const bagW = 60 * scale;
    const bagH = 50 * scale;
    ctx.roundRect(cx - (bagW/2), cy - (5 * scale), bagW, bagH, 8 * scale);
    ctx.fill();

    // White Border around the bag
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4 * scale;
    ctx.stroke();

    // 4. Draw a minimalist D-pad (Plus sign) on the bag to symbolize Games/Apps
    ctx.fillStyle = '#ffffff';
    const crossW = 24 * scale;
    const crossThick = 6 * scale;
    
    // Horizontal line
    ctx.fillRect(cx - (crossW/2), cy + (17 * scale), crossW, crossThick);
    // Vertical line
    ctx.fillRect(cx - (crossThick/2), cy + (17 * scale) - (crossW/2) + (crossThick/2), crossThick, crossW);

    return canvas;
}

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// Generate and save both files
sizes.forEach(size => {
    // Output directly to public/ so it works with Vite
    const fileName = path.join(publicDir, `icon-${size}.png`);
    const canvas = drawStoreIcon(size);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(fileName, buffer);
    
    console.log(`\x1b[32m✔ Successfully created:\x1b[0m ${fileName}`);
});
