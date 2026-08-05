import React, { useState, useEffect } from 'react';
import { FiFileText, FiDownload, FiPrinter, FiSearch, FiMapPin, FiLayers } from 'react-icons/fi';
import { FaUserFriends, FaVenusMars } from 'react-icons/fa';
import api from '../../utils/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const FamilyReports = () => {
  const [reportType, setReportType] = useState('register');
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [reportData, setReportData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [largestFamilies, setLargestFamilies] = useState([]);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [reportType]);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch branches", err);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/family/reports/data');
      setStats(res.data.stats);
      setLargestFamilies(res.data.largestFamiliesList || []);
      
      const url = reportType === 'all' ? '/family/search?showAll=true' : '/family/search';
      const devRes = await api.get(url);
      setReportData(devRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredData = reportData.filter(d => {
    const matchesBranch = selectedBranch ? (d.branch && (d.branch._id === selectedBranch || d.branch === selectedBranch)) : true;
    const matchesSearch = searchTerm ? (
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.devoteeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.gotra && d.gotra.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.mobile && d.mobile.includes(searchTerm))
    ) : true;
    return matchesBranch && matchesSearch;
  });

  // Export CSV
  const exportExcel = () => {
    let headers = ["Devotee ID", "Full Name", "Gender", "Gotra", "Mobile", "Marital Status", "Generation", "Branch"];
    let rows = filteredData.map(d => [
      d.devoteeId,
      d.name,
      d.gender,
      d.gotra || "N/A",
      d.mobile || "N/A",
      d.maritalStatus || "Single",
      `Level ${d.generationLevel}`,
      d.branch?.name || "Main Trust"
    ]);

    let csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Vanshawal_Report_${reportType}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    const burgundy = [121, 26, 31];
    
    // --- Header ---
    doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Kolekar Mahaswamiji Monastery, Kole", 40, 40);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Shri Gurumurti Rudrapashupati Lingayat Math Sansthan", 40, 55);
    doc.text(`Generated On: ${new Date().toLocaleDateString()} | Report: ${reportType.toUpperCase()}`, 40, 70);
    
    doc.setDrawColor(200, 150, 100);
    doc.setLineWidth(1.5);
    doc.line(40, 85, 555, 85);

    // Table Content
    let tableHeaders, tableBody;
    if (reportType === 'largest') {
      tableHeaders = [["Family ID", "Family Head", "Branch", "Gotra", "Size"]];
      tableBody = largestFamilies.map(fam => [
        fam.familyId,
        fam.headName,
        fam.branch,
        fam.gotra,
        `${fam.size} Members`
      ]);
    } else {
      tableHeaders = [["ID", "Name", "Gender", "Gotra", "Mobile", "Gen", "Branch"]];
      tableBody = filteredData.map(d => [
        d.devoteeId,
        d.name,
        d.gender,
        d.gotra || "N/A",
        d.mobile || "N/A",
        `Lvl ${d.generationLevel}`,
        d.branch?.name || "Main Trust"
      ]);
    }

    autoTable(doc, {
      startY: 110,
      head: tableHeaders,
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: burgundy, textColor: [255, 255, 255] },
      didDrawPage: function (data) {
        // Footer
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.setFontSize(8);
        doc.text("Kolekar Mahaswamiji Monastery Trust © 2026", 40, pageHeight - 20);
      }
    });

    doc.save(`Vanshawal_Report_${reportType}.pdf`);
  };

  // Print friendly layout
  const printReport = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-8 pb-10 print:bg-white print:p-0">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-0 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FiFileText className="text-saffron-500" /> Vanshawal Report Generator
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Export, filter, and print customized lists of families, branches, and devotee registers.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <button onClick={exportPDF} className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition-colors flex justify-center items-center gap-2">
            <FiDownload className="shrink-0" /> Export PDF
          </button>
          <button onClick={exportExcel} className="w-full sm:w-auto px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex justify-center items-center gap-2">
            <FiDownload className="shrink-0" /> Export Excel
          </button>
          <button onClick={printReport} className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-colors flex justify-center items-center gap-2">
            <FiPrinter className="shrink-0" /> Print
          </button>
        </div>
      </div>

      {/* Filters (Hidden during Print) */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6 print:hidden">
        
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Report Sub-Type</label>
          <select 
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-saffron-500/20 focus:border-saffron-500 outline-none transition-all text-slate-700 cursor-pointer"
          >
            <option value="register">Lineage Heads (Family Register)</option>
            <option value="all">Complete Vanshawal Directory</option>
            <option value="largest">Largest Families</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Branch Shakha</label>
          <select 
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-saffron-500/20 focus:border-saffron-500 outline-none transition-all text-slate-700 cursor-pointer"
          >
            <option value="">All Branches</option>
            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Search Devotee</label>
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name, ID, gotra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-saffron-500/20 focus:border-saffron-500 outline-none transition-all text-slate-700"
            />
          </div>
        </div>

      </div>

      {/* Report Summary Header (Only printed/shown as header) */}
      <div className="hidden print:block text-center border-b pb-4 mb-6">
        <h2 className="text-xl font-bold text-slate-800">Kolekar Mahaswamiji Monastery, Kole</h2>
        <p className="text-xs text-slate-500">Official Vanshawal Registry Report - {reportType.toUpperCase()}</p>
        <p className="text-[10px] text-slate-400">Date: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Preview Table */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-[2rem] overflow-hidden border-t-4 border-t-saffron-500">
        <div className="overflow-x-auto">
          {reportType === 'largest' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="p-5 font-bold">Family ID (Head)</th>
                  <th className="p-5 font-bold">Family Head</th>
                  <th className="p-5 font-bold">Branch</th>
                  <th className="p-5 font-bold">Gotra</th>
                  <th className="p-5 font-bold">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                {largestFamilies.map((fam, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 text-saffron-600 font-black">{fam.familyId}</td>
                    <td className="p-5 text-slate-900 text-sm font-black">{fam.headName}</td>
                    <td className="p-5 text-slate-600">{fam.branch}</td>
                    <td className="p-5 text-slate-500">{fam.gotra}</td>
                    <td className="p-5">
                      <span className="bg-orange-50 text-orange-600 border border-orange-100 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                        {fam.size} Members
                      </span>
                    </td>
                  </tr>
                ))}
                {largestFamilies.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-slate-400 font-semibold">No family lineage statistics available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="p-5 font-bold">Devotee ID</th>
                  <th className="p-5 font-bold">Full Name</th>
                  <th className="p-5 font-bold">Gender</th>
                  <th className="p-5 font-bold">Gotra</th>
                  <th className="p-5 font-bold">Mobile</th>
                  <th className="p-5 font-bold">Marital Status</th>
                  <th className="p-5 font-bold">Generation</th>
                  <th className="p-5 font-bold">Branch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                {filteredData.map((d, idx) => (
                  <tr key={d._id || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 text-saffron-600 font-black">{d.devoteeId}</td>
                    <td className="p-5 text-slate-900 text-sm font-black">{d.name}</td>
                    <td className="p-5">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-black ${d.gender === 'Male' ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-600'}`}>
                        {d.gender}
                      </span>
                    </td>
                    <td className="p-5 text-slate-500">{d.gotra || "N/A"}</td>
                    <td className="p-5 text-slate-600">{d.mobile || "N/A"}</td>
                    <td className="p-5">{d.maritalStatus || "Single"}</td>
                    <td className="p-5 flex items-center gap-1 mt-1 text-slate-500"><FiLayers /> Level {d.generationLevel}</td>
                    <td className="p-5 text-slate-600">{d.branch?.name || "Main Trust"}</td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-10 text-center text-slate-400 font-semibold">No devotee matching active filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default FamilyReports;
