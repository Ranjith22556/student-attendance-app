# Student Attendance App

A modern web application for tracking student attendance with a beautiful UI and comprehensive features.

## Features

- **Dashboard**: View attendance statistics, upcoming classes, and quick actions
- **Subject Tracking**: Monitor attendance rates for each subject with visual indicators
- **Notifications**: Stay updated with attendance alerts and class reminders
- **Timetable Management**: Create and manage your class schedule
- **Check-in System**: Mark attendance for classes with a simple interface
- **Dark Mode Support**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: NextAuth.js
- **Database**: MongoDB
- **Deployment**: Vercel

## Deployment to Vercel

### Prerequisites

- A [Vercel](https://vercel.com) account
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) database

### Environment Variables

Create the following environment variables in your Vercel project:

```
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_URL=your_vercel_deployment_url
NEXTAUTH_SECRET=your_nextauth_secret
```

### Deployment Steps

1. Push your code to a GitHub repository
2. Log in to your Vercel account
3. Click "New Project" and import your GitHub repository
4. Configure the environment variables
5. Click "Deploy"

## Local Development

### Installation

```bash
# Clone the repository
git clone https://github.com/ranjith22556/student-attendance-app.git
cd student-attendance-app

# Install dependencies
npm install
```

### Running the Development Server

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Building for Production

```bash
# Create a production build
npm run build

# Start the production server
npm start
```

## Project Structure

- `app/` - Next.js app directory with page components
- `components/` - Reusable UI components
- `lib/` - Utility functions and database connection
- `public/` - Static assets

## License

MIT
