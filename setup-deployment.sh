#!/bin/bash

echo "========================================"
echo "  SARATHI AI - Deployment Setup"
echo "========================================"
echo

echo "Step 1: Installing EAS CLI..."
npm install -g eas-cli

echo
echo "Step 2: Logging in to Expo..."
eas login

echo
echo "Step 3: Verifying login..."
eas whoami

echo
echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo
echo "Next steps:"
echo "1. Update eas.json with your App Store Connect and Play Store credentials"
echo "2. Run 'eas build --platform ios --profile production' for iOS"
echo "3. Run 'eas build --platform android --profile production' for Android"
echo "4. Follow the DEPLOYMENT_GUIDE.md for detailed instructions"
echo