const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Create necessary directories
const directories = [
  "assets/app-icons/ios",
  "assets/app-icons/android",
  "assets/splash",
];

directories.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// iOS icon sizes
const iosIconSizes = [
  { size: 20, scales: [1, 2, 3] },
  { size: 29, scales: [1, 2, 3] },
  { size: 40, scales: [1, 2, 3] },
  { size: 60, scales: [2, 3] },
  { size: 76, scales: [1, 2] },
  { size: 83.5, scales: [2] },
  { size: 1024, scales: [1] }, // App Store
];

// Android icon sizes
const androidIconSizes = [
  { name: "mdpi", size: 48 },
  { name: "hdpi", size: 72 },
  { name: "xhdpi", size: 96 },
  { name: "xxhdpi", size: 144 },
  { name: "xxxhdpi", size: 192 },
];

// Splash screen sizes
const splashSizes = [
  { width: 320, height: 480 }, // iPhone 4
  { width: 640, height: 960 }, // iPhone 4 Retina
  { width: 640, height: 1136 }, // iPhone 5
  { width: 750, height: 1334 }, // iPhone 6/7/8
  { width: 828, height: 1792 }, // iPhone XR
  { width: 1125, height: 2436 }, // iPhone X/XS
  { width: 1242, height: 2688 }, // iPhone XS Max
  { width: 1536, height: 2048 }, // iPad
  { width: 1668, height: 2224 }, // iPad Pro 10.5"
  { width: 2048, height: 2732 }, // iPad Pro 12.9"
];

// Source SVG files
const fullLogoPath = path.join(__dirname, "../assets/images/logo.svg");
const smallLogoPath = path.join(__dirname, "../assets/images/logo-small.svg");

// Background color for icons and splash
const backgroundColor = "#FFFFFF";

// Generate iOS icons
async function generateIosIcons() {
  console.log("Generating iOS icons...");

  for (const icon of iosIconSizes) {
    for (const scale of icon.scales) {
      const size = Math.round(icon.size * scale);
      const outputPath = path.join(
        __dirname,
        `../assets/app-icons/ios/icon-${icon.size}x${icon.size}@${scale}x.png`
      );

      try {
        // Use small logo for smaller sizes and full logo for larger sizes
        const sourcePath = size <= 40 ? smallLogoPath : fullLogoPath;

        // Calculate padding (less padding for larger icons)
        const padding = size <= 40 ? 0.15 : 0.1;
        const paddingPixels = Math.round(size * padding);
        const imageSize = size - paddingPixels * 2;

        // Create a background with the target size
        const image = sharp({
          create: {
            width: size,
            height: size,
            channels: 4,
            background: backgroundColor,
          },
        });

        // Resize the logo with proper aspect ratio
        const logo = await sharp(sourcePath)
          .resize({
            width: imageSize,
            height: imageSize,
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .toBuffer();

        // Overlay the logo on the background
        await image
          .composite([
            {
              input: logo,
              gravity: "center",
            },
          ])
          .png()
          .toFile(outputPath);

        console.log(`Created: ${outputPath}`);
      } catch (error) {
        console.error(`Error creating ${outputPath}:`, error);
      }
    }
  }

  // Create App Store icon
  const appStoreIconPath = path.join(
    __dirname,
    "../assets/app-icons/ios/app-store-icon.png"
  );

  try {
    // Create a 1024x1024 icon with the full logo
    const size = 1024;
    const padding = 0.1;
    const paddingPixels = Math.round(size * padding);
    const imageSize = size - paddingPixels * 2;

    // Create a background
    const image = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: backgroundColor,
      },
    });

    // Resize the logo
    const logo = await sharp(fullLogoPath)
      .resize({
        width: imageSize,
        height: imageSize,
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();

    // Overlay the logo on the background
    await image
      .composite([
        {
          input: logo,
          gravity: "center",
        },
      ])
      .png()
      .toFile(appStoreIconPath);

    console.log("Created App Store icon");
  } catch (error) {
    console.error("Error creating App Store icon:", error);
  }
}

// Generate Android icons
async function generateAndroidIcons() {
  console.log("Generating Android icons...");

  for (const icon of androidIconSizes) {
    const outputPath = path.join(
      __dirname,
      `../assets/app-icons/android/icon-${icon.name}.png`
    );

    try {
      const size = icon.size;
      const padding = 0.15;
      const paddingPixels = Math.round(size * padding);
      const imageSize = size - paddingPixels * 2;

      // Create a background
      const image = sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: backgroundColor,
        },
      });

      // Resize the logo
      const logo = await sharp(smallLogoPath)
        .resize({
          width: imageSize,
          height: imageSize,
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer();

      // Overlay the logo on the background
      await image
        .composite([
          {
            input: logo,
            gravity: "center",
          },
        ])
        .png()
        .toFile(outputPath);

      console.log(`Created: ${outputPath}`);
    } catch (error) {
      console.error(`Error creating ${outputPath}:`, error);
    }
  }

  // Create adaptive icons
  const adaptiveForegroundPath = path.join(
    __dirname,
    "../assets/app-icons/android/adaptive-foreground.png"
  );
  const adaptiveBackgroundPath = path.join(
    __dirname,
    "../assets/app-icons/android/adaptive-background.png"
  );

  try {
    // Foreground (logo with padding)
    const size = 512;
    const padding = 0.2;
    const paddingPixels = Math.round(size * padding);
    const imageSize = size - paddingPixels * 2;

    // Create a transparent background
    const foreground = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });

    // Resize the logo
    const logo = await sharp(smallLogoPath)
      .resize({
        width: imageSize,
        height: imageSize,
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();

    // Overlay the logo on the transparent background
    await foreground
      .composite([
        {
          input: logo,
          gravity: "center",
        },
      ])
      .png()
      .toFile(adaptiveForegroundPath);

    // Background (solid color)
    await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: backgroundColor,
      },
    })
      .png()
      .toFile(adaptiveBackgroundPath);

    console.log("Created adaptive icons");
  } catch (error) {
    console.error("Error creating adaptive icons:", error);
  }
}

