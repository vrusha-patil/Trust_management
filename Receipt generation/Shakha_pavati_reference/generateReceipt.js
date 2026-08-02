const PDFDocument = require("pdfkit");
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

// Helper to split Marathi amount words across two lines
function splitMarathiWords(words, maxCharLength) {
  if (!words || words.length <= maxCharLength) {
    return [words || "", ""];
  }
  const parts = words.split(" ");
  let line1 = "";
  let line2 = "";
  for (const part of parts) {
    if ((line1 + (line1 ? " " : "") + part).length <= maxCharLength) {
      line1 += (line1 ? " " : "") + part;
    } else {
      line2 += (line2 ? " " : "") + part;
    }
  }
  return [line1, line2];
}

function convertToMarathiScript(name) {
  if (!name) return "";
  const mappings = {
    "akanksha mali": "आकांक्षा माळी",
    "akanksha": "आकांक्षा",
    "amol patil": "अमोल पाटील",
    "amol": "अमोल"
  };
  const key = name.toLowerCase().trim();
  return mappings[key] || name;
}

exports.generateReceiptPdf = (donation, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const isShakha = donation.donationType === 'shakha_pavti';
      const showSingle = options.isUserSide || isShakha;
      const pageWidth = showSingle ? 520 : 794;
      const pageHeight = 420;
      const donorName = convertToMarathiScript(donation.donorName || "");

      const doc = new PDFDocument({ margin: 0, size: [pageWidth, pageHeight] });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // Font Paths
      const fontRegularPath = path.join(__dirname, '../assets/fonts/Poppins-Regular.ttf');
      const fontBoldPath = path.join(__dirname, '../assets/fonts/Poppins-Bold.ttf');
      const fontDevanagariPath = path.join(__dirname, '../assets/fonts/NotoSansDevanagari-Regular.ttf');
      const fontDevanagariBoldPath = path.join(__dirname, '../assets/fonts/NotoSansDevanagari-Bold.ttf');
      const fontNotoSerifPath = path.join(__dirname, '../assets/fonts/NotoSerifDevanagari-Regular.ttf');
      const fontNotoSerifBoldPath = path.join(__dirname, '../assets/fonts/NotoSerifDevanagari-Bold.ttf');
      const fontKalamPath = path.join(__dirname, '../assets/fonts/Kalam-Regular.ttf');
      const fontKalamBoldPath = path.join(__dirname, '../assets/fonts/Kalam-Bold.ttf');

      // Register fonts if available
      if (fs.existsSync(fontRegularPath)) doc.registerFont('Poppins', fontRegularPath);
      if (fs.existsSync(fontBoldPath)) doc.registerFont('Poppins-Bold', fontBoldPath);
      if (fs.existsSync(fontDevanagariPath)) doc.registerFont('NotoSans', fontDevanagariPath);
      if (fs.existsSync(fontDevanagariBoldPath)) doc.registerFont('NotoSans-Bold', fontDevanagariBoldPath);
      if (fs.existsSync(fontNotoSerifPath)) doc.registerFont('NotoSerif', fontNotoSerifPath);
      if (fs.existsSync(fontNotoSerifBoldPath)) doc.registerFont('NotoSerif-Bold', fontNotoSerifBoldPath);
      if (fs.existsSync(fontKalamPath)) doc.registerFont('Kalam', fontKalamPath);
      if (fs.existsSync(fontKalamBoldPath)) doc.registerFont('Kalam-Bold', fontKalamBoldPath);

      const setFont = (fontName, size) => {
        if (['NotoSans', 'NotoSans-Bold', 'NotoSerif', 'NotoSerif-Bold', 'Kalam', 'Kalam-Bold'].includes(fontName)) {
          const fontPath = fontName === 'NotoSans' ? fontDevanagariPath :
                           fontName === 'NotoSans-Bold' ? fontDevanagariBoldPath :
                           fontName === 'NotoSerif' ? fontNotoSerifPath :
                           fontName === 'NotoSerif-Bold' ? fontNotoSerifBoldPath :
                           fontName === 'Kalam' ? fontKalamPath : fontKalamBoldPath;
          if (fs.existsSync(fontPath)) {
            doc.font(fontName).fontSize(size);
            return;
          }
        }
        if (fontName.includes('Bold')) {
          if (fs.existsSync(fontBoldPath)) doc.font('Poppins-Bold').fontSize(size);
          else doc.font('Helvetica-Bold').fontSize(size);
        } else {
          if (fs.existsSync(fontRegularPath)) doc.font('Poppins').fontSize(size);
          else doc.font('Helvetica').fontSize(size);
        }
      };

      // Helper to scale text dynamically to fit width on a single line in PDFKit
      const writeSingleLineText = (text, x, y, width, baseSize, minSize, fontName = 'NotoSans-Bold', align = 'center') => {
        let size = baseSize;
        setFont(fontName, size);
        let safety = 0;
        while (doc.widthOfString(text) > width && size > minSize && safety < 10) {
          size -= 0.5;
          setFont(fontName, size);
          safety++;
        }
        doc.text(text, x, y, { width: width, align: align });
      };

      const guruPath = path.join(__dirname, '../assets/guru_swamiji.png');
      const currentPath = path.join(__dirname, '../assets/current_swamiji.png');
      const shivaLingaLogoPath = path.join(__dirname, '../assets/shiva_linga_logo.png');

      // Palette
      const orangeBorder = '#F58220'; // Bright orange border surrounding entire receipt
      const maroon = '#8B2D3B'; // Deep maroon banner & pill & amount border
      const darkRed = '#D32F2F'; // Crimson red headings, diamond, धन्यवाद
      const blueGreyLine = '#5B7590'; // Blue-grey writing lines
      const yellow = '#D8B321'; // Yellow for 'पावती' text
      const darkBrown = '#5B3B29';
      const black = '#222222';
      const inkBlue = '#1A365D'; // Dark blue ink for dynamic handwritten values

      // Format Date & Receipt No
      const dateStr = new Date(donation.date || Date.now()).toLocaleDateString("en-IN", {
        day: "2-digit", month: "2-digit", year: "numeric"
      });
      const receiptNo = donation.receiptNumber || donation.donationReference || "901";

      // Generate words
      const amountMarathi = convertNumberToMarathiWords(donation.amount || 0);

      const branchName = donation.branchId?.name || (donation.branchId ? (typeof donation.branchId === 'object' ? donation.branchId.name : donation.branchId) : null) || "कोळे";
      const purposeText = donation.message || donation.annadaanType || "साधारण देणगी";

      if (showSingle) {
        // Devotee Receipt with Pure Orange Background
        doc.rect(0, 0, 520, 420).fill(orangeBorder);
        doc.roundedRect(14, 14, 492, 392, 4).fill('white');
        doc.roundedRect(14, 14, 492, 392, 4).strokeColor(maroon).lineWidth(1).stroke();
      } else {
        // Booklet/Office Copy with Pure Orange Background
        doc.rect(0, 0, 794, 420).fill(orangeBorder);
        doc.roundedRect(14, 14, 260, 392, 4).fill('white');
        doc.roundedRect(14, 14, 260, 392, 4).strokeColor(maroon).lineWidth(1).stroke();

        // Separator Dotted Line
        doc.save();
        doc.lineWidth(1).dash(2, { space: 2 }).strokeColor('#A0A0A0').moveTo(281, 14).lineTo(281, 406).stroke().undash();
        doc.restore();

        doc.roundedRect(288, 14, 492, 392, 4).fill('white');
        doc.roundedRect(288, 14, 492, 392, 4).strokeColor(maroon).lineWidth(1).stroke();
      }

      // --- COUNTERFOIL (LEFT CARD) CONTENT (Only for Double Slip) ---
      if (!showSingle) {
        doc.fillColor(darkBrown);
        setFont('NotoSans', 9.5);
        doc.text("।। धर्माने विश्वाला शांती मिळते ।।", 14, 18, { width: 260, align: 'center' });

        doc.fillColor(darkRed);
        writeSingleLineText("श्री गुरुमूर्ती रुद्रपशुपती लिंगायत मठ संस्थान", 14, 30, 260, 11, 8.5, 'NotoSerif-Bold', 'center');

        doc.fillColor('#333333');
        setFont('NotoSans', 7.8);
        doc.text("पत्रव्यवहार पत्ता : श्री गुरुमूर्ती रुद्रपशुपती मठ, मु.पो. कोळे", 14, 44, { width: 260, align: 'center' });
        doc.text("ता.सांगोला, जि.सोलापूर ४१३३१४", 14, 55, { width: 260, align: 'center' });

        // Left Maroon Trust Capsule (shifted down to maintain spacing)
        doc.roundedRect(70, 67, 120, 16, 8).fill(maroon);
        doc.fillColor('white');
        setFont('NotoSans-Bold', 8.5);
        doc.text("ट्रस्ट नं.: ए/१७५०", 70, 71, { width: 120, align: 'center' });

        // Left Banner with Curved Block (indented by 10px from borders, shifted down to start at y = 88)
        doc.save();
        doc.path('M 24 88 L 104 88 L 92 116 L 24 116 Z').fill(maroon);
        doc.path('M 107 88 L 264 88 L 264 116 L 95 116 Z').fill('#EEEEEE');
        doc.path('M 107 88 L 264 88 L 264 116 L 95 116 Z').strokeColor(maroon).lineWidth(1).stroke();
        doc.restore();

        doc.fillColor(yellow);
        setFont('NotoSans-Bold', 12.5);
        doc.text("पावती", 24, 95.5, { width: 80, align: 'center' });

        doc.fillColor(maroon);
        setFont('NotoSans-Bold', 11);
        doc.text("शाखा मठ -", 112, 96.5);
        doc.fillColor(inkBlue);
        setFont('Kalam', 12.5);
        doc.text(branchName, 160, 95.5);

        // Left Metadata Row
        doc.fillColor(black);
        setFont('NotoSans-Bold', 9.5);
        doc.text("पावती क्र.", 22, 145);
        doc.fillColor(darkRed);
        setFont('NotoSans-Bold', 10.5);
        doc.text(receiptNo, 62, 145);

        doc.fillColor(black);
        setFont('NotoSans-Bold', 9.5);
        doc.text("दिनांक :", 168, 145);
        doc.lineWidth(0.75).strokeColor(blueGreyLine).moveTo(202, 153).lineTo(266, 153).stroke();
        doc.fillColor(inkBlue);
        setFont('Kalam', 11.5);
        doc.text(dateStr, 204, 141);

        // Left Form Fields (4 lines)
        // Line 1: Name
        doc.fillColor(black);
        setFont('NotoSans-Bold', 12);
        doc.text("श्री/सौ/श्रीमती", 22, 175);
        doc.lineWidth(0.75).strokeColor(blueGreyLine).moveTo(96, 183).lineTo(266, 183).stroke();
        doc.fillColor(inkBlue);
        setFont('Kalam', 14.5);
        doc.text(donorName, 100, 170, { width: 158, height: 14, ellipsis: true });

        // Line 2: Purpose
        doc.fillColor(black);
        setFont('NotoSans-Bold', 12);
        doc.text("आपणाकडून आज रोजी", 22, 205);
        doc.lineWidth(0.75).strokeColor(blueGreyLine).moveTo(134, 213).lineTo(266, 213).stroke();
        doc.fillColor(inkBlue);
        setFont('Kalam', 14.5);
        doc.text(purposeText, 138, 200, { width: 120, height: 14, ellipsis: true });

        // Line 3: Amount words (Part 1)
        const leftSplitWords = splitMarathiWords(amountMarathi, 22);
        doc.fillColor(black);
        setFont('NotoSans-Bold', 12);
        doc.text("अक्षरी रुपये", 22, 235);
        doc.lineWidth(0.75).strokeColor(blueGreyLine).moveTo(80, 243).lineTo(266, 243).stroke();
        doc.fillColor(inkBlue);
        setFont('Kalam', 13);
        doc.text(leftSplitWords[0], 84, 230, { width: 175, height: 14, ellipsis: true });

        // Line 4: Amount words (Part 2) + dynamic receipt text
        doc.lineWidth(0.75).strokeColor(blueGreyLine).moveTo(22, 273).lineTo(180, 273).stroke();
        doc.fillColor(black);
        setFont('NotoSans-Bold', 12);
        doc.text("आज रोख मिळाले.", 184, 265);
        doc.fillColor(inkBlue);
        setFont('Kalam', 13);
        doc.text(leftSplitWords[1], 26, 260, { width: 150, height: 14, ellipsis: true });

        // Left Bottom Amount Box
        doc.save();
        doc.translate(37, 343);
        doc.rotate(45);
        doc.rect(-8, -8, 16, 16).fill(darkRed);
        doc.restore();
        doc.fillColor('white');
        setFont('Poppins-Bold', 10);
        doc.text("₹", 33.5, 338.5, { width: 7, align: 'center' });

        doc.roundedRect(50, 328, 90, 30, 15).fill('#FFFFFF');
        doc.roundedRect(50, 328, 90, 30, 15).strokeColor(maroon).lineWidth(1).stroke();
        doc.fillColor(inkBlue);
        setFont('Kalam-Bold', 14);
        doc.text(`₹ ${donation.amount ? donation.amount.toLocaleString() : "0"}`, 50, 335, { width: 90, align: 'center' });

        doc.fillColor(black);
        setFont('NotoSans-Bold', 9.5);
        doc.text("देणगी स्वीकारणाराची सही", 150, 338, { width: 116, align: 'right' });
      }

      // --- MAIN RECEIPT (RIGHT CARD) CONTENT ---
      // Apply horizontal offset based on mode (Devotee Single Card vs double slip)
      const offsetX = showSingle ? 14 : 288;

      doc.fillColor(darkBrown);
      setFont('NotoSans', 9.5);
      doc.text("।। धर्माने विश्वाला शांती मिळते ।।", offsetX, 18, { width: 492, align: 'center' });

      // Swamiji Pictures
      if (fs.existsSync(guruPath)) {
        doc.save();
        doc.roundedRect(offsetX + 10, 26, 70, 92, 4).clip();
        doc.image(guruPath, offsetX + 10, 26, { width: 70, height: 92 });
        doc.restore();
        doc.roundedRect(offsetX + 10, 26, 70, 92, 4).strokeColor(maroon).lineWidth(1).stroke();
      }

      if (fs.existsSync(currentPath)) {
        doc.save();
        doc.roundedRect(offsetX + 412, 26, 70, 92, 4).clip();
        doc.image(currentPath, offsetX + 412, 26, { width: 70, height: 92 });
        doc.restore();
        doc.roundedRect(offsetX + 412, 26, 70, 92, 4).strokeColor(maroon).lineWidth(1).stroke();
      }

      // Title & Address (Centered between photos) - restored equal spacing
      doc.fillColor(darkRed);
      writeSingleLineText("श्री गुरुमूर्ती रुद्रपशुपती लिंगायत मठ संस्थान", offsetX + 80, 32, 328, 15.5, 12, 'NotoSerif-Bold', 'center');

      doc.fillColor('#333333');
      setFont('NotoSans', 7.8);
      doc.text("पत्रव्यवहार पत्ता : श्री गुरुमूर्ती रुद्रपशुपती मठ, मु.पो. कोळे ता.सांगोला, जि.सोलापूर ४१३३१४", offsetX + 80, 52, { width: 328, align: 'center' });

      // Trust Badge Capsule (enlarged size)
      doc.roundedRect(offsetX + 186, 67.5, 120, 16, 8).fill(maroon);
      doc.fillColor('white');
      setFont('NotoSans-Bold', 8.5);
      doc.text("ट्रस्ट नं.: ए/१७५०", offsetX + 186, 71.5, { width: 120, align: 'center' });

      // Right Banner (Centered between Swamiji pictures, below trust badge - decreased width to 260px)
      doc.save();
      // Maroon block (width 80: from offsetX + 116 to offsetX + 196)
      doc.path(`M ${offsetX + 116} 86 L ${offsetX + 196} 86 L ${offsetX + 186} 114 L ${offsetX + 116} 114 Z`).fill(maroon);
      // Light grey block (width 177: from offsetX + 199 to offsetX + 376)
      doc.path(`M ${offsetX + 199} 86 L ${offsetX + 376} 86 L ${offsetX + 376} 114 L ${offsetX + 189} 114 Z`).fill('#EEEEEE');
      doc.path(`M ${offsetX + 199} 86 L ${offsetX + 376} 86 L ${offsetX + 376} 114 L ${offsetX + 189} 114 Z`).strokeColor(maroon).lineWidth(1).stroke();
      doc.restore();

      doc.fillColor(yellow);
      setFont('NotoSans-Bold', 12);
      doc.text("पावती", offsetX + 116, 93.5, { width: 70, align: 'center' });

      doc.fillColor(maroon);
      setFont('NotoSans-Bold', 10.5);
      doc.text("शाखा मठ -", offsetX + 199 + 10, 95.5);
      doc.fillColor(inkBlue);
      setFont('Kalam', 12);
      doc.text(branchName, offsetX + 199 + 60, 94.2);

      // Right Metadata Row (shifted down to y = 145)
      doc.fillColor(black);
      setFont('NotoSans-Bold', 9.5);
      doc.text("पावती क्र.", offsetX + 16, 145);
      doc.fillColor(darkRed);
      setFont('NotoSans-Bold', 11);
      doc.text(receiptNo, offsetX + 56, 145);

      doc.fillColor(black);
      setFont('NotoSans-Bold', 9.5);
      doc.text("दिनांक :", offsetX + 380, 145);
      doc.lineWidth(0.75).strokeColor(blueGreyLine).moveTo(offsetX + 414, 153).lineTo(offsetX + 476, 153).stroke();
      doc.fillColor(inkBlue);
      setFont('Kalam', 11.5);
      doc.text(dateStr, offsetX + 416, 141);

      // Right Form Fields (4 lines - shifted down)
      // Line 1: Name
      doc.fillColor(black);
      setFont('NotoSans-Bold', 12);
      doc.text("श्री/सौ/श्रीमती", offsetX + 16, 175);
      doc.lineWidth(0.75).strokeColor(blueGreyLine).moveTo(offsetX + 96, 183).lineTo(offsetX + 476, 183).stroke();
      doc.fillColor(inkBlue);
      setFont('Kalam', 14.5);
      doc.text(donorName, offsetX + 100, 170, { width: 368, height: 14, ellipsis: true });

      // Line 2: Purpose
      doc.fillColor(black);
      setFont('NotoSans-Bold', 12);
      doc.text("आपणाकडून आज रोजी", offsetX + 16, 205);
      doc.lineWidth(0.75).strokeColor(blueGreyLine).moveTo(offsetX + 134, 213).lineTo(offsetX + 440, 213).stroke();
      doc.fillColor(black);
      setFont('NotoSans-Bold', 12);
      doc.text("यासाठी", offsetX + 446, 205);
      doc.fillColor(inkBlue);
      setFont('Kalam', 14.5);
      doc.text(purposeText, offsetX + 138, 200, { width: 298, height: 14, ellipsis: true });

      // Line 3: Amount words (Part 1)
      const rightSplitWords = splitMarathiWords(amountMarathi, 40);
      doc.fillColor(black);
      setFont('NotoSans-Bold', 12);
      doc.text("अक्षरी रुपये", offsetX + 16, 235);
      doc.lineWidth(0.75).strokeColor(blueGreyLine).moveTo(offsetX + 80, 243).lineTo(offsetX + 476, 243).stroke();
      doc.fillColor(inkBlue);
      setFont('Kalam', 13);
      doc.text(rightSplitWords[0], offsetX + 84, 230, { width: 385, height: 14, ellipsis: true });

      // Line 4: Amount words (Part 2) + dynamic receipt text
      doc.lineWidth(0.75).strokeColor(blueGreyLine).moveTo(offsetX + 16, 273).lineTo(offsetX + 380, 273).stroke();
      doc.fillColor(black);
      setFont('NotoSans-Bold', 12);
      doc.text("आज रोख मिळाले.", offsetX + 386, 265);
      doc.fillColor(inkBlue);
      setFont('Kalam', 13);
      doc.text(rightSplitWords[1], offsetX + 20, 260, { width: 350, height: 14, ellipsis: true });

      // Right Bottom Amount Box
      doc.save();
      doc.translate(offsetX + 23, 343);
      doc.rotate(45);
      doc.rect(-8, -8, 16, 16).fill(darkRed);
      doc.restore();
      doc.fillColor('white');
      setFont('Poppins-Bold', 10);
      doc.text("₹", offsetX + 19.5, 338.5, { width: 7, align: 'center' });

      doc.roundedRect(offsetX + 36, 328, 115, 30, 15).fill('#FFFFFF');
      doc.roundedRect(offsetX + 36, 328, 115, 30, 15).strokeColor(maroon).lineWidth(1).stroke();
      doc.fillColor(inkBlue);
      setFont('Kalam-Bold', 14);
      doc.text(`₹ ${donation.amount ? donation.amount.toLocaleString() : "0"}`, offsetX + 36, 335, { width: 115, align: 'center' });

      // Yellow Oval Shivalinga Logo & Thank you
      if (fs.existsSync(shivaLingaLogoPath)) {
        doc.image(shivaLingaLogoPath, offsetX + 172, 329, { width: 44, height: 28 });
      }
      doc.fillColor(darkRed);
      setFont('Kalam-Bold', 16);
      doc.text("धन्यवाद!", offsetX + 224, 335);

      // Right Bottom Signature
      doc.fillColor(black);
      setFont('NotoSans-Bold', 9.5);
      doc.text("देणगी स्वीकारणाराची सही", offsetX + 356, 338, { width: 120, align: 'right' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
