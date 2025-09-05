# NCompass QR Attendance System

A comprehensive QR code-based attendance tracking system built with Next.js, featuring admin management, user dashboards, and real-time QR scanning capabilities.

## Features

- **QR Code Attendance Tracking**: Employees can clock in/out by scanning QR codes
- **Admin Dashboard**: Complete user management and attendance monitoring
- **User Dashboard**: Personal attendance history and QR code information
- **Real-time Camera Integration**: Automatic QR code detection without user interaction
- **Secure Authentication**: JWT-based authentication for users and admins
- **Monthly Attendance Reports**: Organized attendance data by month/year
- **Responsive Design**: Modern UI that works on all devices

## Pages & Routes

### Public Pages
- `/` - User login page
- `/admin` - Admin login page
- `/attendance` - QR scanner (no login required)

### Protected Pages
- `/dashboard` - User dashboard (user login required)
- `/admin-dashboard` - Admin management panel (admin login required)

### API Endpoints
- `POST /api/auth/user-login` - User authentication
- `POST /api/auth/admin-login` - Admin authentication
- `POST /api/scan` - QR code scanning for attendance
- `GET/POST /api/users` - User management (admin only)
- `GET /api/attendance` - Attendance records

## Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB database (local or Atlas)
- Modern web browser with camera support

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
# Copy the example environment file
cp env.example .env.local

# Edit .env.local with your values:
MONGODB_URI=mongodb://localhost:27017/ncompass-attendance
JWT_SECRET=your-super-secure-jwt-secret-key-here
NODE_ENV=development
```

3. **Set up the database:**
```bash
# Run the setup script to create initial admin user
npm run setup
```

4. **Start the development server:**
```bash
npm run dev
```

5. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### For Administrators

1. **Login**: Go to `/admin` and use your admin credentials
2. **Add Users**: In the admin dashboard, click "Add New User" to create employee accounts
3. **Monitor Attendance**: View real-time attendance records and generate reports
4. **User Management**: Manage employee accounts and access

### For Employees

1. **Get QR Code**: Your QR code value is your name (as registered by admin)
2. **Clock In/Out**: 
   - Visit `/attendance` (no login required)
   - Show your QR code to the camera
   - System automatically detects clock-in vs clock-out
3. **View History**: Login at `/` to access your personal dashboard

### QR Code System

- **QR Code Value**: Employee's name (exactly as registered)
- **Auto-Detection**: System automatically determines if it's clock-in or clock-out
- **Real-time Processing**: Instant feedback and confirmation
- **No Login Required**: Attendance scanning works without authentication

## Technical Details

### Architecture
- **Frontend**: Next.js 15 with React 19
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **QR Scanning**: qr-scanner library with camera integration

### Database Schema
- **Users**: Employee information and credentials
- **Admins**: Administrator accounts
- **AttendanceLog**: Time-stamped attendance records (organized by month)

### Security Features
- Password hashing with bcrypt
- JWT token authentication
- Role-based access control (admin/user)
- Input validation and sanitization
- Secure API endpoints

## Development

### Project Structure
```
├── app/
│   ├── admin/                 # Admin login page
│   ├── admin-dashboard/       # Admin management panel
│   ├── attendance/           # QR scanner page
│   ├── dashboard/            # User dashboard
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── users/           # User management
│   │   ├── scan/            # QR scanning
│   │   └── attendance/      # Attendance data
│   └── page.tsx             # User login (home)
├── lib/
│   ├── auth.ts              # Authentication utilities
│   ├── mongodb.ts           # Database connection
│   └── mongoose.ts          # Mongoose setup
├── models/
│   ├── User.ts              # User data model
│   ├── Admin.ts             # Admin data model
│   └── AttendanceLog.ts     # Attendance tracking
└── public/                  # Static assets
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run setup` - Initialize database with admin user

## Deployment

### Environment Variables for Production
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ncompass-attendance
JWT_SECRET=your-production-jwt-secret-key
NODE_ENV=production
```

### Deployment Platforms
- **Vercel**: Recommended for Next.js applications
- **Netlify**: Alternative deployment option
- **Docker**: Container-based deployment
- **Traditional Hosting**: Any Node.js hosting provider

## Troubleshooting

### Common Issues

1. **Camera not working**: Ensure HTTPS in production and camera permissions
2. **Database connection**: Verify MongoDB URI and network access
3. **QR scanning fails**: Check camera permissions and lighting conditions
4. **Authentication errors**: Verify JWT_SECRET is set correctly

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
