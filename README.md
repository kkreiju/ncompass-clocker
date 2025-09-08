# NCompass Attendance System

A comprehensive attendance tracking system built with Next.js, MongoDB, and QR code functionality.

## Features

- 🔐 **Authentication System** - Admin and user login
- 📱 **QR Code Attendance** - Scan QR codes for clock-in/out
- 📊 **Admin Dashboard** - Full attendance management
- 👥 **User Dashboard** - Personal attendance tracking
- 🎨 **Modern UI** - Built with Tailwind CSS and shadcn/ui
- 📱 **Responsive Design** - Works on all devices
- 🌙 **Dark/Light Mode** - Theme switching support

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **QR Codes**: qrcode library for generation/scanning

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database
- pnpm (recommended) or npm/yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/ncompass-attendance

   # JWT Secret (change this in production)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # Optional: Next.js Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database and admin user**
   ```bash
   pnpm run setup
   ```

5. **Run the development server**
   ```bash
   pnpm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

### Admin Access
- Visit `/admin` to access the admin dashboard
- Use the credentials created during setup

### User Access
- Regular users can access their dashboard at `/dashboard`
- QR code scanning for attendance tracking

## API Routes

- `GET/POST /api/attendance` - Attendance records
- `POST /api/auth/admin-login` - Admin authentication
- `POST /api/auth/user-login` - User authentication
- `POST /api/scan` - QR code scanning
- `GET/POST /api/users` - User management

## Project Structure

```
my-app/
├── app/
│   ├── admin/           # Admin-only pages with sidebar
│   ├── api/            # API routes
│   ├── dashboard/      # User dashboard
│   └── page.tsx        # Home page
├── components/         # Reusable components
├── lib/               # Utilities (auth, db, etc.)
├── models/            # MongoDB schemas
└── scripts/           # Setup scripts
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
