# 🌟 Todo Web App

A modern, responsive, and feature-rich Todo Web Application built using **React.js** (Frontend), **Flask (Python)** (Backend), and **MongoDB** (Database).

---

## 🚀 Features

- 🔑 **User Authentication (Login & Register)** — via unique Roll Number & Password.
- ✅ **Task Management** — Add, View, Toggle (Mark Complete/Incomplete), Delete Tasks.
- 🗓️ **Custom Date & Time for each Task** — plan when to do each task.
- 🌙 **Dark Mode Toggle** — Smooth switch between Light and Dark themes.
- 🎨 **Multiple Color Themes** — Blue, Green, Pink themes to personalize your app.
- 🎉 **Confetti Animation** — On successful task completion to keep things fun!
- 📱 **Fully Responsive** — Works seamlessly on Desktop, Tablet & Mobile devices.
- ⚡ **Real-Time Updates** — Tasks instantly reflected after operations.
- 🔐 **Session-Independent Roll Number Tracking** — No loss of data on page reload.

---

## 🛠️ Tech Stack

| Frontend  | Backend | Database | Others |
| -------- | ------- | -------- | ------ |
| React.js | Flask   | MongoDB  | Axios, CORS, canvas-confetti |

---

## 🏗️ Project Structure

/todo-app
│
├── /backend
│   ├── app.py                # Flask backend server
│   └── requirements.txt      # Python dependencies (Flask, Flask-CORS, PyMongo)
│
├── /frontend
│   ├── /public
│   │   └── index.html        # Main HTML file
│   │
│   ├── /src
│   │   ├── App.js            # React main component
│   │   ├── App.css           # CSS Styling (Themes, Dark Mode, Responsiveness)
│   │   └── index.js          # React entry point
│   │
│   ├── package.json          # Frontend dependencies (React, Axios, Confetti)
│   └── package-lock.json     # Frontend dependency tree lock file
│
├── .gitignore                # Files/folders ignored by Git
├── README.md                 # Project documentation (you are reading this!)
└── LICENSE                   # Project license (MIT)


