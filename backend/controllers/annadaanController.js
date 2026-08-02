const Annadaan = require('../models/Annadaan');
const sendEmail = require('../utils/sendEmail');
const { generateReceiptPdf } = require('../utils/generateReceipt');
const { englishToMarathi } = require('../utils/transliterate');

// @desc    Create new Annadaan request
// @route   POST /api/annadaan
// @access  Public
const createAnnadaan = async (req, res) => {
  try {
    const { name, phone, email, annadaanType, date, time, description, userId } = req.body;
    
    const finalUserId = userId || (req.user ? req.user._id : undefined);

    const annadaan = await Annadaan.create({
      name,
      phone,
      email,
      annadaanType,
      date,
      time,
      description,
      userId: finalUserId,
      status: 'pending' // Default pending
    });

    res.status(201).json({
      success: true,
      message: 'Your Annadaan request has been submitted successfully.',
      data: annadaan
    });
  } catch (error) {
    console.error('Error in createAnnadaan:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error. Please try again later.',
      error: error.message
    });
  }
};

// Helper for query filters
const buildAnnadaanFilterQuery = (req) => {
  let query = {};
  
  // Removed the Devotee user filtering so the public Seva History shows all records

  const { dateFilter, startDate, endDate } = req.query || {};

  let start = null;
  let end = new Date();

  if (dateFilter === "week") {
    end = new Date();
    end.setHours(0, 0, 0, 0);
    end.setMilliseconds(-1);
    start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (dateFilter === "month") {
    const today = new Date();
    start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    end = new Date(today.getFullYear(), today.getMonth(), 0);
    end.setHours(23, 59, 59, 999);
  } else if (dateFilter === "year") {
    const today = new Date();
    start = new Date(today.getFullYear() - 1, 0, 1);
    end = new Date(today.getFullYear() - 1, 11, 31);
    end.setHours(23, 59, 59, 999);
  } else if (dateFilter === "custom" && startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  }

  if (start) {
    query.createdAt = { $gte: start, $lte: end };
  }

  return query;
};

// @desc    Get all Annadaan requests
// @route   GET /api/annadaan
// @access  Public
const getAnnadaans = async (req, res) => {
  try {
    const query = buildAnnadaanFilterQuery(req);
    const requests = await Annadaan.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Error in getAnnadaans:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error. Please try again later.',
      error: error.message
    });
  }
};

// @desc    Update Annadaan request
// @route   PUT /api/annadaan/:id
// @access  Public / Admin / Trustee
const updateAnnadaan = async (req, res) => {
  try {
    const existing = await Annadaan.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Annadaan not found' });
    
    const wasPending = existing.status !== 'approved' && existing.status !== 'completed';

    const annadaan = await Annadaan.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    
    if (wasPending && annadaan.status === 'approved') {
      try {
        const transliteratedName = await englishToMarathi(annadaan.name);
        const transliteratedPurpose = await englishToMarathi(`Annadaan - ${annadaan.annadaanType}`);

                const pdfBuffer = await generateReceiptPdf({
          donorName: transliteratedName,
          amount: "Annadaan Seva",
          purpose: transliteratedPurpose,
          transactionId: `ANN-${annadaan._id.toString().substring(0, 8).toUpperCase()}`,
          paymentMethod: "N/A",
          date: annadaan.date,
          donationType: 'jama_pavti' // Force jama pavti for Annadaan if no other template suits it
        });

        // Upload to Cloudinary
        const { uploadToCloudinary } = require('../utils/cloudinaryHelper');
        const uploadRes = await uploadToCloudinary(pdfBuffer, "receipts", { resourceType: "auto" });
        if (uploadRes && uploadRes.url) {
          annadaan.receiptPdfUrl = uploadRes.url;
          annadaan.receiptPublicId = uploadRes.publicId;
          await annadaan.save();

          // Save to ReceiptArchive
          try {
            const ReceiptArchive = require('../models/ReceiptArchive');
            await ReceiptArchive.findOneAndUpdate(
              { receiptNumber: `ANN-${annadaan._id.toString().substring(0, 8).toUpperCase()}` },
              {
                receiptNumber: `ANN-${annadaan._id.toString().substring(0, 8).toUpperCase()}`,
                category: 'Annadan',
                referenceId: annadaan._id,
                referenceModel: 'Annadaan',
                dynamicData: {
                  donorName: transliteratedName,
                  annadaanType: annadaan.annadaanType,
                  amount: "Annadaan Seva"
                },
                pdfUrl: uploadRes.url,
                status: 'Generated',
                generatedBy: req.user ? req.user._id : annadaan.userId,
                generatedByModel: req.user && req.user.role ? req.user.role : 'Admin'
              },
              { upsert: true, new: true }
            );
          } catch (err) {
            console.warn("ReceiptArchive sync error in Annadaan:", err.message);
          }
        }

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #FF7A2F;">Annadaan Seva Approved</h2>
            <p>Dear <strong>${annadaan.name}</strong>,</p>
            <p>Thank you for your generous request for Annadaan Seva at Shri Gurumurti Kolekar Maharaj Sansthan.</p>
            <p>We are pleased to inform you that your request has been <strong>approved</strong> by the Temple Trustees.</p>
            <p>You can find the official receipt attached to this email. You can also view and download it directly from your dashboard under the <strong>My Annadan</strong> section.</p>
            <br/>
            <p>May the blessings of the divine be with you and your family.</p>
            <p>Warm regards,<br/><strong>Shri Gurumurti Kolekar Maharaj Sansthan</strong></p>
          </div>
        `;

        await sendEmail({
          email: annadaan.email,
          subject: 'Your Annadaan Seva Request is Approved',
          html: emailHtml,
          message: 'Your Annadaan request has been approved. Please find the attached receipt.',
          attachments: [
            {
              filename: `Annadaan_Receipt_${annadaan._id.toString().substring(0,8)}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
          ]
        });
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
        // Continue, don't fail the update request just because email failed
      }
    }

    res.status(200).json({ success: true, data: annadaan });
  } catch (error) {
    console.error('Error in updateAnnadaan:', error);
    res.status(500).json({ success: false, message: 'Server Error. Please try again later.', error: error.message });
  }
};

// @desc    Get Annadaan stats
// @route   GET /api/annadaan/stats
// @access  Public
const getStats = async (req, res) => {
  try {
    const matchQuery = buildAnnadaanFilterQuery(req);
    const totalRecords = await Annadaan.countDocuments(matchQuery);
    
    // Calculate total approved and rejected
    const approvedRecords = await Annadaan.countDocuments({ ...matchQuery, status: 'approved' });
    const rejectedRecords = await Annadaan.countDocuments({ ...matchQuery, status: 'rejected' });
    const pendingRecords = await Annadaan.countDocuments({ ...matchQuery, status: 'pending' });
    
    res.status(200).json({
      success: true,
      data: {
        totalRecords,
        totalApproved: approvedRecords,
        totalRejected: rejectedRecords,
        totalPending: pendingRecords
      }
    });
  } catch (error) {
    console.error('Error in getStats:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error. Please try again later.',
      error: error.message
    });
  }
};

module.exports = {
  createAnnadaan,
  getAnnadaans,
  updateAnnadaan,
  getStats
};
