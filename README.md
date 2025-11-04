# Audit Tools Dashboard

A comprehensive web application for security auditors and professionals, providing a unified dashboard for audit tools, project management, and collaboration.

## 🚀 Features

- **Professional Audit Tools**: A curated collection of audit and security analysis tools
- **User Management**: Secure authentication with JWT tokens and role-based access
- **Project Management**: Track and organize audit projects with detailed results
- **Admin Panel**: Easy tool management and user administration
- **Modern Design**: Clean, animejs.com-inspired interface with smooth animations
- **Responsive**: Works seamlessly on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

### Frontend
- **React 18** with modern hooks and patterns
- **Vite** for fast development and building
- **React Router** for navigation
- **React Query** for server state management
- **React Hook Form** for form validation
- **Framer Motion** for animations
- **Axios** for API communication

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** authentication with refresh tokens
- **bcryptjs** for password hashing
- **Multer** for file uploads
- **Helmet** for security headers
- **Rate limiting** for API protection

## 📋 Prerequisites

- **Node.js** 16.0 or higher
- **npm** 8.0 or higher
- **MongoDB** 4.4 or higher

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd Excel_Tools
```

### 2. Install Dependencies

```bash
npm run install-deps
```

### 3. Environment Configuration

1. Copy the environment example files:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

2. Configure your environment variables:

**Server Environment (server/.env):**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/audit-tools

# JWT Secrets (change these in production!)
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Server
PORT=5000
CLIENT_URL=http://localhost:3000
```

**Client Environment (client/.env):**
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# On Windows
net start MongoDB
```

### 5. Start the Application

```bash
# Start both frontend and backend concurrently
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### 6. Create Initial Admin User

The application automatically creates a default admin user on first startup:
- **Email**: admin@audittools.com
- **Password**: admin123

**Important**: Change this password immediately after first login!

## 📁 Project Structure

```
Excel_Tools/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services
│   │   ├── styles/        # CSS and styling
│   │   └── App.jsx        # Main App component
│   └── package.json
├── server/                # Node.js backend
│   ├── src/
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   └── app.js         # Main server file
│   └── tools/             # HTML audit tools
├── docs/                  # Documentation
├── package.json           # Root package.json
└── README.md
```

## 🔧 Development

### Running Individually

```bash
# Start backend only
npm run server

# Start frontend only
npm run client
```

### Building for Production

```bash
# Build frontend
npm run build

# Start production server
npm start
```

## 🛡️ Security Features

- **Password Security**: bcrypt with 12 salt rounds
- **JWT Authentication**: Access tokens (15min) + Refresh tokens (7 days)
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive validation with express-validator
- **Security Headers**: Helmet.js for security headers
- **CORS**: Proper cross-origin resource sharing configuration

## 🔌 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Tool Endpoints

- `GET /api/tools` - Get all tools
- `GET /api/tools/:id` - Get specific tool
- `POST /api/tools/:id/launch` - Launch a tool

### Project Endpoints

- `GET /api/projects` - Get user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get specific project
- `PUT /api/projects/:id` - Update project

### Admin Endpoints

- `GET /api/admin/stats` - Get admin statistics
- `GET /api/admin/users` - Manage users
- `GET /api/admin/tools` - Manage tools

## 🎨 Adding New Tools

### Method 1: Admin Panel (Recommended)

1. Login as admin
2. Navigate to Admin Panel
3. Use the tool upload form to add new HTML tools

### Method 2: Direct File Addition

1. Add your HTML tool to `server/tools/`
2. Use the admin API to register the tool in the database

### Tool Requirements

Tools should be self-contained HTML files with:
- Proper HTML5 structure
- Internal CSS styling
- JavaScript functionality
- Responsive design

## 🧪 Testing

### Running Tests

```bash
# Run backend tests
cd server && npm test

# Run frontend tests
cd client && npm test
```

### Test Coverage

- Authentication flows
- API endpoints
- Component rendering
- Form validation
- Error handling

## 📦 Deployment

### Environment Variables for Production

Make sure to set these in production:

```env
NODE_ENV=production
JWT_SECRET=your-production-jwt-secret
MONGODB_URI=your-production-mongodb-uri
CLIENT_URL=your-frontend-domain
```

### Deployment Options

1. **VPS**: DigitalOcean, Linode, AWS EC2
2. **PaaS**: Heroku, Railway, Render
3. **Container**: Docker with Docker Compose
4. **Serverless**: Vercel (frontend) + Railway/Heroku (backend)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include error logs, environment details, and reproduction steps

## 🔄 Changelog

### v1.0.0 (Initial Release)

- ✅ User authentication system
- ✅ Tool management framework
- ✅ Project management
- ✅ Admin panel
- ✅ Responsive design
- ✅ API documentation
- ✅ Security features

## 🔮 Roadmap

- [ ] OAuth integration (Google, GitHub)
- [ ] Real-time notifications
- [ ] Advanced analytics
- [ ] Tool marketplace
- [ ] Team collaboration features
- [ ] Mobile app
- [ ] API rate limiting per user
- [ ] Tool versioning
- [ ] Automated testing pipeline
- [ ] Performance monitoring