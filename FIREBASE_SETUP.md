# Firebase Project Setup Instructions

## Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Sign in with your Google account
3. Click "Create a project" or "Add project"
4. Enter project name: `merkel-view` (or your preferred name)
5. Click "Continue"
6. **Google Analytics**: Choose "Enable Google Analytics" (recommended)
7. Select your Google Analytics account or create new one
8. Click "Create project"
9. Wait for project creation (30-60 seconds)
10. Click "Continue" when done

## Step 2: Enable Authentication
1. In Firebase Console, click "Authentication" in left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Click "Email/Password"
5. Toggle "Enable" to ON
6. Click "Save"
7. **Optional**: Also enable "Google" sign-in:
   - Click "Google"
   - Toggle "Enable" to ON
   - Select your project support email
   - Click "Save"

## Step 3: Create Firestore Database
1. Click "Firestore Database" in left sidebar
2. Click "Create database"
3. **Security rules**: Choose "Start in test mode" (for now)
   - This allows read/write access for 30 days
   - We'll secure it later
4. **Location**: Choose "us-central1" (or closest to your users)
5. Click "Done"
6. Wait for database creation

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```Database location: us-east4
```

## Step 4: Get Firebase Configuration
1. Click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>`
5. **App nickname**: Enter "merkel-view-web"
6. **Optional**: Check "Also set up Firebase Hosting" (recommended)
7. Click "Register app"
8. **IMPORTANT**: Copy the Firebase config object:
```javascript

/// merkel-view-web

const firebaseConfig = {
  apiKey: "AIzaSyDF0CuVLAINPOW3vpe_WeUr3NbTF6V-SSY",
  authDomain: "merkel-view.firebaseapp.com",
  projectId: "merkel-view",
  storageBucket: "merkel-view.firebasestorage.app",
  messagingSenderId: "1088247347834",
  appId: "1:1088247347834:web:ee94e04adf2e2faebc99c3",
  measurementId: "G-PP910K5BM0"
};

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDF0CuVLAINPOW3vpe_WeUr3NbTF6V-SSY",
  authDomain: "merkel-view.firebaseapp.com",
  projectId: "merkel-view",
  storageBucket: "merkel-view.firebasestorage.app",
  messagingSenderId: "1088247347834",
  appId: "1:1088247347834:web:ee94e04adf2e2faebc99c3",
  measurementId: "G-PP910K5BM0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
```
9. Click "Continue to console"

## Step 5: Enable Storage (for photo uploads)
1. Click "Storage" in left sidebar
2. Click "Get started"
3. **IMPORTANT**: You'll see "Upgrade required" message
4. Click "Upgrade project" button
5. **Choose Blaze Plan**:
   - Select "Blaze (Pay as you go)" plan
   - Add a credit card (required but likely won't be charged for demo)
   - Firebase Storage free tier: 5GB storage, 1GB/day downloads
   - Click "Purchase"
6. Wait for upgrade to complete (1-2 minutes)
7. **After upgrade**, click "Storage" again
8. Click "Get started"
9. **Security rules**: Click "Next" (default rules for now)
10. **Location**: Choose "us-east4" EAST-1 (same as your Firestore)
11. Click "Done"

**Storage Costs (Very Low for Demo)**:
- Storage: $0.026/GB/month (first 5GB free)
- Downloads: $0.12/GB (first 1GB/day free)
- For demo with ~50 photos: Likely $0.00/month

## Step 6: Update Firebase Config File
1. Open `/Users/rgriola/Desktop/01_Vibecode/Merkel-View/firebase-config.js`
2. Replace the config object with your actual values:

```javascript
// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // REPLACE WITH YOUR ACTUAL CONFIG
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

## Step 7: Set Up Google Maps API + Geocoding
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (should be listed)
3. Click "APIs & Services" → "Library". xx
4. **Enable Maps JavaScript API:**
   - Search for "Maps JavaScript API" xx 
   - Click "Maps JavaScript API" xx 
   - Click "Enable". xx 
5. **Enable Geocoding API (Required for address search):**
   - Search for "Geocoding API"
   - Click "Geocoding API"  
   - Click "Enable"
6. Go to "APIs & Services" → "Credentials". 
7. Click "Create Credentials" → "API Key". xx 
8. **Copy your API key** (keep it safe!) xx 

