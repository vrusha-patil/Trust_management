const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Helper to convert number to Marathi words
function convertNumberToMarathiWords(amount) {
  if (amount === 0) return "शून्य";
  
  const marathiNums = [
    "", "एक", "दोन", "तीन", "चार", "पाच", "सहा", "सात", "आठ", "नऊ", "दहा",
    "अकरा", "बारा", "तेरा", "चौदा", "पंधरा", "सोळा", "सतरा", "अठरा", "एकोणीस", "वीस",
    "एकवीस", "बावीस", "तेवीस", "चोवीस", "पंचवीस", "सव्वीस", "सत्तावीस", "अठ्ठावीस", "एकोणतीस", "तीस",
    "एकतीस", "बत्तीस", "तेहतीस", "चौतीस", "पस्तीस", "छत्तीस", "सडतीस", "अडतीस", "एकोणचाळीस", "चाळीस",
    "एकचाळीस", "बेचाळीस", "तेचाळीस", "चोवेचाळीस", "पंचेचाळीस", "सचेचाळीस", "सत्तेचाळीस", "अठ्ठेचाळीस", "एकोणपन्नास", "पन्नास",
    "एकपन्न", "बावन", "त्रिपन्न", "चौपन", "पंचावन", "सप्पन", "सत्तावन", "अठ्ठावन", "एकोणसाठ", "साठ",
    "एकसष्ठ", "बासष्ठ", "त्रेसष्ठ", "चौसष्ठ", "पायसष्ठ", "सहासष्ठ", "सदुसष्ठ", "अडुसष्ठ", "एकोणसत्तर", "सत्तर",
    "एकहत्तर", "बाहत्तर", "त्र्याहत्तर", "चौऱ्याहत्तर", "पंच्याहत्तर", "शहात्तर", "सत्त्याहत्तर", "अठ्ठ्याहत्तर", "एकोणऐंशी", "ऐंशी",
    "एक्याऐंशी", "ब्याऐंशी", "त्र्याऐंशी", "चौऱ्याऐंशी", "पंच्याऐंशी", "शहाऐंशी", "सत्त्याऐंशी", "अठ्ठ्याऐंशी", "एकोणनव्वद", "नव्वद",
    "एक्याण्णव", "ब्याण्णव", "त्र्याण्णव", "चौऱ्याण्णव", "पंच्याण्णव", "शहाण्णव", "सत्त्याण्णव", "अठ्ठ्याण्णव", "नव्याण्णव"
  ];

  let words = "";

  let temp = Math.floor(amount);
  const crores = Math.floor(temp / 10000000);
  temp %= 10000000;

  const lakhs = Math.floor(temp / 100000);
  temp %= 100000;

  const thousands = Math.floor(temp / 1000);
  temp %= 1000;

  const hundreds = Math.floor(temp / 100);
  temp %= 100;

  const remaining = temp;

  if (crores > 0) {
    words += (crores < 100 ? marathiNums[crores] : convertNumberToMarathiWords(crores)) + " कोटी ";
  }

  if (lakhs > 0) {
    words += marathiNums[lakhs] + " लाख ";
  }

  if (thousands > 0) {
    words += marathiNums[thousands] + " हजार ";
  }

  if (hundreds > 0) {
    words += marathiNums[hundreds] + "शे ";
  }

  if (remaining > 0) {
    words += marathiNums[remaining] + " ";
  }

  return words.trim() + " रुपये फक्त";
}

exports.generateReceiptPdf = async (rawDonation) => {
  let browser;
  try {
    const donation = typeof rawDonation.toObject === 'function' ? rawDonation.toObject() : { ...rawDonation };

    // Remove the donor's mobile number completely from the receipt
    if (donation.address) {
      donation.address = String(donation.address).replace(/\b\d{10}\b/g, '').trim();
    }

    const receiptDate = donation.approvalDate || donation.date || Date.now();
    const dateStr = new Date(receiptDate).toLocaleDateString("en-IN", {
      day: "2-digit", month: "2-digit", year: "numeric"
    });
    
    const receiptNo = donation.receiptNumber || donation.donationReference || `DON-${Date.now().toString().slice(-6)}`;
    const donorName = donation.donorName || donation.name || '';
    const address = donation.address || '';
    const amount = donation.amount ? donation.amount.toLocaleString("en-IN") : "0";
    const amountMarathi = convertNumberToMarathiWords(donation.amount || 0);

    const templatePath = path.join(__dirname, '../templates/donationTemplate.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    htmlContent = htmlContent.replace(/{{receiptNumber}}/g, receiptNo);
    htmlContent = htmlContent.replace(/{{date}}/g, dateStr);
    htmlContent = htmlContent.replace(/{{donorName}}/g, donorName);
    htmlContent = htmlContent.replace(/{{address}}/g, address);
    htmlContent = htmlContent.replace(/{{amountInWords}}/g, amountMarathi);
    htmlContent = htmlContent.replace(/{{amount}}/g, amount);

    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.emulateMediaType('print');
    
    // Set content and wait for network idle to ensure fonts are loaded
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Add a tiny delay just to be absolutely sure web fonts apply
    await new Promise(r => setTimeout(r, 500));

    const pdfBuffer = await page.pdf({
      format: 'A5',
      landscape: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();
    return pdfBuffer;
  } catch (err) {
    if (browser) await browser.close();
    console.error("Error generating receipt PDF:", err);
    throw err;
  }
};
