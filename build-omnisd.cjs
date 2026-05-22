const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'release');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

const appZipPath = path.join(outputDir, 'application.zip');
const omnisdPath = path.join(outputDir, 'kaios-store-omnisd.zip');
const distDir = path.join(__dirname, 'dist');

async function addDirectoryToZip(zip, dirPath, basePath = '') {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stats = fs.statSync(fullPath);
        const relativePath = path.join(basePath, file);

        if (stats.isDirectory()) {
            await addDirectoryToZip(zip.folder(file), fullPath, relativePath);
        } else {
            zip.file(file, fs.readFileSync(fullPath));
        }
    }
}

async function createOmniSDPack() {
    if (!fs.existsSync(distDir)) {
        console.error('dist/ directory not found! Run `npm run build` first.');
        process.exit(1);
    }

    console.log('Building application.zip from /dist...');
    const appZip = new JSZip();
    await addDirectoryToZip(appZip, distDir);
    
    const appZipBuffer = await appZip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
    });
    fs.writeFileSync(appZipPath, appZipBuffer);
    console.log('application.zip created successfully!');

    console.log('Creating OmniSD wrapper zip (kaios-store-omnisd.zip)...');
    const omnisdZip = new JSZip();
    
    // Add application.zip
    omnisdZip.file('application.zip', appZipBuffer);

    // Create metadata.json stream
    const metadata = {
        version: 1,
        manifestURL: "app://kaios-store.localhost/manifest.webapp"
    };
    omnisdZip.file('metadata.json', JSON.stringify(metadata, null, 2));

    const omnisdBuffer = await omnisdZip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
    });
    fs.writeFileSync(omnisdPath, omnisdBuffer);

    console.log(`\x1b[32m✔ Successfully built OmniSD package at ${omnisdPath}\x1b[0m`);
    // Clean up intermediate application.zip
    fs.unlinkSync(appZipPath);
}

createOmniSDPack().catch(err => {
    console.error('Error building OmniSD pack:', err);
    process.exit(1);
});
