# SARATHI AI - App Store Deployment Guide

## 🚀 Deployment Overview

This guide will help you deploy the SARATHI AI app to both iOS App Store and Google Play Store using Expo Application Services (EAS).

## 📋 Prerequisites

### For iOS Deployment:
- Apple Developer Program membership ($99/year)
- Xcode installed on macOS
- App Store Connect account

### For Android Deployment:
- Google Play Console account ($25 one-time fee)
- Google Service Account for automated publishing

### General Requirements:
- Expo account
- Node.js and npm installed
- EAS CLI installed (`npm install -g eas-cli`)

## 🔐 Step 1: Expo Account Setup

### Login to Expo:
```bash
eas login
```

Follow the prompts to authenticate with your Expo account.

### Verify Login:
```bash
eas whoami
```

## 📱 Step 2: iOS App Store Deployment

### 2.1 Configure App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Create a new app with:
   - Bundle ID: `com.swardesi.sarathiai`
   - Name: SARATHI AI
   - Primary Language: English

### 2.2 Update EAS Configuration

Edit `eas.json` and update the submit section with your details:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890"  // From App Store Connect
      }
    }
  }
}
```

### 2.3 Build for iOS

```bash
# Build for production
eas build --platform ios --profile production

# Or build for internal testing
eas build --platform ios --profile preview
```

### 2.4 Submit to App Store

```bash
# Submit the build to App Store Connect
eas submit --platform ios --profile production
```

## 🤖 Step 3: Android Play Store Deployment

### 3.1 Configure Google Play Console

1. Go to [Google Play Console](https://play.google.com/console/)
2. Create a new app with:
   - Package name: `com.swardesi.sarathiai`
   - App name: SARATHI AI

### 3.2 Set up Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new service account with Play Store publishing permissions
3. Download the JSON key file
4. Place it in your project root as `google-service-account-key.json`

### 3.3 Update EAS Configuration

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account-key.json",
        "track": "internal"  // Change to "production" for live release
      }
    }
  }
}
```

### 3.4 Build for Android

```bash
# Build for production (App Bundle)
eas build --platform android --profile production

# Or build for internal testing (APK)
eas build --platform android --profile preview
```

### 3.5 Submit to Play Store

```bash
# Submit to internal testing track
eas submit --platform android --profile production
```

## 🧪 Step 4: Testing Builds

### Internal Testing Distribution

```bash
# iOS - TestFlight
eas build --platform ios --profile preview
eas submit --platform ios --profile preview

# Android - Internal Testing
eas build --platform android --profile preview
eas submit --platform android --profile preview
```

## 📊 Step 5: Production Release

### App Store Review Process

1. **iOS**: Submit for review in App Store Connect
   - Review typically takes 1-3 days
   - Prepare screenshots and app description
   - Ensure compliance with App Store guidelines

2. **Android**: Publish to production track
   - No review process for Android
   - Publishing takes effect immediately
   - Users can download from Play Store

## 🔧 Troubleshooting

### Common Issues:

1. **Bundle ID Mismatch**: Ensure bundle IDs match between code and app stores
2. **Missing Permissions**: Check app permissions in both stores
3. **Build Failures**: Check Expo documentation for build error solutions
4. **Submission Errors**: Verify account permissions and API keys

### Useful Commands:

```bash
# Check build status
eas build:list

# Check submission status
eas submit:list

# View build logs
eas build:view <build-id>

# Cancel a build
eas build:cancel <build-id>
```

## 📞 Support

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Documentation](https://docs.expo.dev/eas/)
- [App Store Connect Help](https://developer.apple.com/support/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)

## 🎯 Next Steps

1. Test the app thoroughly on both platforms
2. Prepare marketing materials (screenshots, descriptions)
3. Set up analytics and crash reporting
4. Plan for future updates and maintenance

---

**Note**: This guide assumes you have the necessary developer accounts and have configured your app properly. Always test builds on physical devices before submitting to app stores.