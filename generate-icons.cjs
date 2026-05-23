const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sizes = [56, 112];

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

console.log('\x1b[34mStarting ImageMagick icon generation...\x1b[0m');

sizes.forEach(size => {
    // Calculate proportional dimensions so both sizes look identical
    const scale = size / 112;
    
    const bg = '#2c3e50';
    const bagColor = '#3498db';
    
    // Bag Body (Rounded Rectangle)
    const x1 = Math.round(20 * scale);
    const y1 = Math.round(35 * scale);
    const x2 = Math.round(92 * scale);
    const y2 = Math.round(90 * scale);
    const r = Math.round(8 * scale);
    
    // Bag Handle (Circle stroke)
    const cx = Math.round(56 * scale);
    const cy = Math.round(35 * scale);
    const perimeterY = cy - Math.round(16 * scale); // Defines a radius of 16
    const sw = Math.round(6 * scale);

    // Plus Sign (Two intersecting rectangles)
    const pwW = Math.round(8 * scale);
    const pwH = Math.round(24 * scale);
    
    // Vertical line
    const px1 = Math.round(56 * scale - pwW/2);
    const py1 = Math.round(62 * scale - pwH/2);
    const px2 = px1 + pwW;
    const py2 = py1 + pwH;
    
    // Horizontal line
    const px3 = Math.round(56 * scale - pwH/2);
    const py3 = Math.round(62 * scale - pwW/2);
    const px4 = px3 + pwH;
    const py4 = py3 + pwW;

    const outputPath = path.join(publicDir, `icon-${size}.png`);

    // Construct the ImageMagick CLI command
    const cmd = `magick -size ${size}x${size} xc:"${bg}" ` +
        `-stroke white -strokewidth ${sw} -fill none -draw "circle ${cx},${cy} ${cx},${perimeterY}" ` +
        `-stroke none -fill "${bagColor}" -draw "roundRectangle ${x1},${y1} ${x2},${y2} ${r},${r}" ` +
        `-fill white -draw "rectangle ${px1},${py1} ${px2},${py2}" ` +
        `-fill white -draw "rectangle ${px3},${py3} ${px4},${py4}" ` +
        `"${outputPath}"`;

    try {
        // Execute the command directly in Termux
        execSync(cmd);
        console.log(`\x1b[32m✔ Successfully created:\x1b[0m public/icon-${size}.png`);
    } catch (error) {
        console.error(`\x1b[31mFailed to create public/icon-${size}.png. Ensure ImageMagick is installed.\x1b[0m`);
        console.error(error.message);
    }
});
