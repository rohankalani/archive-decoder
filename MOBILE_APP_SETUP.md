# Mobile App Setup with Capacitor

This application is now fully optimized for mobile devices and ready to be built as a native iOS/Android app using Capacitor.

## What's Been Optimized

✅ **Responsive Navigation** - Mobile hamburger menu with slide-out drawer  
✅ **Touch-Friendly UI** - Larger tap targets and optimized spacing  
✅ **Mobile-First Layouts** - Cards, tables, and forms adapt to all screen sizes  
✅ **Safe Area Support** - Proper handling of notched devices (iPhone X, etc.)  
✅ **Capacitor Configuration** - Ready for native app deployment  
✅ **Performance** - Active state feedback and optimized animations  

## Testing on Physical Device/Emulator

To run this app on a physical device or emulator:

### 1. Export to GitHub
Click the "Export to GitHub" button in Lovable to push your code to your own repository.

### 2. Clone & Install
```bash
git clone <your-repo-url>
cd <your-repo-name>
npm install
```

### 3. Add Native Platforms
```bash
# For iOS (requires macOS with Xcode)
npx cap add ios
npx cap update ios

# For Android (requires Android Studio)
npx cap add android
npx cap update android
```

### 4. Build the Web App
```bash
npm run build
```

### 5. Sync to Native Platforms
```bash
npx cap sync
```

### 6. Run on Device/Emulator

**For Android:**
```bash
npx cap run android
```

**For iOS:**
```bash
npx cap run ios
```

Or open the project in the respective IDEs:
- **Android Studio**: `npx cap open android`
- **Xcode**: `npx cap open ios`

## Hot Reload During Development

The app is configured to hot-reload from your Lovable sandbox:
- No need to rebuild after code changes
- Just refresh the app on your device
- Changes made in Lovable appear instantly

To switch to local development:
1. Edit `capacitor.config.ts`
2. Remove or comment out the `server.url` property
3. Run `npx cap sync`

## Requirements

**For iOS Development:**
- macOS with Xcode installed
- iOS device or simulator
- Apple Developer Account (for physical device testing)

**For Android Development:**
- Android Studio installed
- Android device with USB debugging enabled OR Android emulator
- No special account needed for testing

## Troubleshooting

### Build Issues
- Make sure Node.js version is 16 or higher
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Capacitor cache: `npx cap sync --force`

### Device Not Detected
- **Android**: Enable USB debugging in Developer Options
- **iOS**: Trust the computer on your device

### App Not Updating
- Run `npm run build && npx cap sync` after code changes
- For hot reload, make sure `server.url` is set in capacitor.config.ts

## Learn More

📚 [Capacitor Documentation](https://capacitorjs.com/docs)  
📱 [Lovable Mobile Development Guide](https://lovable.dev/blogs/mobile-development)  
🔧 [Running on Physical Devices](https://docs.lovable.dev/features/mobile)

## Native Features

With Capacitor installed, you can now add native capabilities:
- Camera & Photo Library
- Geolocation
- Push Notifications
- Biometric Authentication
- File System Access
- And much more!

Install plugins as needed:
```bash
npm install @capacitor/camera
npm install @capacitor/geolocation
npm install @capacitor/push-notifications
```
