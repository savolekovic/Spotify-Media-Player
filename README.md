# Spotify Media Player

A web-based Spotify media player that allows you to control your Spotify playback, search for tracks, and manage your queue.

## Features

- 🎵 **Playback Control**: Play, pause, skip, and control your Spotify playback
- 🔍 **Track Search**: Search for tracks and add them to your queue
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔐 **Secure Authentication**: OAuth 2.0 authentication with Spotify
- 🎨 **Modern UI**: Beautiful, modern interface with Spotify's design language

## Prerequisites

- Java 11 or higher
- Node.js 14 or higher
- Maven
- Spotify Developer Account
- SSL certificates for HTTPS (for localhost development)

## Setup

### 1. Spotify App Configuration

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add `https://localhost:3000` to Redirect URIs
4. Copy your Client ID and Client Secret

### 2. SSL Certificates

For local development, you need SSL certificates:
- `localhost-key.pem` (private key)
- `localhost.pem` (certificate)

Place these files in the project root directory.

### 3. Configuration

Update `backend/src/main/resources/application.properties`:
```properties
spotify.client.id=YOUR_CLIENT_ID
spotify.client.secret=YOUR_CLIENT_SECRET
spotify.redirect.uri=https://localhost:3000
```

### 4. Installation

1. **Install Backend Dependencies:**
   ```bash
   cd backend
   mvn install
   ```

2. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

### 5. Running the Application

**Option 1: Use the batch file (Windows)**
```bash
start-servers.bat
```

**Option 2: Manual startup**
```bash
# Terminal 1 - Backend
cd backend
mvn spring-boot:run

# Terminal 2 - Frontend
cd frontend
node server.js
```

### 6. Access the Application

Open your browser and navigate to: `https://localhost:3000`

**Note**: You may see a security warning because of the self-signed certificate. Click "Advanced" and "Proceed to localhost".

## Usage

1. **Connect to Spotify**: Click "Connect to Spotify" and authorize the application
2. **Control Playback**: Use the play/pause, previous, and next buttons
3. **Search Tracks**: Use the search bar to find and add tracks to your queue
4. **View Current Track**: See what's currently playing with album art and progress

## Project Structure

```
spotify-media-player/
├── backend/                 # Spring Boot backend
│   ├── src/main/java/      # Java source code
│   ├── src/main/resources/ # Configuration files
│   └── pom.xml            # Maven dependencies
├── frontend/               # Node.js frontend
│   ├── index.html         # Main HTML file
│   ├── server.js          # Express server
│   └── package.json       # Node.js dependencies
├── start-servers.bat      # Windows startup script
├── localhost-key.pem      # SSL private key
├── localhost.pem          # SSL certificate
└── README.md              # This file
```

## API Endpoints

### Backend (http://localhost:8080/api/spotify)

- `GET /auth-url` - Get Spotify authorization URL
- `POST /exchange-token` - Exchange authorization code for access token
- `GET /current-playback` - Get current playback state
- `POST /play` - Start playback
- `POST /pause` - Pause playback
- `POST /next` - Skip to next track
- `POST /previous` - Go to previous track
- `GET /search` - Search for tracks
- `POST /add-to-queue` - Add track to queue
- `POST /logout` - Logout user

## Technologies Used

- **Backend**: Spring Boot, Java, Maven
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Express.js
- **Authentication**: OAuth 2.0 with Spotify
- **Database**: H2 (in-memory for development)

## Troubleshooting

### Common Issues

1. **SSL Certificate Errors**: Make sure your SSL certificates are in the project root
2. **Port Already in Use**: Stop other services using ports 8080 or 3000
3. **Authentication Issues**: Clear browser cache and try again
4. **CORS Errors**: Check that the CORS configuration matches your setup

### Debug Mode

The application includes debug buttons for development:
- **Logout (Debug)**: Clear current session
- **Clear All Tokens (Debug)**: Remove all stored tokens
- **Force Logout (Debug)**: Force authentication reset

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes. Please respect Spotify's terms of service and API usage guidelines.

## Support

If you encounter any issues, please check the troubleshooting section or create an issue in the repository.