// Generate splash screens
async function generateSplashScreens() {
  console.log("Generating splash screens...");

  for (const splash of splashSizes) {
    const outputPath = path.join(
      __dirname,
      `../assets/splash/splash-${splash.width}x${splash.height}.png`
    );

    // Calculate logo size (60% of the width for proper aspect ratio)
    const logoWidth = Math.round(splash.width * 0.6);

    try {
      // Create a white background
      const image = sharp({
        create: {
          width: splash.width,
          height: splash.height,
          channels: 4,
          background: backgroundColor,
        },
      });

      // Add the logo in the center
      const logo = await sharp(fullLogoPath)
        .resize({
          width: logoWidth,
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer();

      await image
        .composite([
          {
            input: logo,
            gravity: "center",
          },
        ])
        .png()
        .toFile(outputPath);

      console.log(`Created: ${outputPath}`);
    } catch (error) {
      console.error(`Error creating ${outputPath}:`, error);
    }
  }
}

// Update app.config.js
function updateAppConfig() {
  console.log("Updating app.config.js...");

  const configPath = path.join(__dirname, "../app.config.js");
  let configContent = fs.readFileSync(configPath, "utf8");

  // Define new icon and splash paths
  const newConfig = {
    icon: "./assets/app-icons/ios/app-store-icon.png",
    splash: {
      image: "./assets/splash/splash-1242x2688.png",
      resizeMode: "contain",
      backgroundColor: "#FFFFFF",
    },
    ios: {
      icon: "./assets/app-icons/ios/app-store-icon.png",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/app-icons/android/adaptive-foreground.png",
        backgroundColor: "#FFFFFF",
      },
    },
  };

  // Save path for final steps
  const instructionsPath = path.join(
    __dirname,
    "../assets/ICON_INSTRUCTIONS.md"
  );
  fs.writeFileSync(
    instructionsPath,
    `# App Icon Integration Instructions

After running the asset generation script, you'll need to update your app.config.js to use these new assets.

Here's what to add:

\`\`\`javascript
{
  expo: {
    icon: '${newConfig.icon}',
    splash: {
      image: '${newConfig.splash.image}',
      resizeMode: '${newConfig.splash.resizeMode}',
      backgroundColor: '${newConfig.splash.backgroundColor}'
    },
    ios: {
      // Add to existing iOS config
      icon: '${newConfig.ios.icon}'
    },
    android: {
      // Add to existing Android config
      adaptiveIcon: {
        foregroundImage: '${newConfig.android.adaptiveIcon.foregroundImage}',
        backgroundColor: '${newConfig.android.adaptiveIcon.backgroundColor}'
      }
    }
  }
}
\`\`\`

The script has generated all the necessary icon and splash screen assets in the following directories:

- iOS icons: \`assets/app-icons/ios/\`
- Android icons: \`assets/app-icons/android/\`
- Splash screens: \`assets/splash/\`
`
  );

  console.log(`Instructions written to: ${instructionsPath}`);
}

// Run all functions
async function generateAllAssets() {
  try {
    await generateIosIcons();
    await generateAndroidIcons();
    await generateSplashScreens();
    updateAppConfig();
    console.log("All assets generated successfully!");
  } catch (error) {
    console.error("Error generating assets:", error);
  }
}

generateAllAssets();
