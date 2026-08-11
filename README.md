# Trust Management System

A comprehensive **full-stack MERN-based web application** designed to digitally manage the operations, donations, finances, branches, trustees, devotees, documents, and activities of a multi-branch trust and ashram.

The system is designed to support centralized management of **365+ branches**, helping reduce manual paperwork and providing better control over financial and administrative operations.

---

## 🌐 Live Application

🔗 **Live Website:** https://trust-frontend-ofp4.onrender.com/

> Replace `YOUR_DEPLOYED_URL_HERE` with the actual deployed website URL.

---

## 📖 Project Overview

The **Trust Management System** provides a centralized platform for managing trust-related operations from a single application.

The system allows administrators, trustees, branch managers, document handlers, and devotees to access features according to their assigned roles.

The application includes a  donation management, automated receipt generation, branch management, financial reporting, document management, announcements, and seva-related activities.

The main objective is to digitize the trust's day-to-day operations, improve transparency, reduce manual work, and provide centralized monitoring of multiple branches.

---

## 🚀 Key Features

### 🏛️ Trust & Branch Management

- Centralized trust management
- Management of 365+ branches
- Branch-wise operations
- Branch manager access
- Branch-wise donation tracking
- Branch-wise transaction tracking
- Centralized monitoring for trustees and administrators

---

### 👥 User & Role Management

The system provides role-based access according to the responsibilities of each user.

Supported roles include:

- **Main Admin**
- **Main Trustee**
- **Branch Manager**
- **Document Handler**
- **Devotee/User**

Each role has controlled access to the modules and operations required for that role.

---

### 💰 Donation Management

- Donor information management
- Donation entry and tracking
- Donation category management
- Branch-wise donation records
- Donation history
- Transaction/reference number tracking
- Donation verification
- Donation status management
- Centralized donation records

---

### 🧾 Receipt Management

The system provides automated digital receipt generation for donations and other trust activities.

Features include:

- Automatic receipt generation
- Marathi receipt support
- Branch/Shakha receipt generation
- PDF receipt generation
- Trust-specific receipt format
- Receipt numbering
- Donor details
- Donation amount
- Transaction information
- Signature sections
- Print-ready receipt layout

The receipt generation module is designed to follow the trust's existing physical receipt format, including required Marathi text, fonts, colors, images, and formatting.

---

### 📒 Accounting & Finance

The system includes a **Tally-style double-entry accounting module** for maintaining financial transactions.

Features include:

- Double-entry accounting
- Debit/Credit validation
- Journal entries
- Voucher management
- Ledger management
- Account management
- Transaction tracking
- Branch-wise accounting
- Financial transaction records

---

### 📊 Financial Reports

The accounting module provides financial information and reports for monitoring the organization's financial activities.

Available reports include:

- Trial Balance
- Cash Book
- Ledger Reports
- Income & Expenditure
- Balance Sheet
- Donation Reports
- Collection Reports
- Branch-wise Financial Reports

---

### 🔐 Security & Approval

The application implements security mechanisms to protect user accounts and sensitive financial operations.

Security features include:

- JWT-based authentication
- Role-based authorization
- Protected API routes
- Password hashing
- Secure environment configuration
- Maker-Checker approval workflow
- Controlled financial operations
---

### 🛕 Annadaan & Seva Management

The system supports trust activities such as **Annadaan Seva**.

Seva records can include:

- Donor/Devotee name
- Date
- Time
- Contact number
- Seva type
- Description
- Transaction information
- Receipt information

The system can generate the corresponding receipt after the required transaction process is completed.

---

### 📁 Document Management

The system provides centralized digital document management.

Features include:

- Document upload
- Digital document storage
- Document organization
- Cloud-based file storage
- Controlled document access

This helps reduce dependency on physical records and makes important trust documents easier to manage.

---

### 📢 Announcements & Notifications

The application provides communication features for trust administrators and users.

Features include:

- Trust announcements
- Notifications
- Event information
- Administrative updates
- Email notifications

---

### 🌐 Multi-Language Support

The system supports multilingual content for better accessibility.

It includes support for:

- English
- Marathi
- Hindi
- kannad
- Marathi receipt generation
- Localized trust-related content

---

### ⚡ Real-Time Updates

The application uses **Socket.io** for real-time communication where required.

This can be used for:

- Dashboard updates
- Notifications
- Transaction status updates
- Approval status updates
- Administrative updates

---

### 🛕 Live Darshan & Live Aarati

The platform can provide online access to trust activities through:

- Live Aarati
- Live video streaming
- Dedicated live-stream page
- Real-time stream status

---

## 🛠️ Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React.js | Frontend framework |
| Vite | Development and build tool |
| Tailwind CSS | UI styling |
| React Router | Application routing |
| Framer Motion | UI animations |
| Socket.io Client | Real-time communication |
| i18next | Internationalization |
| jsPDF | PDF generation |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express.js | REST API framework |
| MongoDB | Database |
| Mongoose | MongoDB ODM |
| JWT | Authentication |
| bcrypt | Password hashing |
| Socket.io | Real-time communication |
| Multer | File uploads |
| Cloudinary | Cloud file storage |
| PDF Libraries | Receipt/document generation |
| Nodemailer | Email services |
| Node-cron | Scheduled tasks |

---

# ⚙️ How to Run the Project

Follow the steps below to run the project locally after cloning the GitHub repository.

## 📋 Prerequisites

Make sure the following are installed on your system:

- [Node.js](https://nodejs.org/)
- npm
- MongoDB
- Git

You can verify Node.js and npm installation using:

```bash
node --version
npm --version