AIzaSyCHQECnK2DXcNXIQR0ZfvIEPrAJWIH8JsM

9. Click "Restrict Key" (recommended):
    - **Application restrictions**: Choose "HTTP referrers"
    - Add your domains:
      - `http://localhost:8000/*` ✅
      - `http://127.0.0.1:8000/*` ✅
      - `localhost:8000/*` ✅
      - `your-domain.com/*` (for production)
    - **API restrictions**: Select BOTH:
      - ✅ "Maps JavaScript API"
      - ✅ "Geocoding API" (NEW - Required for address search)
10. Click "Save"

## Step 8: Test Firebase Connection
1. Open your terminal in the Merkel-View folder
2. Run: `python3 -m http.server 8000` (or your preferred local server)
3. Open `http://localhost:8000` in browser
4. Open browser console (F12)
5. Look for Firebase initialization messages
6. Try the login form to test authentication

## Step 9: Security Rules (Important!)
**IMMEDIATE FIX NEEDED**: Update your Firestore security rules to allow user registration:

1. In Firebase Console, go to "Firestore Database"
2. Click "Rules" tab
3. Replace the current rules with these **DEVELOPMENT RULES**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read all locations, write their own
    match /locations/{locationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.addedBy;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.addedBy;
    }
  }
}
```

**TEMPORARY DEVELOPMENT RULES** (Use only for initial testing):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

4. Click "Publish"

**🚨 IMPORTANT**: The temporary rules allow any authenticated user to read/write all data. Use only for development and testing!

## Step 10: Optional - Set Up Hosting
If you enabled Firebase Hosting:

### Install Firebase CLI (Choose ONE method):

**Method 1: Using sudo (Quick fix)**
```bash
sudo npm install -g firebase-tools
```

**Method 2: Fix npm permissions (Recommended)**
```bash
# Create a directory for global packages
mkdir ~/.npm-global

# Configure npm to use the new directory
npm config set prefix '~/.npm-global'

# Add to your shell profile (~/.zshrc for zsh)
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc

# Reload your shell
source ~/.zshrc

# Now install Firebase CLI
npm install -g firebase-tools
```

**Method 3: Use npx (No global install needed)**
```bash
# Use npx instead of global install
npx firebase-tools login
npx firebase-tools init hosting
npx firebase-tools deploy
```

### Continue with hosting setup:
1. Login: `firebase login` (or `npx firebase-tools login`)
2. Initialize: `firebase init hosting` (or `npx firebase-tools init hosting`)
3. Select your project
4. Choose `public` as your public directory
5. Configure as single-page app: Yes
6. Deploy: `firebase deploy` (or `npx firebase-tools deploy`)

## Troubleshooting

### Common Console Errors & Solutions:

**"Cannot use import statement outside a module"**
✅ **Fixed**: Now using Firebase CDN with compat version instead of ES6 modules

**"auth is not defined"**
✅ **Fixed**: Firebase is properly initialized before use, auth available globally

**"initMap is not a function"**
✅ **Fixed**: initMap function is properly defined and made globally available

**"Password field is not contained in a form"**
✅ **Fixed**: Login inputs are now wrapped in a proper `<form>` element

**"Google Maps JavaScript API has been loaded directly without loading=async"**
✅ **Fixed**: Added `loading=async` to the Google Maps script tag

**"InvalidKey" - Google Maps API**
✅ **Fixed**: Using your actual API key (AIzaSyCHQECnK2DXcNXIQR0ZfvIEPrAJWIH8JsM)

### Other Issues:
- **"Project not found"**: Make sure you copied the config correctly
- **"Permission denied"**: Check your Firestore security rules
- **Maps not loading**: Verify your API key and domain restrictions
- **Auth not working**: Check if Email/Password is enabled in Firebase Console
- **Favicon 404**: Add a favicon.ico file to your project root (optional)

## Next Steps
✅ Firebase project created
✅ Authentication enabled  
✅ Firestore database created
✅ Storage enabled
✅ Google Maps API key obtained
✅ Configuration files updated

**Ready for**: HTML/CSS/JS scaffold and Google Maps integration!

---
*Created: June 25, 2025*
*Project: Merkel View Location Intelligence App*
