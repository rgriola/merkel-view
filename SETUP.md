# 🚀 Quick Setup Guide

## After Cloning This Repository

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase
```bash
# Copy the template
cp firebase-config.js.template firebase-config.js

# Edit firebase-config.js with your Firebase project details
```

### 3. Get Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create a new one)
3. Go to Project Settings → General → Your apps
4. Copy the config object and paste it into `firebase-config.js`

### 4. Enable Firebase Services
- **Authentication**: Email/Password
- **Firestore**: Database
- **Storage**: File uploads

### 5. Deploy Security Rules
```bash
firebase deploy --only firestore:rules,storage
```

### 6. Set Up Google Maps
1. Get API key from [Google Cloud Console](https://console.cloud.google.com)
2. Enable APIs: Maps JavaScript API, Geocoding API, Places API
3. Update the API key in `index.html`

### 7. Run the App
```bash
npm start
# or open index.html in your browser
```

## 🔑 Environment Variables
Create these files (they're gitignored for security):
- `firebase-config.js` - Your Firebase configuration
- `.env` - Any additional environment variables

## 📝 Important Notes
- Never commit API keys or sensitive configuration
- Use the provided templates for setup
- See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed instructions
