Trust Management System
📖 Project Overview
The Trust Management System is a comprehensive web application designed to manage the operations of trusts and ashrams, specifically featuring a robust Tally-Style Accounting & Financial Reporting Module. It serves as the financial backbone for multi-branch organizations (handling 365+ branches), offering double-entry accounting, real-time transaction tracking, donation management, and automated receipt generation.

🚀 Features
Double-Entry Accounting: Professional Tally-style journal entries, ledger management, and strict enforcement of the accounting equation (Debit == Credit).
Centralized Transaction Ledger: Unified tracking for donations, event fees, book purchases, and memberships across multiple branches.
Bank Reconciliation: Automated algorithms to match system transactions with uploaded bank statements (CSV) based on amount, date, and UTR/Reference numbers.
Financial Reporting: Real-time generation of Trial Balances, Income & Expenditure reports, Cash Books, and Balance Sheets.
Branch-wise Daily Closing: Streamlined daily cash and collection reconciliation for individual branches.
Automated Receipt Generation: Dynamic generation of PDF receipts for donations and transactions.
Maker-Checker Workflow: Secure approval workflows for manual journal vouchers and transactions.
Multi-language Support: Internationalization built-in for a wider user base.
💻 Technologies Used
Frontend
Core: React 19, Vite
Styling & Animation: Tailwind CSS, Framer Motion
Routing: React Router v7
Real-time: Socket.io-client
Utilities: React-Quill, React-Player, jsPDF (for reporting), i18next (for multi-language)
Backend
Core: Node.js, Express.js
Database: MongoDB with Mongoose
Authentication: JWT, Argon2, bcryptjs, Google Auth Library
Real-time & Tasks: Socket.io, Node-cron
File Processing & Storage: Cloudinary, Multer
Document Generation: PDFKit, Puppeteer
Other Services: Nodemailer, Deepgram SDK, Google Translate API
📸 Screenshots
(Add your screenshots here. You can use markdown image syntax: ![Description](path/to/image.png))

Dashboard Overview: ![Dashboard](path/to/screenshot1.png)
Voucher Entry: ![Voucher Entry](path/to/screenshot2.png)
Financial Reports: ![Reports](path/to/screenshot3.png)
⚙️ How to Run It
Prerequisites
Make sure you have Node.js and MongoDB installed on your machine.

1. Clone the repository
bash

git clone https://github.com/yourusername/Trust_manegement.git
cd Trust_manegement
2. Backend Setup
bash

cd backend
npm install
Create a .env file in the backend directory and add your environment variables (MongoDB URI, JWT Secret, Cloudinary credentials, etc.).
Start the backend server:
bash

npm run dev
3. Frontend Setup
Open a new terminal window:

bash

cd frontend
npm install
Start the frontend development server:
bash

npm run dev
4. Access the App
Open your browser and navigate to the URL provided by Vite (usually http://localhost:5173).
