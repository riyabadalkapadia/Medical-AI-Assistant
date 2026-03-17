# AI Healthcare Scheduling Assistant

A minimal full-stack MVP for a virtual medical receptionist using React, Vite, TailwindCSS, Node.js, Express, and Google Gemini API.

## Project Structure

- frontend/
  - src/components/
    - ChatWindow.jsx
    - MessageBubble.jsx
    - InputBox.jsx
  - src/pages/
    - Home.jsx
  - App.jsx
  - main.jsx
- backend/
  - server.js
  - routes/
    - chat.js
    - schedule.js
    - call.js
  - services/
    - gemini.js
    - doctors.js
    - email.js
    - voice.js

## Setup Instructions

See below for setup and run instructions for both frontend and backend.

cd .\backend\
set env variables
npm start


cd .\frontend\
npm run dev
