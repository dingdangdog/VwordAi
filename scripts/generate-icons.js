const fs = require('fs');
const path = require('path');
const svg2img = require('svg2img');

async function generateIcons() {
  const iconsDir = path.join(__dirname, '../icons');
  const baseSvg = fs.readFileSync(path.join(iconsDir, 'icon.svg'), 'utf8');

  // 创建不同尺寸的 SVG 文件
  const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];

  console.log('Generating SVG files...');
  sizes.forEach(size => {
    const svg = baseSvg
      .replace('width="1024"', `width="${size}"`)
      .replace('height="1024"', `height="${size}"`);

    fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), svg);
    console.log(`✓ Created icon-${size}.svg`);
  });

  // 生成 PNG 文件
  console.log('\nGenerating PNG files...');
  for (const size of sizes) {
    try {
      const svgBuffer = Buffer.from(baseSvg.replace('width="1024"', `width="${size}"`).replace('height="1024"', `height="${size}"`));

      await new Promise((resolve, reject) => {
        svg2img(svgBuffer, { width: size, height: size }, (error, buffer) => {
          if (error) {
            reject(error);
          } else {
            fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), buffer);
            console.log(`✓ Created icon-${size}.png`);
            resolve();
          }
        });
      });
    } catch (error) {
      console.error(`✗ Failed to create icon-${size}.png:`, error.message);
    }
  }

  // 创建特定平台的图标文件
  console.log('\nGenerating platform-specific icons...');

  // Linux 图标 (1024x1024 PNG)
  try {
    fs.copyFileSync(path.join(iconsDir, 'icon-1024.png'), path.join(iconsDir, 'icon.png'));
    console.log('✓ Created icon.png for Linux');
  } catch (error) {
    console.error('✗ Failed to create Linux icon:', error.message);
  }

  console.log('\n🎉 Icon generation completed!');
  console.log('\nGenerated files:');
  console.log('- SVG files: icon-16.svg to icon-1024.svg');
  console.log('- PNG files: icon-16.png to icon-1024.png');
  console.log('- Linux icon: icon.png (1024x1024)');
  console.log('\nFor complete platform support, you still need:');
  console.log('- macOS: Convert icon-1024.png to icon.icns');
  console.log('- Windows: Convert icon-256.png to icon.ico (or use existing win.ico)');
  console.log('\nRecommended tools:');
  console.log('- png2icns: https://github.com/idesis-gmbh/png2icns');
  console.log('- Online converters: CloudConvert, ICO Convert');
}

generateIcons().catch(console.error);
