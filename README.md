Bryan Sturdivant
COS 498
Midterm Project 
11/7/2025

# Book Nerds Discussion Forum! 

A web application for book lovers to discuss their favorite reads

# Features

- User registration and login with session management
- Discussion board for posting and viewing comments
- Guest and authenticated user support
- Responsive design

# Technologies 

Backend: Node.js, Express.js
Templating: Handlebars
Sessions: express-session
Reverse Proxy: nginx
Containerization: Docker, Docker Compose

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/bryansturdivant/Midterm.git
cd Midterm
```

2. Build and start the containers:
```bash
docker-compose up --build
```

3. Access the application:
```
http://your-server-ip:80
```