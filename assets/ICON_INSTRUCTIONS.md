# App Icon Integration Instructions

After running the asset generation script, you'll need to update your app.config.js to use these new assets.

Here's what to add:

```javascript
{
  expo: {
    icon: './assets/app-icons/ios/app-store-icon.png',
    splash: {
      image: './assets/splash/splash-1242x2688.png',
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF'
    },
    ios: {
      // Add to existing iOS config
      icon: './assets/app-icons/ios/app-store-icon.png'
    },
    android: {
      // Add to existing Android config
      adaptiveIcon: {
        foregroundImage: './assets/app-icons/android/adaptive-foreground.png',
        backgroundColor: '#FFFFFF'
      }
    }
  }
}
```

The script has generated all the necessary icon and splash screen assets in the following directories:

- iOS icons: `assets/app-icons/ios/`
- Android icons: `assets/app-icons/android/`
- Splash screens: `assets/splash/`
