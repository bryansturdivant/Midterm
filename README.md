# Book Nerds - Secure Web Forum - Final Project

A secure, production-ready web application for book lovers to discuss and chat in real-time. Built with Node.js, Express, SQLite3, and Socket.IO.

**Live Site:** https://bsturdivant.com


## Features

### Implemented Features

**Authentication & Security**
- Secure password hashing using Argon2
- Account lockout after 5 failed login attempts (15-minute lockout period)
- HTTPS encryption via Nginx Proxy Manager with Let's Encrypt SSL
- Session management with SQLite-based session storage
- IP address logging for all login attempts

**User Management**
- Email-based user accounts (unique email required)
- Display names separate from usernames
- User profile page with ability to:
  - Change password (requires current password verification)
  - Change email address (requires current password verification)
  - Change display name
  - Customize profile name color (displays in comments)

**Password Recovery**
- "Forgot Password" functionality
- Secure, time-limited reset tokens (10-minute expiration)
- Email-based password reset via MailerSend API
- Token invalidation after use

**Real-Time Chat**
- Socket.IO-based real-time chat system
- Messages stored in SQLite database
- Display names and profile colors shown in chat
- Timestamps for all messages
- Authentication required to access chat

**Comment System**
- Comment posting with user attribution
- Display names and profile colors shown in comments - Colors don't always update after the comment has already been left 
- Timestamps for all comments
- Maximum comment length validation (500 characters) - Tried to make this work, but it doesn't actually. 

### Partially Implemented Features

**Comment Pagination**
- Code implemented but not functioning properly
- Intended to show 5 comments per page with Previous/Next navigation
- Pagination controls present in UI

**Comment Truncation**
- Code implemented for 200-character preview with "Read More" functionality
- Backend processing complete but display not working as expected

**Profile Color Updates**
- Profile name color customization works for new comments
- Historical comments may not reflect updated colors consistently

## Setup Instructions

### Prerequisites
- Docker and Docker Compose installed
- Domain name with DNS pointing to your server
- MailerSend API account (for password recovery emails)

### Installation

1. **Clone the repository**
```bash
   git clone 
   cd 
```

2. **Create environment file**
   
   Create `nodejs/modules/.env` with the following:
```
   MAILERSEND_API_KEY=your_mailersend_api_key_here
```

3. **Configure Docker Compose**
   
   The `docker-compose.yml` is already configured. Key services:
   - `backend-nodejs`: Node.js application (port 3000)
   - `nginx-proxy-manager`: Reverse proxy for HTTPS (ports 80, 443, 5001)

4. **Start the application**
```bash
   docker-compose up -d --build
```

5. **Configure Nginx Proxy Manager**
   
   Access admin panel at `http://YOUR_SERVER_IP:5001`
   
   Default credentials:
   - Email: `admin@example.com`
   - Password: `changeme`
   
   Add a Proxy Host:
   - Domain: `your-domain.com`
   - Forward Hostname: `backend-nodejs`
   - Forward Port: `3000`
   - Enable "Websockets Support" (required for Socket.IO)
   - Request SSL certificate (Let's Encrypt)
   - Enable "Force SSL"
## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,  -- Argon2 hashed
    display_name TEXT NOT NULL UNIQUE,
    profile_color TEXT NOT NULL DEFAULT '#000000',
    account_lockout TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    password_reset_token TEXT,
    password_reset_expire INTEGER
)
```

### Sessions Table
```sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER REFERENCES users(id)
)
```

### Comments Table
```sql
CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER REFERENCES users(id),
    comment TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Login Attempts Table
```sql
CREATE TABLE login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT NOT NULL,
    username TEXT NOT NULL,
    attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    success INTEGER DEFAULT 0
)
```

### Chat Messages Table
```sql
CREATE TABLE chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    displayName TEXT NOT NULL,
    created_at TEXT NOT NULL
)
```

## Environment Variables

Required in `nodejs/modules/.env`:

| Variable | Description | Example |
|----------|-------------|---------|
| `MAILERSEND_API_KEY` | API key from MailerSend for password reset emails | `mlsn.xxxxx` |

## Security Features

### Password Security
- **Hashing Algorithm:** Argon2 (industry-standard, memory-hard)
- **Password Requirements:**
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- **Storage:** Only hashed passwords stored in database
- **Validation:** Requirements enforced on registration and password changes

### Account Lockout System
- **Trigger:** 5 failed login attempts
- **Duration:** 15-minute lockout
- **Tracking:** All attempts logged with IP address and timestamp
- **Database Storage:** Login attempts stored in `login_attempts` table
- **IP-based:** Lockout applies per IP address + username combination

### HTTPS/SSL
- **Implementation:** Nginx Proxy Manager with Let's Encrypt
- **Certificate:** Auto-renewed SSL certificates
- **Force HTTPS:** All HTTP traffic redirected to HTTPS
- **Websocket Support:** Enabled for Socket.IO real-time chat

### Session Management
- **Storage:** SQLite-based sessions (not in-memory)
- **Middleware:** express-session with custom SQLite store
- **Security:** Session cookie not accessible via JavaScript
- **Expiration:** 24-hour session lifetime

### Password Recovery
- **Token Generation:** Cryptographically secure random tokens (32 bytes)
- **Expiration:** 10-minute token lifetime
- **One-time Use:** Tokens invalidated after successful password reset
- **Email Delivery:** Sent via MailerSend API with reset link

## API Documentation

### Authentication Endpoints

**POST /register**
- Creates new user account
- Body: `{ username, email, password, display_name, profileColor }`
- Validates password requirements and unique email/username
- Returns: Redirect to login page

**POST /login**
- Authenticates user and creates session
- Body: `{ username, password }`
- Implements account lockout after failed attempts
- Returns: Redirect to comments page or error

**GET /logout**
- Destroys user session
- Returns: Redirect to home page

### Password Recovery Endpoints

**POST /forgot-password**
- Generates password reset token and sends email
- Body: `{ email }`
- Returns: Success message (regardless of email existence for security)

**POST /reset-password**
- Resets password using valid token
- Body: `{ token, password, confirmPassword }`
- Validates token, password requirements, and password match
- Returns: Redirect to login with success message

### Profile Management Endpoints

**GET /profile**
- Displays user profile page
- Requires: Active session
- Returns: Profile page with user data

**POST /profile**
- Updates user password, email, or display name
- Body (password): `{ currentPassword, newPassword }`
- Body (email): `{ currentPasswordEmail, newEmail }`
- Body (display name): `{ displayName }`
- Requires: Current password verification for password/email changes
- Returns: Updated profile page with success/error message

**POST /profile/color**
- Updates user's profile name color
- Body: `{ profileColor }`
- Returns: Redirect to profile page

### Comment Endpoints

**GET /comments**
- Displays paginated comments
- Query params: `?page=<number>` (default: 1)
- Returns: Comment list with pagination controls

**POST /comments**
- Creates new comment
- Body: `{ comment }`
- Validates: User authentication, comment length (max 500 chars)
- Returns: Redirect to comments page

### Chat Endpoints

**GET /chat**
- Displays real-time chat interface
- Requires: Active session
- Returns: Chat page with message history

### Socket.IO Events

**Event: 'connection'**
- Triggered when user connects to chat
- Authenticates user via session
- Disconnects if not authenticated

**Event: 'chat'**
- Client → Server: Sends new chat message
- Body: `{ message }`
- Server → All Clients: Broadcasts message with user info
- Response: `{ user, message, timestamp }`