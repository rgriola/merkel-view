# Merkel View - Location Intelligence Platform

A collaborative web application for managing and visualizing location data with real-time features, built with Firebase and Google Maps.

![Merkel View](https://img.shields.io/badge/Status-In%20Development-yellow)
![Firebase](https://img.shields.io/badge/Firebase-v9-orange)
![Google Maps](https://img.shields.io/badge/Google%20Maps-API-blue)

## 🌟 Features

### Core Functionality
- **🔐 User Authentication** - Secure login/registration with Firebase Auth
- **🗺️ Interactive Maps** - Google Maps integration with custom markers
- **📍 Location Management** - Add, edit, delete locations with rich metadata
- **📸 Photo Uploads** - Attach photos to locations with Firebase Storage
- **🔍 Smart Search** - Address search with Google Places autocomplete
- **🏷️ Categorization** - Organize locations by type (restaurants, hotels, etc.)
- **📱 Responsive Design** - Mobile-friendly interface

### Advanced Features
- **🎯 Map Clustering** - Efficient rendering of multiple markers
- **🔄 Real-time Updates** - Live synchronization across users
- **📊 Analytics Dashboard** - Location statistics and insights
- **💾 Data Export/Import** - JSON backup and restore functionality
- **🔒 Security Rules** - Robust Firestore and Storage security

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Firebase project with Authentication, Firestore, and Storage enabled
- Google Maps API key with Maps JavaScript API, Geocoding API, and Places API

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rgriola/merkel-view.git
   cd merkel-view
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the application**
   ```bash
   npm run setup
   ```
   This will guide you through setting up your Firebase and Google Maps credentials.

4. **Validate configuration**
   ```bash
   npm run validate-config
   ```

5. **Start development server**
   ```bash
   npm start
   ```
   
6. **Open in browser**
   ```
   http://localhost:3000
   ```

### Alternative Manual Setup

If you prefer to configure manually:

1. **Copy the template**
   ```bash
   cp config.js.template config.js
   ```

2. **Edit config.js** with your Firebase and Google Maps credentials

3. **Deploy security rules** (optional, for production)
   ```bash
   firebase deploy --only firestore:rules,storage
   ```

## 🏗️ Project Structure

```
merkel-view/
├── index.html              # Main HTML file
├── style.css               # Core styles
├── enhanced-ui.css         # Advanced UI components
├── app.js                  # Main application logic
├── firebase-config.js      # Firebase configuration
├── js/
│   ├── modules/
│   │   ├── auth.js         # Authentication management
│   │   ├── locations.js    # Location CRUD operations
│   │   ├── map.js          # Map management
│   │   └── features.js     # Advanced features
│   └── utils/
│       └── performance.js  # Performance optimizations
├── firestore.rules         # Firestore security rules
├── storage.rules           # Storage security rules
└── docs/                   # Documentation
```

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication, Firestore, and Storage
3. Configure security rules using the provided `firestore.rules` and `storage.rules`

### Google Maps Setup
1. Get API key from Google Cloud Console
2. Enable required APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API
3. Configure API restrictions for security

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed setup instructions.

## 📝 Usage

### Adding Locations
- **Map Click**: Click anywhere on the map to add a location
- **Address Search**: Use the search box to find and add specific addresses
- **Bulk Import**: Import locations from JSON files

### Managing Locations
- **View**: Browse locations in the sidebar or map
- **Edit**: Click edit button on locations you own
- **Delete**: Remove locations with confirmation
- **Filter**: Search and filter by category, owner, or date

### Photo Management
- **Upload**: Add photos when creating/editing locations
- **View**: Click photos to view in full-screen modal
- **Storage**: Photos are securely stored in Firebase Storage

## 🔒 Security

This application implements comprehensive security measures:

- **Authentication**: Firebase Auth with email/password
- **Authorization**: Users can only edit their own locations
- **Data Validation**: Server-side validation with Firestore rules
- **File Security**: Photo uploads restricted by type and size
- **API Security**: Google Maps API with domain restrictions

## 🚀 Deployment

### GitHub Pages (Automatic)

This project is configured for automatic deployment to GitHub Pages:

1. **Set up GitHub Secrets** (in your GitHub repository settings):
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN` 
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
   - `GOOGLE_MAPS_API_KEY`

2. **Push to main branch**:
   ```bash
   git push origin main
   ```

3. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Select "Deploy from a branch"
   - Choose "gh-pages" branch
   - Your app will be available at: `https://yourusername.github.io/merkel-view`

### Firebase Hosting
```bash
firebase init hosting
firebase deploy
```

### Vercel
```bash
vercel --prod
```

### Netlify
```bash
netlify deploy --prod
```

## 🛠️ Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## 📚 API Reference

### Core Classes
- `AuthManager` - Handle user authentication
- `LocationManager` - CRUD operations for locations
- `MapManager` - Google Maps integration
- `AdvancedFeatures` - Enhanced functionality

### Key Methods
- `saveLocation(data, photo)` - Save new location
- `updateLocation(id, data)` - Update existing location
- `deleteLocation(id)` - Remove location
- `applyFilters(filters)` - Filter location results

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Firebase for backend services
- Google Maps for mapping functionality
- Contributors and testers

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the [documentation](docs/)
- Review [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for setup help

---

Built with ❤️ using Firebase and Google Maps
