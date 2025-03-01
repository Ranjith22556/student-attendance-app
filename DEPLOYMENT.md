# Deploying to Vercel

This guide will walk you through the process of deploying the Student Attendance App to Vercel.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. A [GitHub](https://github.com) account
3. A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) database

## Step 1: Prepare Your MongoDB Database

1. Create a MongoDB Atlas account if you don't have one
2. Create a new cluster (the free tier is sufficient for testing)
3. Create a database user with read/write permissions
4. Add your IP address to the IP access list (or use 0.0.0.0/0 for development)
5. Get your MongoDB connection string from the Atlas dashboard

## Step 2: Push Your Code to GitHub

1. Create a new GitHub repository
2. Initialize Git in your project folder (if not already done):
   ```bash
   git init
   ```
3. Add your files to Git:
   ```bash
   git add .
   ```
4. Commit your changes:
   ```bash
   git commit -m "Initial commit"
   ```
5. Add your GitHub repository as a remote:
   ```bash
   git remote add origin https://github.com/ranjith22556/student-attendance-app.git
   ```
6. Push your code to GitHub:
   ```bash
   git push -u origin main
   ```

## Step 3: Deploy to Vercel

1. Log in to your Vercel account
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next
5. Add Environment Variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `NEXTAUTH_URL`: Your Vercel deployment URL (you can update this after deployment)
   - `NEXTAUTH_SECRET`: A secure random string (at least 32 characters)
6. Click "Deploy"

## Step 4: Update Environment Variables

After your initial deployment, update the `NEXTAUTH_URL` environment variable with your actual Vercel deployment URL:

1. Go to your project in the Vercel dashboard
2. Click on "Settings"
3. Go to "Environment Variables"
4. Update `NEXTAUTH_URL` with your deployment URL (e.g., https://your-app-name.vercel.app)
5. Click "Save"

## Step 5: Verify Deployment

1. Visit your deployment URL to ensure everything is working correctly
2. Test the authentication flow
3. Verify that data is being saved to and retrieved from your MongoDB database

## Troubleshooting

If you encounter any issues during deployment:

1. Check the Vercel deployment logs for errors
2. Verify that your environment variables are correctly set
3. Ensure your MongoDB connection string is correct and the database is accessible
4. Check that your Next.js API routes are functioning properly

## Continuous Deployment

Vercel automatically deploys your app when you push changes to your GitHub repository. To make updates:

1. Make changes to your code locally
2. Commit your changes:
   ```bash
   git add .
   git commit -m "Your commit message"
   ```
3. Push to GitHub:
   ```bash
   git push
   ```
4. Vercel will automatically deploy your changes
