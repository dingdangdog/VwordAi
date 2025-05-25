const fs = require('fs');
const path = require('path');
const png2icons = require('png2icons');

async function generatePlatformIcons() {
  const iconsDir = path.join(__dirname, '../icons');
  
  console.log('Generating platform-specific icons...');
  
  try {
    // 生成 macOS .icns 文件
    console.log('\nGenerating macOS .icns file...');
    const pngBuffer = fs.readFileSync(path.join(iconsDir, 'icon-1024.png'));
    const icnsBuffer = png2icons.createICNS(pngBuffer, png2icons.BILINEAR, 0);
    fs.writeFileSync(path.join(iconsDir, 'icon.icns'), icnsBuffer);
    console.log('✓ Created icon.icns for macOS');
    
    // 生成 Windows .ico 文件
    console.log('\nGenerating Windows .ico file...');
    const icoBuffer = png2icons.createICO(pngBuffer, png2icons.BILINEAR, 0, true);
    fs.writeFileSync(path.join(iconsDir, 'icon.ico'), icoBuffer);
    console.log('✓ Created icon.ico for Windows');
    
    console.log('\n🎉 Platform-specific icons generated successfully!');
    console.log('\nGenerated files:');
    console.log('- macOS: icon.icns');
    console.log('- Windows: icon.ico');
    console.log('- Linux: icon.png');
    
  } catch (error) {
    console.error('❌ Error generating platform icons:', error.message);
    console.log('\nFallback: Use online converters to create:');
    console.log('- macOS: Convert icon-1024.png to icon.icns');
    console.log('- Windows: Convert icon-256.png to icon.ico');
    console.log('\nRecommended online tools:');
    console.log('- CloudConvert: https://cloudconvert.com/');
    console.log('- ICO Convert: https://icoconvert.com/');
    console.log('- ICNS Converter: https://iconverticons.com/');
  }
}

generatePlatformIcons().catch(console.error);
