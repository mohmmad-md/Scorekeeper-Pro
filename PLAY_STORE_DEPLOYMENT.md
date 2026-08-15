# 📱 Deploy Baseball Scorecard to Google Play Store

This guide walks you through converting your Baseball Scorecard web app into an Android app and publishing it on the Google Play Store.

---

## 📋 Prerequisites

| Requirement | Details |
|-------------|---------|
| **Google Play Developer Account** | $25 one-time fee at [play.google.com/console](https://play.google.com/console) |
| **Node.js** | v18+ installed on your machine |
| **Android Studio** | For building the APK/AAB ([download here](https://developer.android.com/studio)) |
| **Java JDK** | Version 17 or higher |

---

## 🚀 Method 1: Using Capacitor (Recommended)

Capacitor wraps your web app in a native Android container. This is the most reliable method.

### Step 1: Build Your Web App

```bash
# In your project directory
npm run build
```

This creates the `dist/` folder with your production-ready web app.

### Step 2: Initialize Capacitor

```bash
# Install Capacitor (already installed in this project)
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init
```

When prompted:
- **App name**: `Scorekeeper Pro`
- **App Package ID**: `com.scorekeeper.pro` (use reverse domain notation)
- **Web asset directory**: `dist`

### Step 3: Add Android Platform

```bash
# Install Android platform
npm install @capacitor/android

# Add Android platform to your project
npx cap add android
```

This creates an `android/` folder with a full Android project.

### Step 4: Sync & Build

```bash
# Copy web assets to the Android project
npx cap sync

# Open in Android Studio
npx cap open android
```

### Step 5: Configure Android App

In Android Studio, open `android/app/src/main/AndroidManifest.xml` and add:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Required permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Scorekeeper Pro"
        android:theme="@style/AppTheme">
        
        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:launchMode="singleTask"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### Step 6: Set App Icon

Replace the default icon:
1. In Android Studio, right-click `res/` → **New** → **Image Asset**
2. Choose your app icon (1024x1024 PNG recommended)
3. Generate for all densities

Or manually replace files in:
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` (72x72)
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` (48x48)
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` (96x96)
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` (144x144)
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192x192)

### Step 7: Build Release AAB

```bash
# In Android Studio:
# Build → Generate Signed Bundle / APK
# Choose "Android App Bundle" (.aab)
# Create a new keystore (save the password!)
# Select "release" build variant
```

Or via command line:

```bash
cd android

# Generate keystore (do this once, save the file and password!)
keytool -genkey -v -keystore scorekeeper-release.keystore -alias scorekeeper -keyalg RSA -keysize 2048 -validity 10000

# Add signing config to android/app/build.gradle:
# (see signing configuration below)

# Build
./gradlew bundleRelease
```

Add to `android/app/build.gradle`:

```gradle
android {
    // ... existing config ...
    
    signingConfigs {
        release {
            storeFile file('scorekeeper-release.keystore')
            storePassword 'YOUR_KEYSTORE_PASSWORD'
            keyAlias 'scorekeeper'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

The AAB file will be at: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 🚀 Method 2: Using Trusted Web Activity (TWA)

TWA is simpler but requires your app to be hosted on HTTPS.

### Step 1: Host Your App

Deploy your web app to a HTTPS domain:
- **Vercel**: `vercel deploy`
- **Netlify**: Drag & drop the `dist/` folder
- **Firebase Hosting**: `firebase deploy`
- **GitHub Pages**: Push to gh-pages branch

### Step 2: Create TWA with Bubblewrap

```bash
# Install Bubblewrap CLI
npm install -g @bubblewrap/cli

# Initialize
bubblewrap init --manifest https://your-domain.com/manifest.json
```

### Step 3: Add manifest.json to your project

Create `public/manifest.json`:

```json
{
  "name": "Scorekeeper Pro - Baseball Scorecard",
  "short_name": "Scorekeeper",
  "description": "Professional baseball scorecard and statistics tracker",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Step 4: Build & Sign

```bash
bubblewrap build
```

This generates a signed APK ready for upload.

---

## 🏪 Publishing to Google Play Store

### Step 1: Create Developer Account

1. Go to [play.google.com/console](https://play.google.com/console)
2. Pay the $25 one-time registration fee
3. Complete your developer profile

### Step 2: Create a New App

1. Click **"Create app"**
2. Enter app name: **"Scorekeeper Pro"**
3. Select default language
4. Choose **App** (not Game, since it's a utility app)
5. Select **Free**

### Step 3: Fill Required Information

#### Store Listing
- **App icon**: 512x512 PNG
- **Feature graphic**: 1024x500 PNG
- **Screenshots**: 
  - Phone: At least 2 screenshots (1080x1920 recommended)
  - Tablet: At least 2 screenshots (1920x1080 recommended)
- **Short description** (80 chars): "Professional baseball scorecard with real-time scoring, stats & PDF export"
- **Full description**: (see template below)

#### App Description Template:
```
Scorekeeper Pro is the ultimate baseball scorecard application for fans, 
coaches, and statisticians. Score games in real-time with an intuitive 
interface, track comprehensive player statistics, and export beautiful 
PDF scorecards.

FEATURES:
⚾ Real-time pitch-by-pitch scoring
📊 Automatic batting & pitching statistics
📋 Traditional paper scorecard grid view
📄 Professional PDF export
🏃 Full base runner management
🔄 Cloud sync with Supabase
📱 Works offline
🌙 Dark & light mode

Perfect for:
• Baseball fans scoring games at the ballpark
• Coaches tracking team statistics
• Scorekeepers for leagues and tournaments
• Anyone who loves the art of baseball scoring

All data is saved automatically. Never lose a game record.
```

### Step 4: Complete Content Rating

1. Go to **App content** → **Content rating**
2. Fill out the IARC questionnaire
3. For a scorecard app, it should receive **"Everyone"** rating

### Step 5: Set Up Privacy Policy

Create a simple privacy policy page and host it. Example:

```html
<h1>Privacy Policy for Scorekeeper Pro</h1>
<p>Last updated: [DATE]</p>
<p>Scorekeeper Pro stores your game data locally on your device and optionally 
syncs to Supabase cloud storage when configured. We do not collect, sell, 
or share any personal data with third parties.</p>
<h2>Data Collection</h2>
<p>- Email address: Used only for authentication</p>
<p>- Game data: Stored on your device and optionally in your Supabase account</p>
<p>- No analytics or tracking</p>
<h2>Contact</h2>
<p>For privacy questions, contact: your-email@example.com</p>
```

### Step 6: Upload Your AAB/APK

1. Go to **Production** (or **Internal testing** for testing first)
2. Click **"Create new release"**
3. Upload your `.aab` file
4. Add release notes
5. Click **"Review release"** → **"Start rollout"**

### Step 7: Complete Data Safety Section

1. Go to **App content** → **Data safety**
2. Answer the questions:
   - Does your app collect or share user data? → **Yes** (email for auth)
   - Is all data encrypted in transit? → **Yes**
   - Can users request data deletion? → **Yes**
   - Data types: Email address, App activity

### Step 8: Review & Publish

1. Check the **Dashboard** for any remaining tasks
2. Once all sections are complete, your app will be reviewed
3. Review typically takes **1-7 days**
4. Once approved, your app goes live! 🎉

---

## 📱 App Icons & Screenshots

### Icon Design Tips
- Use a baseball or diamond icon
- Keep it simple and recognizable
- Blue/green color scheme works well for baseball
- Size: 512x512 PNG with transparent background

### Screenshot Tips
Take screenshots of:
1. **Login screen** - Show the clean auth interface
2. **Game list** - Show saved games
3. **Scoring interface** - Show the diamond and action buttons
4. **Stats view** - Show the statistics tables
5. **PDF export** - Show the exported scorecard

Use Android Studio's emulator or a real device to capture screenshots.

---

## 🔄 Updating Your App

When you make changes to the web app:

```bash
# 1. Rebuild the web app
npm run build

# 2. Sync with Capacitor
npx cap sync

# 3. Open Android Studio
npx cap open android

# 4. Increment version code in android/app/build.gradle:
#    versionCode 2  (increment by 1 each release)
#    versionName "2.0.1"

# 5. Build new AAB
#    Build → Generate Signed Bundle

# 6. Upload to Play Console
#    Production → Create new release → Upload new AAB
```

---

## 💡 Tips for Play Store Success

1. **Test thoroughly** before submitting — use Internal Testing track first
2. **Use a real device** to test — emulator behavior can differ
3. **Handle back button** — Capacitor handles this automatically
4. **Offline support** — Your app already works offline (localStorage)
5. **Keep the AAB small** — Current build is ~1.3MB, which is excellent
6. **Respond to reviews** — Engage with users who leave feedback
7. **Update regularly** — Frequent updates improve store ranking

---

## 🐛 Troubleshooting

### "App not installed" error
- Make sure you're using a release-signed APK/AAB
- Check that the package name is unique

### White screen on launch
- Verify `dist/` folder has content
- Check `capacitor.config.ts` points to `dist` as webDir
- Run `npx cap sync` again

### PDF not downloading on Android
- Capacitor needs a plugin for file system access:
```bash
npm install @capacitor/filesystem
npx cap sync
```

### Back button closes app
- Add to `capacitor.config.ts`:
```typescript
{
  android: {
    onBackPressed: {
      behavior: 'close'
    }
  }
}
```

---

## 📚 Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)
- [Play Store Listing Checklist](https://developer.android.com/distribute/best-practices/launch/store-listing)
- [TWA Documentation](https://developer.chrome.com/docs/android/trusted-web-activity/)

---

## ✅ Pre-Launch Checklist

- [ ] Google Play Developer account created ($25)
- [ ] App built and tested on real Android device
- [ ] App icon designed (512x512)
- [ ] Feature graphic created (1024x500)
- [ ] Screenshots captured (phone + tablet)
- [ ] App description written
- [ ] Privacy policy hosted online
- [ ] Content rating completed
- [ ] Data safety section filled
- [ ] Release AAB generated and signed
- [ ] Internal testing release created
- [ ] App reviewed and approved
- [ ] Production release rolled out

---

**Good luck with your Play Store launch! ⚾📱**
