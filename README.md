# 🚦 AI-Based Traffic Violation Detection System

An intelligent desktop-based system that uses **Computer Vision and AI** to automatically detect, verify, and manage traffic violations in near real-time.

This project is developed as a Final Year Project (FYP) for BS Data Science at Air University, Islamabad.

---

## 📌 Overview

The system leverages **deep learning models (YOLOv5/YOLOv8)** and **OpenCV** to process live traffic camera feeds and detect violations such as:

- 🚫 Red Light Jumping  
- 🪖 Helmetless Riding  
- 🔁 Wrong-Way Driving  
- 🚗 Illegal Parking  
- 👨‍👨‍👦 Triple Riding  
- 🪞 Black Mirror Detection  
- 🔢 Illegal / Tampered Number Plates  

It provides a **complete workflow** from detection → verification → notification → reporting.

---



## 🎯 Key Features

- 📡 Live Traffic Monitoring with AI Detection  
- ✅ Manual Verification by Officers  
- 📩 Real-time SMS Notifications  
- 📊 Advanced Reports & Analytics  
- 🔍 Vehicle History Tracking  
- ✍️ Custom Violation Logging  
- 👥 Role-Based User Management  
- ⚙️ Configurable System Settings  

---

## 🏗️ System Architecture
Traffic Cameras → AI Model (YOLO + OpenCV)
↓
Violation Detection Engine
↓
Database (SQLite / PostgreSQL)
↓
Desktop Application (PyQt5 GUI)
↓
SMS / Notification API


---

## 🧠 AI Model & Training

### Model Used
- YOLOv5 / YOLOv8 (Object Detection)

### Training Details
- Custom dataset for traffic violations
- Classes include:
  - helmet
  - no_helmet
  - car
  - bike
  - license_plate
  - etc.

### Pipeline
1. Video frames extracted using OpenCV  
2. Frames passed to YOLO model  
3. Objects detected and classified  
4. Violation logic applied (rule-based + detection)  
5. Results stored with timestamp & evidence  

### Tools & Libraries
- Python 3.10+
- OpenCV
- PyTorch / TensorFlow
- YOLOv5 / YOLOv8
- NumPy, Pandas

---

## 💻 Tech Stack

| Layer            | Technology |
|------------------|-----------|
| Frontend (GUI)   | PyQt5 |
| Backend Logic    | Python |
| AI/ML            | YOLOv5 / YOLOv8 |
| Database         | SQLite / PostgreSQL |
| Notifications    | SMS API (Jazz / Twilio) |
| Packaging        | PyInstaller |

---

## 🖥️ Application Pages (UI Overview)

---

### 🔐 Login Page
- Secure authentication system
- Role-based access (Admin / Officer)
- Prevents unauthorized access

<img width="956" height="439" alt="Login" src="https://github.com/user-attachments/assets/00aafb59-1932-4602-95bd-bfd427e23aed" />


---

### 📊 Dashboard
- Overview of system activity
- Quick stats:
  - Total violations
  - Today's violations
  - Pending verifications
- Navigation to all modules

<img width="946" height="437" alt="Dashboard" src="https://github.com/user-attachments/assets/bb0a52aa-5228-45ad-88e0-5f71cea4dfbe" />


---

### 📡 Live Monitoring
- Real-time camera feed display
- AI highlights detected violations
- Supports multiple camera streams
- Officer can switch feeds

<img width="946" height="440" alt="Monitoring Screen" src="https://github.com/user-attachments/assets/16c0899e-da99-45f8-9d18-c1fc27fe2ac7" />


---

### 🚨 Violations Page
- List of detected violations
- Filters:
  - Date
  - Type
  - Status
- Actions:
  - ✅ Confirm
  - ❌ Dismiss
- Shows:
  - Snapshot evidence
  - Timestamp
  - Vehicle details

<img width="947" height="419" alt="Violations" src="https://github.com/user-attachments/assets/0c8a6c2c-688a-47b1-b805-9e42c3edbba2" />


---

### ✍️ Custom Violations
- Manual violation entry by officer
- Add:
  - Vehicle number
  - Snapshot from video
- Marked as **Manual**
- Used for rare or missed cases

<img width="941" height="407" alt="Custom Violations" src="https://github.com/user-attachments/assets/26c8abab-a299-46f0-8ff4-2d2865166978" />


---

### 🚗 Vehicle History
- Search by vehicle number
- Displays:
  - Past violations
  - Dates
  - Fine status
- Helps identify repeat offenders

<img width="959" height="437" alt="Vehicle Search" src="https://github.com/user-attachments/assets/6f78566d-cd5d-4eb2-b44b-b44dde0731d6" />


---

### 📈 Reports & Statistics
- Generate reports based on:
  - Date range
  - Violation type
- Visualizations:
  - Graphs
  - Charts
- Export options:
  - PDF
  - Excel

<img width="943" height="443" alt="Reports" src="https://github.com/user-attachments/assets/593e434e-b811-4494-a0be-8606b033e8f2" />


---

### ⚙️ Settings
- Configure system parameters
- Modify:
  - Fine amounts
  - Detection thresholds
- System preferences

<img width="947" height="444" alt="Settings" src="https://github.com/user-attachments/assets/8d63751a-ebf8-4d91-b5d2-3125f4ca234b" />


---

### ❓ Help Page
- User guidance
- Tooltips and instructions
- Improves usability for officers

<img width="942" height="437" alt="Help Page" src="https://github.com/user-attachments/assets/b9f0e157-38fe-42e6-a76c-6fd8ac1fd197" />


---

### 👥 User Management
- Admin-only access
- Add / Remove users
- Assign roles:
  - Admin
  - Officer
- Manage permissions

<img width="953" height="428" alt="User Manag" src="https://github.com/user-attachments/assets/cd61dfae-e3c9-4bc0-b668-589e50b41366" />


---

## 🔔 Notification System

- Sends SMS alerts to violators
- Includes:
  - Violation type
  - Time & location
  - Fine details
- Triggered after **manual verification**

---

## 🗄️ Database Design

Stores:
- Violations
- Vehicle details
- User accounts
- Logs
- Reports

Supports:
- Fast queries
- Scalable storage

---

## ⚡ Performance

- Detection time: ~2 seconds
- Supports multiple camera feeds
- Near real-time processing

---

## 🔐 Security Features

- Role-based authentication
- Encrypted data handling
- Audit logs for all actions
- Account lock after failed attempts
