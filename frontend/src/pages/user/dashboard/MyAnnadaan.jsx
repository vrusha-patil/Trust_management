import React, { useEffect, useState } from 'react';
import { getMyAnnadaan, downloadAnnadaanReceipt, cancelAnnadaan } from '../../../services/userDashboardService';
import { RowSkeleton } from '../../../components/dashboard/LoadingSkeleton';
import EmptyState from '../../../components/dashboard/EmptyState';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import { FaCalendarAlt, FaClock, FaPhoneAlt, FaEnvelope, FaUtensils, FaInfoCircle, FaFileDownload, FaEye, FaTimes, FaSpinner } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';

export const MyAnnadaan = () => {
  const [loading, setLoading] = useState(true);
  const [annadaans, setAnnadaans] = useState([]);
  const [viewReceiptModal, setViewReceiptModal] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');

  const fetchAnnadaan = async () => {
    try {
      setLoading(true);
      const res = await getMyAnnadaan();
      if (res.data?.success) {
        setAnnadaans(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch annadaan records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnadaan();
  }, []);

  const handleCancelSeva = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this seva? This action cannot be undone and will permanently delete the record.")) return;
    
    try {
      toast.loading('Cancelling seva...', { id: 'cancel' });
      const res = await cancelAnnadaan(id);
      if (res.data?.success) {
        toast.success('Seva cancelled successfully.', { id: 'cancel' });
        fetchAnnadaan(); // refresh list
      }
    } catch (err) {
      console.error("Failed to cancel seva:", err);
      toast.error(err.response?.data?.message || 'Failed to cancel seva', { id: 'cancel' });
    }
  };

  const handleViewReceipt = async (id) => {
    try {
      toast.loading('Opening receipt preview...', { id: 'receipt_view' });
      const response = await downloadAnnadaanReceipt(id);
      
      if (!response.data) {
        throw new Error('Failed to download receipt');
      }
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      setViewReceiptModal(id);
      toast.dismiss('receipt_view');
    } catch (error) {
      console.error('Error viewing receipt:', error);
      toast.error('Failed to view receipt', { id: 'receipt_view' });
    }
  };

  const handleCloseModal = () => {
    if (pdfBlobUrl) window.URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl('');
    setViewReceiptModal(null);
  };

  const handleDownloadReceipt = async (id) => {
    try {
      toast.loading('Generating receipt...', { id: 'receipt' });
      const response = await downloadAnnadaanReceipt(id);
      
      if (!response.data) {
        throw new Error('Failed to download receipt');
      }
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Annadaan_Receipt_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Receipt generated!', { id: 'receipt' });
    } catch (error) {
      console.error('Error handling receipt:', error);
      toast.error('Failed to generate receipt', { id: 'receipt' });
    }
  };

  const approvedAnnadaans = annadaans.filter(d => d.status === 'approved' || d.status === 'completed');
  const pendingAnnadaans = annadaans.filter(d => !d.status || d.status === 'pending');
  const rejectedAnnadaans = annadaans.filter(d => d.status === 'rejected');

  const renderAnnadaanRow = (d) => (
    <tr key={d._id} className="hover:bg-cream/20 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-mahakal-saffron flex-shrink-0">
            <FaUtensils size={14} />
          </div>
          <div>
            <p className="font-black text-caramel-deep">{d.annadaanType}</p>
            <p className="text-[11px] font-black text-caramel-dark/70 truncate max-w-[150px]">{d.description || 'No special instructions'}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-0.5 text-xs text-caramel-dark/80">
          <span className="font-black text-caramel-deep flex items-center gap-1.5">
            <FaCalendarAlt className="text-mahakal-saffron/70" />
            {new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1.5 font-black mt-1">
            <FaClock className="text-mahakal-saffron/70" />
            {d.time}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1 text-[11px] text-caramel-dark/80 font-black">
          {d.phone && <span className="flex items-center gap-1.5"><FaPhoneAlt className="text-mahakal-saffron/50" /> {d.phone}</span>}
          {d.email && <span className="flex items-center gap-1.5"><FaEnvelope className="text-mahakal-saffron/50" /> {d.email}</span>}
        </div>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={d.status || 'pending'} />
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex flex-wrap gap-2 justify-center">
          {(d.status === 'approved' || d.status === 'completed') && (
            <>
              <button 
                onClick={() => handleViewReceipt(d._id)}
                title="View Receipt"
                className="inline-flex items-center justify-center p-2 rounded-full text-sky-600 bg-white border border-cream-dark/20 hover:bg-slate-50 shadow-sm transition-all transform hover:-translate-y-0.5"
              >
                <FaEye size={14} />
              </button>
              <button 
                onClick={() => handleDownloadReceipt(d._id)}
                title="Download Receipt"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                <FaFileDownload size={14} /> Receipt
              </button>
            </>
          )}

          {(!d.status || d.status === 'pending') && (
              <button 
                onClick={() => handleCancelSeva(d._id)}
                title="Cancel Seva"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm transition-all transform hover:-translate-y-0.5"
              >
                ✕ Cancel
              </button>
          )}
          
          {d.status === 'rejected' && (
            <span className="text-xs font-black text-stone-400">N/A</span>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />

      {loading ? (
        <RowSkeleton count={4} />
      ) : annadaans.length === 0 ? (
        <div className="py-12">
          <EmptyState
            title="No Annadaan Registrations Found"
            description="Annadaan is the sacred offering of food. Register to distribute food to devotees and seekers."
            actionText="Register for Annadaan"
            onAction={() => window.location.href = '/annadaan'}
            icon={FaUtensils}
          />
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Approved Section */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cream-dark/20 shadow-soft overflow-hidden">
            <div className="p-4 border-b border-cream-dark/20 flex justify-between items-center bg-white/50">
              <h3 className="text-sm sm:text-base text-caramel-deep font-black font-serif flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-black shrink-0">✓</div>
                <span>Approved Sevas</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse text-left">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700">
                    <th className="px-6 py-4">Seva Type</th>
                    <th className="px-6 py-4">Scheduled For</th>
                    <th className="px-6 py-4">Contact Info</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-dark/10 text-sm">
                  {approvedAnnadaans.length > 0 ? (
                    approvedAnnadaans.map(renderAnnadaanRow)
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-caramel-dark/50 font-black">
                        No approved sevas yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Section */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cream-dark/20 shadow-soft overflow-hidden">
            <div className="p-4 border-b border-cream-dark/20 flex justify-between items-center bg-white/50">
              <h3 className="text-sm sm:text-base text-caramel-deep font-black font-serif flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 shrink-0"><FaInfoCircle size={12}/></div>
                <span>Pending Verification</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse text-left">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700">
                    <th className="px-6 py-4">Seva Type</th>
                    <th className="px-6 py-4">Scheduled For</th>
                    <th className="px-6 py-4">Contact Info</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-dark/10 text-sm">
                  {pendingAnnadaans.length > 0 ? (
                    pendingAnnadaans.map(renderAnnadaanRow)
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-caramel-dark/50 font-black">
                        No pending sevas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rejected Section */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cream-dark/20 shadow-soft overflow-hidden">
            <div className="p-4 border-b border-cream-dark/20 flex justify-between items-center bg-white/50">
              <h3 className="text-sm sm:text-base text-caramel-deep font-black font-serif flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-black shrink-0">✕</div>
                <span>Rejected Sevas</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse text-left">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700">
                    <th className="px-6 py-4">Seva Type</th>
                    <th className="px-6 py-4">Scheduled For</th>
                    <th className="px-6 py-4">Contact Info</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-dark/10 text-sm">
                  {rejectedAnnadaans.length > 0 ? (
                    rejectedAnnadaans.map(renderAnnadaanRow)
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-caramel-dark/50 font-black">
                        No rejected sevas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Receipt View Modal */}
      {viewReceiptModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-cream-dark/20">
            <div className="p-4 sm:p-5 border-b border-cream-dark/20 flex justify-between items-center bg-white/80">
              <h2 className="text-lg sm:text-xl font-black text-caramel-deep flex flex-wrap items-center gap-2">
                <span>Receipt Preview</span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full font-bold">{viewReceiptModal.substring(0,8)}</span>
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-gray-800 rounded-full hover:bg-gray-200 transition">
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-3 sm:p-6 flex-grow overflow-hidden flex justify-center items-center bg-gray-100/50 min-h-[550px]">
              {pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  className="w-full h-[580px] rounded-xl border border-gray-200 shadow-sm bg-white"
                  title={`Receipt-${viewReceiptModal}`}
                />
              ) : (
                <FaSpinner className="animate-spin text-4xl text-gray-400" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAnnadaan;

