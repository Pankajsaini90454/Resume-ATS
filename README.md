# Resumely — AI-Powered ATS Resume Scanner

Resumely is a full-stack MERN application powered by Google Gemini AI that analyzes resumes against Applicant Tracking System (ATS) parsing rules and job descriptions. It provides match scores, signal breakdowns, missing keywords, and actionable recommendations.

---

## Features

- **ATS Scoring Engine**: 0–100 score calibrated for standard ATS parsers.
- **Gemini AI Integration**: Uses `gemini-1.5-flash` with automatic fallback to `gemini-2.0-flash` and `gemini-1.5-pro`.
- **Multi-Format Resume Upload**: Supports PDF (`pdf-parse`), DOCX (`mammoth`), and raw text.
- **Section Breakdown**: Detailed grading for Contact & Header, Work Experience, Technical Skills, and ATS Formatting.
- **Keyword Matching**: Interactive matched vs. missing keyword inspection with 1-click copy.
- **Interactive Checklists**: Check off improvements as you edit your resume.
- **User Authentication**: Secure JWT-based authentication with bcrypt password hashing and MongoDB storage.
- **Single-Service Deployment**: Serves built React frontend directly from Express for 1-click Render deployment without CORS issues.

---

## Tech Stack

- **Frontend**: React 18, Redux Toolkit, esbuild
- **Backend**: Node.js, Express, MongoDB (Mongoose), Multer, PDF-Parse, Mammoth
- **AI**: `@google/generative-ai` (Gemini 1.5 Flash / 2.0 Flash)
- **Deployment**: Render Web Service (compatible with Render Free Tier)

---

## Local Development Setup

### 1. Prerequisites
- Node.js v18 or newer
- MongoDB connection string (local or free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- Google Gemini API Key (free from [Google AI Studio](https://aistudio.google.com/))

### 2. Install Dependencies
From the repository root:
```bash
npm run install:all
```

### 3. Environment Variables
Create a `.env` file in the `backEnd/` folder (or copy from `.env.example`):
```env
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/resumely?retryWrites=true&w=majority
MONGO_DATABASE=resumely
JWT_SECRET=your_development_secret_key_12345
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

### 4. Build and Run
To build the frontend:
```bash
npm run build
```

To start the backend server:
```bash
npm start
```
The application will be live at `http://localhost:4000`.

---

## How to Deploy on Render (Live in 5 Minutes)

### Option 1: Automatic 1-Click Deployment (Using `render.yaml`)

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Configure full-stack build and fix ATS engine for Render"
   git push origin main
   ```
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** > **Blueprint**.
4. Connect your GitHub repository (`Resume-ATS`).
5. Render will automatically read `render.yaml`.
6. Fill in the required environment variables:
   - `MONGO_URI`: Your MongoDB Atlas connection URI.
   - `GEMINI_API_KEY`: Your Google Gemini API Key from [AI Studio](https://aistudio.google.com/).
7. Click **Apply**. Render will install, build, and deploy your live app!

---

### Option 2: Manual Web Service Setup on Render

1. Log in to [Render](https://dashboard.render.com/) and click **New +** > **Web Service**.
2. Select your GitHub repository: `Resume-ATS`.
3. Configure the following settings:
   - **Name**: `resumely-ats` (or any name you prefer)
   - **Region**: Choose the closest region (e.g. Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Root Directory**: Leave blank (root `./`)
   - **Runtime**: `Node`
   - **Build Command**: `npm run install:all && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: Any random 32+ character string (or click Generate)
   - `MONGO_URI`: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/resumely?retryWrites=true&w=majority`
   - `GEMINI_API_KEY`: Your Gemini API Key from Google AI Studio
   - `GEMINI_MODEL`: `gemini-1.5-flash`
5. Click **Deploy Web Service**.
6. Once deployed, visit your Render URL (e.g. `https://resumely-ats.onrender.com`).

---

## Health Check
Render can monitor the service via:
```
GET /api/health
```
Response:
```json
{
  "status": "ok",
  "service": "Resumely ATS REST API",
  "uptime": 120,
  "database": "connected",
  "timestamp": "2026-11-20T10:00:00.000Z"
}
```
