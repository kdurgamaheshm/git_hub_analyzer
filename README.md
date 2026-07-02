# GitHub Profile Analyzer API

A robust Node.js and Express.js REST API that integrates with the public GitHub API to analyze users' profiles and repository statistics. It calculates advanced insights (such as language distributions, total stars, total forks, and most-starred repositories) and persists the data in a MySQL database.

The project features a **premium glassmorphic frontend dashboard** built with vanilla HTML/CSS/JS, allowing users to analyze profiles interactively and view stored reports in real-time.

---

## 🚀 Key Features

* **Complete Profile Analysis**: Fetches basic user statistics (repos, followers, following, location, bio).
* **Computed Insights**:
  * **Total Stars & Forks**: Aggregates stargazers and forks counts across public repositories.
  * **Primary Language**: Dynamically calculates the programming language used most frequently across repositories.
  * **Most Starred Repository**: Identifies the user's most popular repository.
  * **Language Distribution Breakdown**: Computes the frequency of each programming language used.
* **MySQL Database Persistence**: Implements idempotent save/update logic (`ON DUPLICATE KEY UPDATE`) to store profiles and recalculate statistics if updated.
* **REST APIs**: Clear JSON endpoints for CRUD operations.
* **Stunning Frontend Dashboard**: Self-contained dark glassmorphic user interface with smooth transitions, progress bars showing language distributions, and modal overlays.

---

## 🛠️ Tech Stack

* **Runtime**: Node.js (v20+)
* **Framework**: Express.js
* **Database**: MySQL (v8+)
* **HTTP Library**: Native Node.js `fetch` API (no external HTTP clients needed)
* **CSS & Frontend**: Vanilla HTML5, CSS3, & Modern ES Modules Javascript

---

## 📁 Project Structure

```text
eduCase/
├── config/
│   └── db.js               # MySQL pool configuration using mysql2/promise
├── controllers/
│   └── profileController.js # API controllers (analyze, get all, get single, delete)
├── db/
│   ├── schema.sql          # MySQL database schema (DDL)
│   └── setup.js            # Automated database bootstrap script
├── public/                 # Static frontend files
│   ├── index.html          # Dashboard HTML entry
│   ├── style.css           # Glassmorphism UI styles
│   └── app.js              # Fetch requests & UI interactivity
├── routes/
│   └── profileRoutes.js    # Express routing definitions
├── services/
│   └── githubService.js    # GitHub API client & statistical aggregators
├── .env.example            # Environment configuration template
├── .env                    # Local environment secrets (gitignored)
├── .gitignore              # Files ignored by Git
├── package.json            # Scripts and dependencies
└── server.js               # App entrypoint & Express configurations
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
Ensure you have the following installed on your machine:
* **Node.js** (v18.0.0 or higher)
* **MySQL Server** (running locally or remotely)

### 2. Configure Environment Variables
Copy the `.env.example` file and rename it to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your MySQL credentials:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=github_analyzer

# Optional: Personal Access Token to increase GitHub API limit
GITHUB_TOKEN=
```

### 3. Install Dependencies
Run the following command in the project root:
```bash
npm install
```

### 4. Setup MySQL Database Schema
To automate database creation and tables setup, execute:
```bash
npm run db:setup
```
This script will establish a connection to your MySQL server, create the `github_analyzer` database, and initialize the `github_profiles` table.

### 5. Start the Application
To run the server in development mode (with file monitoring/restarts):
```bash
npm run dev
```
To run the server in production mode:
```bash
npm start
```
The server will start, and you can access the frontend dashboard by opening:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## 🔌 API Endpoints Documentation

All routes are prefixed with `/api`.

### 1. Analyze and Store Profile
* **Endpoint**: `POST /api/analyze/:username`
* **Description**: Queries GitHub API, calculates insights, saves or updates the record in MySQL, and returns the analyzed data.
* **Sample Response (200 OK)**:
```json
{
  "message": "Profile analysis for 'octocat' successfully stored/updated.",
  "data": {
    "username": "octocat",
    "name": "The Octocat",
    "avatar_url": "https://avatars.githubusercontent.com/u/583231?v=4",
    "bio": null,
    "blog": "https://github.blog",
    "location": "San Francisco",
    "public_repos": 8,
    "public_gists": 8,
    "followers": 23138,
    "following": 9,
    "github_created_at": "2011-01-25T18:44:36Z",
    "github_updated_at": "2026-06-22T11:32:20Z",
    "total_stars": 21644,
    "total_forks": 165273,
    "primary_language": "Ruby",
    "most_starred_repo": "Spoon-Knife",
    "languages_json": {
      "Ruby": 1,
      "CSS": 1,
      "HTML": 1
    }
  }
}
```

### 2. Fetch Stored Profile List
* **Endpoint**: `GET /api/profiles`
* **Description**: Returns all user profile analyses stored in the MySQL database ordered by the most recently analyzed.
* **Sample Response (200 OK)**:
```json
{
  "count": 1,
  "profiles": [
    {
      "id": 1,
      "username": "octocat",
      "name": "The Octocat",
      "avatar_url": "https://avatars.githubusercontent.com/u/583231?v=4",
      "bio": null,
      "blog": "https://github.blog",
      "location": "San Francisco",
      "public_repos": 8,
      "public_gists": 8,
      "followers": 23138,
      "following": 9,
      "github_created_at": "2011-01-25T18:44:36Z",
      "github_updated_at": "2026-06-22T11:32:20Z",
      "total_stars": 21644,
      "total_forks": 165273,
      "primary_language": "Ruby",
      "most_starred_repo": "Spoon-Knife",
      "languages_json": {
        "Ruby": 1,
        "CSS": 1,
        "HTML": 1
      },
      "analyzed_at": "2026-07-02T13:54:04.000Z"
    }
  ]
}
```

### 3. Fetch Single Profile Insights
* **Endpoint**: `GET /api/profiles/:username`
* **Description**: Returns the details of a single user profile stored in the MySQL database.
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "profile": {
    "id": 1,
    "username": "octocat",
    "name": "The Octocat",
    "avatar_url": "https://avatars.githubusercontent.com/u/583231?v=4",
    ...
  }
}
```

### 4. Delete Profile Analysis
* **Endpoint**: `DELETE /api/profiles/:username`
* **Description**: Removes the profile record from the local MySQL database.
* **Sample Response (200 OK)**:
```json
{
  "message": "Profile analysis for 'octocat' successfully deleted from local storage."
}
```
