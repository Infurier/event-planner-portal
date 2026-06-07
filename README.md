# Event Planner Portal

A full-stack web application for event planning, featuring a React/Vite frontend and a Node.js/Express backend with MySQL database.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MySQL](https://www.mysql.com/) (Running locally or accessible remotely)

## Project Structure

- `client/`: React frontend built with Vite and TailwindCSS.
- `server/`: Node.js backend using Express and Sequelize (MySQL).

## Setup Instructions

Follow these steps to run the application on any computer:

### 1. Database Setup
1. Create a MySQL database for the project (e.g., `event_planner_db`).
2. Make sure your MySQL server is running.

### 2. Backend Setup (`server/`)
1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` directory. You can copy the contents from any `.env.example` if it exists, or create one with the following variables:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=event_planner_db
   JWT_SECRET=your_jwt_secret_key
   ```
   *(Adjust the DB credentials to match your MySQL setup)*
4. (Optional) Run database seeders if available to populate initial data:
   ```bash
   npm run seed
   ```
5. Start the backend server:
   ```bash
   npm run dev
   ```
   *The server should now be running on `http://localhost:5000` (or the port you specified).*

### 3. Frontend Setup (`client/`)
1. Open a new terminal window and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
4. The terminal will output a local URL (usually `http://localhost:5173`). Open this URL in your browser to view the application.

## Technologies Used
- **Frontend:** React, Vite, TailwindCSS, Chart.js, Socket.io-client
- **Backend:** Node.js, Express, Sequelize (MySQL), JWT for Authentication, Socket.io, Multer for file uploads
