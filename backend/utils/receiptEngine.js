const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const Sequence = require('../models/Sequence');
const ReceiptArchive = require('../models/ReceiptArchive');
const cloudinary = require('../config/cloudinary');
const QRCode = require('qrcode');
const { generateReceiptPdf: generateOldReceiptPdfBuffer } = require('./generateReceipt');

let browserInstance = null;

const getBrowser = async () => {
  if (!browserInstance || !browserInstance.isConnected()) {
    const launchOptions = {
      headless: "new",
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote'
      ]
    };
    if (process.platform === 'win32') {
      const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      const chromePath86 = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
      const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
      if (fs.existsSync(chromePath)) {
        launchOptions.executablePath = chromePath;
      } else if (fs.existsSync(chromePath86)) {
        launchOptions.executablePath = chromePath86;
      } else if (fs.existsSync(edgePath)) {
        launchOptions.executablePath = edgePath;
      }
    }
    browserInstance = await puppeteer.launch(launchOptions);
  }
  return browserInstance;
};

/**
 * Generates the next sequential number for a given prefix.
 * @param {string} prefix - e.g., 'DON-2026', 'BDN-MRJ-2026'
 * @returns {Promise<string>}
 */
const generateNextReceiptNumber = async (prefix) => {
  const sequence = await Sequence.findOneAndUpdate(
    { sequenceName: prefix },
    { $inc: { currentValue: 1 } },
    { new: true, upsert: true }
  );

  const paddingLength = 6;
  const numStr = sequence.currentValue.toString().padStart(paddingLength, '0');
  return `${prefix}-${numStr}`;
};

const uploadToCloudinary = async (bufferOrString, fileName, format) => {
  const cloudinaryInstance = await cloudinary.getCloudinary();
  if (!cloudinaryInstance) {
    throw new Error("Cloudinary is not configured");
  }
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinaryInstance.uploader.upload_stream(
      {
        folder: 'receipts',
        public_id: fileName,
        resource_type: format === 'pdf' ? 'image' : 'raw',
        format: format
      },
      (error, result) => {
        if (result) resolve(result.secure_url);
        else reject(error);
      }
    );
    
    // Convert string (HTML) to buffer if needed
    const buffer = typeof bufferOrString === 'string' ? Buffer.from(bufferOrString, 'utf8') : bufferOrString;
    uploadStream.end(buffer);
  });
};

/**
 * Renders the HTML template into a PDF using Puppeteer
 */
const generateReceiptPdf = async (templateName, data, receiptNumber) => {
  const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template ${templateName} not found.`);
  }

  let htmlContent = fs.readFileSync(templatePath, 'utf8');

  // Simple string replacement for data fields
  // In a real scenario, consider using Handlebars or EJS
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    htmlContent = htmlContent.replace(regex, value || '');
  }
  
  // Inject receipt number
  htmlContent = htmlContent.replace(/{{receiptNumber}}/g, receiptNumber);
  
  // Optional: Generate QR Code for verification
  try {
     const qrData = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-receipt/${receiptNumber}`;
     const qrDataUrl = await QRCode.toDataURL(qrData);
     htmlContent = htmlContent.replace(/{{qrCode}}/g, `<img src="${qrDataUrl}" width="100" height="100" />`);
  } catch (err) {
     console.error("Failed to generate QR", err);
     htmlContent = htmlContent.replace(/{{qrCode}}/g, '');
  }

  // Add backend base URL for absolute image paths if needed
  htmlContent = htmlContent.replace(/{{baseUrl}}/g, process.env.BACKEND_URL || process.env.BASE_URL || 'https://aashram-project-1.onrender.com');

  let fileUrl;
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    
    // Emulate print media for exact sizing
    await page.emulateMediaType('print');
    await page.setContent(htmlContent, { waitUntil: 'load', timeout: 30000 });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 } // No margins, let template handle it
    });

    await page.close();

    // Save to Cloudinary
    fileUrl = await uploadToCloudinary(pdfBuffer, receiptNumber, 'pdf');
  } catch (err) {
    console.error("Puppeteer failed to generate PDF:", err);
    throw new Error("Failed to generate PDF document: " + err.message);
  }

  return fileUrl;
};

/**
 * Main engine function to create, generate, and store a receipt.
 */
const issueReceipt = async ({
  category,
  branchCode = 'KOL',
  year = new Date().getFullYear(),
  dynamicData,
  referenceId,
  referenceModel,
  generatedBy,
  generatedByModel,
  branchId,
  rawDonation
}) => {
  
  // Determine Prefix
  let prefix = '';
  let templateName = '';
  switch(category) {
    case 'Notice': prefix = `NOT-${year}`; templateName = 'noticeTemplate'; break;
    case 'Donation': prefix = `DON-${year}`; templateName = 'donationTemplate'; break;
    case 'Branch Donation': prefix = `BDN-${branchCode}-${year}`; templateName = 'branchDonationTemplate'; break;
    case 'Annadan': prefix = `ANN-${year}`; templateName = 'annadanTemplate'; break;
    case 'Prasad': prefix = `PRA-${year}`; templateName = 'prasadTemplate'; break;
    case 'Payment': prefix = `PAY-${year}`; templateName = 'paymentTemplate'; break;
    case 'Expense': prefix = `EXP-${year}`; templateName = 'expenseTemplate'; break;
    default: throw new Error("Invalid receipt category");
  }

  // 1. Get Number
  const receiptNumber = await generateNextReceiptNumber(prefix);

  // 2. Generate PDF
  const pdfUrl = await generateReceiptPdf(templateName, dynamicData, receiptNumber);

  // 3. Save Archive
  const archive = new ReceiptArchive({
    receiptNumber,
    category,
    branchId,
    referenceId,
    referenceModel,
    dynamicData,
    pdfUrl,
    status: 'Generated',
    generatedBy,
    generatedByModel
  });

  await archive.save();

  return archive;
};

module.exports = {
  generateNextReceiptNumber,
  generateReceiptPdf,
  issueReceipt
};
