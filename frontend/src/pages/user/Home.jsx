import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import CountUpRaw from 'react-countup';
const CountUp = CountUpRaw.default || CountUpRaw;
import { Link } from 'react-router-dom';
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { FaBookOpen, FaCalendarAlt, FaChevronRight, FaHands, FaLeaf, FaMapMarkerAlt, FaOm, FaPlay, FaPrayingHands, FaQuoteLeft, FaSearch, FaVideo, FaTimes, FaChevronLeft } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import herobg1 from "../../assets/kolekar1.jpeg";
import heroBg from "../../assets/hero_bg.jpeg";
import api from "../../utils/api";
import { getCurrentLiveStream } from '../../services/liveService';
import AudioPlayerWithLyrics from '../../components/AudioPlayerWithLyrics';
import EventMedia from '../../components/EventMedia';

const ASSETS_URL = import.meta.env.VITE_ASSETS_URL || "http://localhost:5000";

const getImageUrl = (url) => {
  if (!url) return "/about_images/kolekar_real_1.jpg";
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${ASSETS_URL}${url}`;
  return `${ASSETS_URL}/${url}`;
};

const StatCounter = ({ end, label, duration = 2.5, textColor = "text-[#4A0E0E]", labelColor = "text-stone-500" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.1 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center p-6 relative group"
    >
      <motion.span
        initial={{ scale: 0.5, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: false, amount: 0.1 }}
        transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
        className={`text-4xl md:text-6xl font-black ${textColor} mb-3 font-serif relative z-10 drop-shadow-sm`}
      >
        <CountUp end={end} duration={duration} enableScrollSpy scrollSpyOnce />+
      </motion.span>
      <span className={`font-black tracking-[0.15em] uppercase text-[10px] md:text-sm text-center ${labelColor} relative z-10`}>{label}</span>
      <div className="w-12 h-1 bg-[#FF8C00]/50 mt-4 relative z-10 group-hover:w-24 group-hover:bg-[#FF8C00] transition-all duration-500 rounded-full"></div>
    </motion.div>
  );
};


const Home = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [sliderNews, setSliderNews] = useState([]);
  const [selectedNewsImageIndex, setSelectedNewsImageIndex] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalDonation: 0,
    totalDevotees: 0,
    totalEvents: 0,
    totalAnnadan: 0
  });
  const { t } = useTranslation();

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 1000], [0, 300]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);

  const branchesSliderRef = useRef(null);

  const scrollBranchesLeft = () => {
    if (branchesSliderRef.current) {
      branchesSliderRef.current.scrollBy({ left: -350, behavior: 'smooth' });
    }
  };

  const scrollBranchesRight = () => {
    if (branchesSliderRef.current) {
      branchesSliderRef.current.scrollBy({ left: 350, behavior: 'smooth' });
    }
  };

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Suprabhatam');
    else if (hour < 18) setGreeting('Shubha Aparahna');
    else setGreeting('Shubha Sandhya');
  };

  const checkLiveStatus = async () => {
    try {
      const liveRes = await getCurrentLiveStream();
      if (liveRes.success) {
        setIsLive(liveRes.isLive);
      }
    } catch (error) {
      console.error("Failed to fetch live status", error);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      const res = await api.get('/events/public?filterStatus=upcoming&limit=2');
      setUpcomingEvents(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch upcoming events", error);
    }
  };

  const fetchAllEvents = async () => {
    try {
      const res = await api.get('/events/public');
      setAllEvents(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch all events", error);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data.branches || []);
    } catch (error) {
      console.error("Failed to fetch branches", error);
    }
  };

  const fetchSliderNews = async () => {
    try {
      const res = await api.get('/news/slider');
      setSliderNews(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch slider news", error);
    }
  };

  // removed slider timer logic

  const formatDateString = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  useEffect(() => {
    fetchUpcomingEvents();
    fetchSliderNews();
    const fetchStats = async () => {
      try {
        const response = await api.get('/stats/public');
        if (response.data.success) {
          setStats({
            totalDonation: response.data.stats.totalDonation || 0,
            totalDevotees: response.data.stats.totalDevotees || 0,
            totalEvents: response.data.stats.totalEvents || 0,
            totalAnnadan: response.data.stats.totalAnnadan || 0
          });
        }
      } catch (error) {
        console.error("Failed to fetch public stats", error);
      }
    };

    fetchAllEvents();
    fetchBranches();
    checkLiveStatus();
    fetchStats();
    updateGreeting();
  }, []);

  const PAGES = useMemo(() => [
    { title: "About Us", path: "/about", type: "Page" },
    { title: "Holy Monastrey", path: "/math-history", type: "Page" },
    { title: "Annadaan", path: "/annadaan", type: "Page" },
    { title: "Gallery", path: "/gallery", type: "Page" },
    { title: "Donations", path: "/donate", type: "Page" },
    { title: "History", path: "/math-history", type: "Page" },
    { title: "Lineage", path: "/lineage", type: "Page" },
    { title: "Philosophy", path: "/lineage", type: "Page" },
    { title: "Services & Pooja", path: "/services", type: "Page" },
    { title: "Trustee Board", path: "/trustee-board", type: "Page" }
  ], []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { pages: [], branches: [], events: [] };
    const query = searchQuery.toLowerCase();

    return {
      pages: PAGES.filter(p => p.title.toLowerCase().includes(query)),
      branches: branches.filter(b => b.name.toLowerCase().includes(query) || (b.address && b.address.toLowerCase().includes(query))),
      events: allEvents.filter(e => e.title.toLowerCase().includes(query) || (e.branch?.name && e.branch.name.toLowerCase().includes(query)))
    };
  }, [searchQuery, branches, allEvents, PAGES]);

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col font-sans selection:bg-primary/20 selection:text-[#4A0E0E] overflow-x-hidden text-stone-800">
      <Navbar />

      {/* Clean, Premium Hero Section */}
      <section className="relative w-full h-[90vh] min-h-[700px] overflow-hidden bg-stone-900 flex flex-col justify-center">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 w-full h-full"
        >
          <div className="absolute inset-0 bg-stone-900/60 z-10"></div>
          <img src={heroBg} alt="Temple Hero" className="w-full h-full object-cover object-top scale-105" />
        </motion.div>

        <div className="relative z-40 w-full max-w-5xl mx-auto px-6 pt-20 pb-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center w-full"
          >
            <div className="flex items-center gap-4 mb-6">
              <span className="w-16 h-px bg-white/30"></span>
              <FaOm className="text-white/80 text-3xl" />
              <span className="w-16 h-px bg-white/30"></span>
            </div>

            <h4 className="text-[#FF8C00] font-bold tracking-[0.3em] uppercase text-xs mb-4">{greeting}</h4>

            <h1 className="font-serif font-bold text-white mb-6 leading-[1.1] tracking-tight drop-shadow-lg">
              {t('home.hero_title_1', 'The Spiritual Peetha of')} <br className="hidden md:block" />
              {t('home.hero_title_2', 'Kolekar Maharaj')}
            </h1>

            <p className="text-base md:text-xl text-stone-200 font-light max-w-2xl mx-auto leading-relaxed mb-10 drop-shadow-md">
              A sacred sanctuary preserving the timeless wisdom of the Guru-Shishya parampara and the eternal truth of Veerashaiva Lingayat Dharma.
            </p>

            {/* Premium Glassmorphic Search Bar */}
            <div className="relative w-full max-w-xl mx-auto z-50">
              <div className="relative group">
                <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400 text-lg transition-colors group-focus-within:text-[#FF8C00] z-10" />
                <input
                  type="text"
                  placeholder={t('home.search_placeholder', 'Search events, branches, or pages...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-full pl-16 pr-6 py-4 text-white placeholder-stone-300 focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all shadow-lg text-sm md:text-base"
                />
              </div>

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {searchQuery.trim() && (searchResults.pages.length > 0 || searchResults.branches.length > 0 || searchResults.events.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 w-full mt-3 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden max-h-[350px] overflow-y-auto text-left border border-stone-100 custom-scrollbar z-50"
                  >
                    {searchResults.events.length > 0 && (
                      <div className="p-4 border-b border-stone-50">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Events</h4>
                        {searchResults.events.map(event => (
                          <Link key={event._id} to={`/events/${event.slug}`} className="flex items-center gap-4 p-3 hover:bg-stone-50 rounded-xl transition-colors group">
                            <div className="w-10 h-10 rounded-lg bg-[#FF8C00]/10 text-[#FF8C00] flex items-center justify-center shrink-0">
                              <FaCalendarAlt />
                            </div>
                            <div>
                              <div className="font-bold text-stone-800 text-sm group-hover:text-[#FF8C00] transition-colors">{event.title}</div>
                              <div className="text-xs text-stone-500 mt-0.5">{new Date(event.eventDate).toLocaleDateString()}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {searchResults.branches.length > 0 && (
                      <div className="p-4 border-b border-stone-50">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Branches</h4>
                        {searchResults.branches.map(branch => (
                          <Link key={branch._id} to={`/branches/${branch._id}`} className="flex items-center gap-4 p-3 hover:bg-stone-50 rounded-xl transition-colors group">
                            <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-500 flex items-center justify-center shrink-0">
                              <FaMapMarkerAlt />
                            </div>
                            <div>
                              <div className="font-bold text-stone-800 text-sm group-hover:text-[#FF8C00] transition-colors">{branch.name}</div>
                              <div className="text-xs text-stone-500 mt-0.5">{branch.city || branch.address || "Branch"}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {searchResults.pages.length > 0 && (
                      <div className="p-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Pages</h4>
                        {searchResults.pages.map(page => (
                          <Link key={page.path} to={page.path} className="flex items-center gap-4 p-3 hover:bg-stone-50 rounded-xl transition-colors group">
                            <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-500 flex items-center justify-center shrink-0">
                              <FaBookOpen />
                            </div>
                            <div className="font-bold text-stone-800 text-sm group-hover:text-[#FF8C00] transition-colors">{page.title}</div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Floating Quick Actions Bar - Elevated to sit perfectly in Hero */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="relative z-30 w-[95%] md:w-full max-w-4xl mx-auto transform translate-y-1/2 mb-[-60px]"
        >
          <div className="bg-stone-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-3 md:p-5 flex flex-row items-center justify-between gap-2 md:gap-6 shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-x-auto hide-scrollbar">

            <Link to="/events" className="flex-1 min-w-[140px] flex items-center justify-center gap-4 group p-2 md:p-4 rounded-2xl hover:bg-white/10 transition-all duration-300">
              <div className="relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-black/20 rounded-full border border-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.5)] group-hover:border-[#FF8C00] transition-colors shadow-inner">
                {isLive && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                )}
                {isLive && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-stone-900"></span>
                )}
                <FaVideo className={`text-xl ${isLive ? "text-red-400" : "text-[#FF8C00]"}`} />
              </div>
              <div className="text-left hidden sm:block">
                <h4 className="text-white font-bold text-[11px] md:text-base tracking-wide uppercase group-hover:text-[#FF8C00] transition-colors">Live Darshan</h4>
                <p className="text-stone-300 text-[10px] md:text-xs font-light">{isLive ? "Join Aarti" : "Timings"}</p>
              </div>
            </Link>

            <div className="w-px h-12 md:h-16 bg-white/20"></div>

            <Link to="/donate" className="flex-1 min-w-[140px] flex items-center justify-center gap-4 group p-2 md:p-4 rounded-2xl hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-black/20 rounded-full border border-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.5)] group-hover:border-[#FF8C00] transition-colors shadow-inner">
                <FaPrayingHands className="text-xl text-[#FF8C00]" />
              </div>
              <div className="text-left hidden sm:block">
                <h4 className="text-white font-bold text-[11px] md:text-base tracking-wide uppercase group-hover:text-[#FF8C00] transition-colors">Make Offering</h4>
                <p className="text-stone-300 text-[10px] md:text-xs font-light">Support Us</p>
              </div>
            </Link>

            <div className="w-px h-12 md:h-16 bg-white/20"></div>

            <Link to="/annadaan" className="flex-1 min-w-[140px] flex items-center justify-center gap-4 group p-2 md:p-4 rounded-2xl hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-black/20 rounded-full border border-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.5)] group-hover:border-[#FF8C00] transition-colors shadow-inner">
                <FaHands className="text-xl text-[#FF8C00]" />
              </div>
              <div className="text-left hidden sm:block">
                <h4 className="text-white font-bold text-[11px] md:text-base tracking-wide uppercase group-hover:text-[#FF8C00] transition-colors">Book Annadaan</h4>
                <p className="text-stone-300 text-[10px] md:text-xs font-light">Sponsor Meals</p>
              </div>
            </Link>

          </div>
        </motion.div>

      </section>

      {/* High-End Ultra Premium Structure */}

      {/* 1. Cinematic Quote & Overview Section */}
      <section className="py-16 lg:py-24 relative overflow-hidden bg-gray-50">
        {/* Animated Mesh Gradient Background Orbs (Hidden on mobile to reduce clutter) */}
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="hidden md:block absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-orange-400/20 to-rose-400/20 blur-[80px] pointer-events-none"
        />
        <motion.div 
          animate={{ rotate: -360, scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          className="hidden md:block absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-amber-300/20 to-orange-500/20 blur-[80px] pointer-events-none"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            
            {/* Left Side: Typography */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="lg:w-1/2"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white/50 text-orange-600 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-6 lg:mb-8 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span> Daily Spiritual Nectar
              </div>
              
              <div className="relative">
                <FaQuoteLeft className="absolute -top-6 -left-4 sm:-top-8 sm:-left-8 text-orange-500/10 text-6xl sm:text-8xl -z-10 transform -rotate-12" />
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 font-bold leading-snug lg:leading-[1.2] mb-6 lg:mb-8">
                  "True devotion is not found in seeking the divine externally, but in realizing the absolute purity within one's own soul."
                </h2>
              </div>
              
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-8 lg:mb-10 max-w-xl font-light">
                Guided by the divine light of the Guru-Shishya Parampara, these sacred teachings illuminate the path of righteousness, inner peace, and eternal harmony for all devotees.
              </p>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
                <Link to="/lineage" className="inline-flex items-center gap-2 sm:gap-3 px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 text-sm sm:text-base">
                  Explore Teachings <FaChevronRight size={12} className="sm:text-sm" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Side: Image with Floating Elements */}
            <div className="lg:w-1/2 w-full relative mt-8 lg:mt-0">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: false, amount: 0.1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white z-10 group"
              >
                <img src={herobg1} alt="Shri Rudrapashupati Maharaj" className="w-full h-[350px] sm:h-[450px] lg:h-[550px] object-cover object-top transition-transform duration-1000 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 sm:right-8">
                  <span className="inline-block px-2 py-1 sm:px-3 sm:py-1 bg-white/20 backdrop-blur-md rounded-lg text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-2 sm:mb-3 border border-white/30">Divine Lineage</span>
                  <h3 className="text-white text-2xl sm:text-3xl font-serif font-bold leading-tight">Shri Rudrapashupati Maharaj</h3>
                </div>
              </motion.div>

              {/* Floating Badge 1 (Hidden on mobile) */}
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -right-6 top-20 z-20 bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/50 items-center gap-4 hidden lg:flex"
              >
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <FaOm size={24} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Spiritual</p>
                  <p className="text-lg font-bold text-gray-900">Guidance</p>
                </div>
              </motion.div>

            </div>

          </div>
        </div>
      </section>

      {/* 2. Stunning Bento Heritage Section */}
      <section className="py-16 lg:py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16 relative z-10">
            <span className="text-orange-500 font-bold tracking-[0.2em] uppercase text-[10px] sm:text-sm block mb-2 sm:mb-3">Sacred Foundation</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-900">Heritage & Teachings</h2>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 relative z-10">
            
            {/* Structured Portrait Image Card */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 0.8 }}
              className="w-full lg:w-5/12 relative rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl group"
            >
              <img src="/about_images/kolekar_real_1.jpg" alt="Sacred Foundation" className="w-full aspect-square sm:aspect-[4/5] object-cover object-top transition-transform duration-[2s] group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
              
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-white/80 backdrop-blur-lg px-4 py-2 sm:px-6 sm:py-3 rounded-full shadow-lg border border-white/50"
              >
                <span className="text-orange-600 font-bold tracking-widest text-[10px] sm:text-sm uppercase">Est. Ages Ago</span>
              </motion.div>
            </motion.div>

            {/* Right Side: Stacked Glass Cards */}
            <div className="w-full lg:w-7/12 flex flex-col gap-6 lg:gap-8">
              
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                whileHover={{ y: -5 }}
                className="bg-gray-50 border border-gray-100 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-orange-500/10 rounded-full blur-[30px] sm:blur-[40px] group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white shadow-sm flex items-center justify-center text-orange-600 mb-4 sm:mb-6 border border-gray-100">
                  <FaBookOpen size={20} className="sm:text-2xl" />
                </div>
                <h4 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 mb-2 sm:mb-3">The Kole Throne</h4>
                <p className="text-gray-600 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
                  Spanning generations of divine grace, our history stands as a beacon of hope, preserving ancient rituals and eternal scriptures.
                </p>
                <Link to="/math-history" className="inline-flex items-center gap-2 text-gray-900 font-bold text-[10px] sm:text-sm uppercase tracking-wider hover:text-orange-600 transition-colors">
                  Read History <FaChevronRight size={10} className="sm:text-sm" />
                </Link>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                whileHover={{ y: -5 }}
                className="bg-orange-50 border border-orange-100 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white shadow-sm flex items-center justify-center text-orange-600 mb-4 sm:mb-6 border border-orange-50">
                  <FaOm size={20} className="sm:text-2xl" />
                </div>
                <h4 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 mb-2 sm:mb-3">Veerashaiva Dharma</h4>
                <p className="text-gray-700 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
                  Rooted in profound devotion to Lord Shiva, embracing universal equality, spiritual awakening, and selfless service.
                </p>
                <Link to="/about/veerashaiva-philosophy" className="inline-flex items-center gap-2 text-gray-900 font-bold text-[10px] sm:text-sm uppercase tracking-wider hover:text-orange-600 transition-colors">
                  Explore Philosophy <FaChevronRight size={10} className="sm:text-sm" />
                </Link>
              </motion.div>

            </div>
          </div>
        </div>
      </section>

      {/* News & Announcements Marquee Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden border-y border-stone-100">
        {/* Om Watermark Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <FaOm className="text-stone-900 opacity-[0.05] blur-3xl text-[20rem] md:text-[30rem] lg:text-[40rem]" />
        </div>

        <div className="max-w-[100vw] mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16 px-4 max-w-7xl mx-auto">
            <span className="text-orange-500 font-bold tracking-[0.2em] uppercase text-[10px] sm:text-sm block mb-2 sm:mb-3">LATEST NEWS</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-900">News & Announcements</h2>
          </div>

          {sliderNews.length > 0 ? (
            <div className="relative w-full overflow-hidden flex flex-col group py-4">
              <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
                {/* Render the array twice for seamless looping */}
                {[...sliderNews, ...sliderNews].map((news, idx) => (
                  <div 
                    key={idx}
                    className="w-[100vw] sm:w-[50vw] md:w-[33.33vw] lg:w-[25vw] flex-shrink-0 px-3 cursor-pointer block"
                    onClick={() => setSelectedNewsImageIndex(idx % sliderNews.length)}
                  >
                    <div className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 h-[250px] sm:h-[300px] md:h-[350px] relative group/card border border-stone-100">
                      <img 
                        src={getImageUrl(news.coverImage)} 
                        alt={news.title || 'News image'} 
                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-[#FAF9F5] rounded-[2rem] border border-stone-200/50 max-w-lg mx-auto z-10 relative">
              <p className="text-stone-500 font-light text-sm">No news updates available at this time.</p>
            </div>
          )}
        </div>
      </section>

      {/* 3. Elegantly Layered Leadership Section */}
      <section className="py-16 lg:py-24 bg-gray-50 relative overflow-hidden">
        {/* Soft Background Accent */}
        <div className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] lg:w-[800px] lg:h-[800px] bg-gradient-to-br from-orange-200/20 to-transparent rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            
            {/* Left Side: Text */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2"
            >
              <span className="text-orange-500 font-bold tracking-[0.2em] uppercase text-[10px] sm:text-sm block mb-2 sm:mb-3">Spiritual Leadership</span>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-900 mb-6 lg:mb-8 leading-tight">
                Vanshavali / Pithadipati
              </h3>
              
              <div className="relative pl-6 sm:pl-8 mb-8 sm:mb-10">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-orange-200 rounded-full"></div>
                <p className="text-gray-600 text-lg sm:text-xl leading-relaxed font-serif font-medium">
                  "The divine succession of revered masters guiding the Sansthan with profound wisdom, boundless compassion, and a steadfast dedication to the eternal truth."
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="bg-white p-5 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 sm:gap-3"
                >
                  <FaLeaf className="text-orange-500 text-xl sm:text-2xl" />
                  <div>
                    <h4 className="text-gray-900 font-bold mb-1 text-sm sm:text-base">Grace & Wisdom</h4>
                    <p className="text-xs sm:text-sm text-gray-500">A lineage rooted in timeless devotion.</p>
                  </div>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="bg-white p-5 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 sm:gap-3"
                >
                  <FaHands className="text-orange-500 text-xl sm:text-2xl" />
                  <div>
                    <h4 className="text-gray-900 font-bold mb-1 text-sm sm:text-base">Community Uplift</h4>
                    <p className="text-xs sm:text-sm text-gray-500">Guiding society toward harmony.</p>
                  </div>
                </motion.div>
              </div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
                <Link to="/lineage" className="inline-flex items-center gap-2 sm:gap-3 px-6 py-3 sm:px-8 sm:py-4 bg-gray-900 text-white font-bold rounded-xl shadow-xl hover:bg-gray-800 transition-colors text-sm sm:text-base">
                  Discover Our Lineage <FaChevronRight size={12} className="sm:text-sm" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Side: Floating Layered Portrait */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 1 }}
              className="lg:w-1/2 w-full relative h-[400px] sm:h-[500px] lg:h-[600px] flex items-center justify-center mt-8 lg:mt-0"
            >
              <div className="absolute inset-0 bg-orange-100 rounded-[2rem] sm:rounded-[3rem] transform rotate-3 scale-95 transition-transform duration-500 hover:rotate-6"></div>
              <div className="relative w-full h-[350px] sm:h-[450px] lg:h-[550px] bg-white p-3 sm:p-4 rounded-[2rem] sm:rounded-[3rem] shadow-2xl border border-white z-10 overflow-hidden">
                <img src={herobg1} alt="Spiritual Head" className="w-full h-full object-cover object-top rounded-[1.5rem] sm:rounded-[2rem]" />
                
                {/* Floating Info Tag inside Image */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 bg-white/90 backdrop-blur-md px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl shadow-2xl border border-white/50"
                >
                  <span className="flex items-center gap-2 text-gray-900 font-bold text-xs sm:text-sm">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse"></span> Divine Succession
                  </span>
                </motion.div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Explore Sansthan - Overlapping the Slate Section */}
      <section className="relative z-40 -mt-24 bg-[#FDFBF7] rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold/5 rounded-full blur-[150px] pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 flex items-center gap-4 justify-center">
              <span className="w-12 h-px bg-primary/40"></span> Discover More <span className="w-12 h-px bg-primary/40"></span>
            </h2>
            <h3 className="text-3xl md:text-5xl font-serif font-bold text-caramel-deep tracking-tight">Explore the Sansthan</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12">
            {[
              { to: "/about", img: "/about_images/kolekar_real_1.jpg", title: "About Us", desc: "Discover the roots and mission of our spiritual foundation.", offset: "lg:-translate-y-4" },
              { to: "/math-history", img: "/about_images/kolekar_real_3.jpg", title: "Holy Monastrey", desc: "The epicenter of worship and preservation of sacred texts.", offset: "lg:translate-y-8" },
              { to: "/annadaan", img: "/about_images/kolekar_real_2.jpg", title: "Annadaan", desc: "The sacred offering of food to devotees and the needy.", offset: "lg:-translate-y-4" },
              { to: "/gallery", img: "/about_images/kolekar_real_1.jpg", title: "Gallery", desc: "Visual memories of divine festivals and rituals.", offset: "lg:translate-y-8" }
            ].map((item, idx) => (
              <Link key={idx} to={item.to} className={`block relative h-[350px] md:h-[450px] lg:h-[500px] rounded-[2rem] overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.25)] border-0 bg-white flex flex-col transform ${item.offset}`}>
                <div className="flex-1 relative overflow-hidden bg-cream">
                  <div className="absolute inset-0 bg-cover bg-top opacity-70 group-hover:scale-105 transition-transform duration-1000" style={{ backgroundImage: `url('${item.img}')` }}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2 font-serif">{item.title}</h3>
                    <p className="text-gray-300 text-xs md:text-sm font-light line-clamp-2">{item.desc}</p>
                  </div>
                </div>
                <div className="bg-white p-6 flex justify-between items-center group-hover:bg-cream transition-colors">
                  <span className="text-primary font-bold text-xs uppercase tracking-widest">Explore</span>
                  <div className="w-10 h-10 rounded-full bg-cream border border-gold flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-all">
                    <FaChevronRight size={12} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Audio Player Section */}
      <section className="relative z-30 bg-[#FDFBF7] px-4 md:px-6 py-4 md:py-12">
        <div className="max-w-7xl mx-auto">
          <AudioPlayerWithLyrics />
        </div>
      </section>

      {/* Unified Metrics & Services Block - Blended */}
      <section className="relative z-30 bg-gradient-to-b from-[#FDFBF7] to-[#F9F6F0] overflow-hidden pb-32">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-5 pointer-events-none mix-blend-overlay"></div>

        {/* Services Section embedded within the unified block */}
        <div className="max-w-7xl mx-auto px-6 relative z-10 pt-20">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.h3
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6 tracking-tight"
            >
              {t('home.offerings_title') || 'Digital Temple Services'}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ delay: 0.1 }}
              className="text-caramel-dark text-lg max-w-2xl mx-auto font-light"
            >
              {t('home.offerings_desc') || 'We bring traditional devotional practices to the modern world, making your spiritual journey accessible and serene.'}
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
            {[
              { icon: FaPrayingHands, title: t('home.feature_donation_title') || "Online Donations", desc: t('home.feature_donation_desc') || "Securely contribute with various payment methods. Receipts generated instantly." },
              { icon: FaOm, title: "Annadaan Booking", desc: "Sponsor daily meals for devotees." },
              { icon: FaVideo, title: t('home.feature_live_title') || "Live Darshan", desc: t('home.feature_live_desc') || "Join us for daily aarti and darshan via high-quality live streaming." },
              { icon: FaCalendarAlt, title: "Events Conducted", desc: "Stay updated with past and upcoming spiritual camps." }
            ].map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.1 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className={`group bg-white rounded-[2rem] p-8 border-0 shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:border-gold hover:shadow-[0_30px_60px_rgba(0,0,0,0.2)] hover:-translate-y-2 transition-all duration-500 relative overflow-hidden flex flex-col items-center text-center`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-[30px] pointer-events-none transform translate-x-1/2 -translate-y-1/2 group-hover:bg-gold/30 transition-colors duration-500"></div>

                <div className="w-20 h-20 bg-gradient-to-br from-cream to-gold/20 rounded-full border border-gold/30 flex items-center justify-center mb-8 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                  <service.icon size={32} />
                </div>

                <h4 className="text-xl font-serif font-bold text-caramel-deep mb-4">{service.title}</h4>
                <p className="text-caramel-dark text-sm leading-relaxed font-light">
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Analytics seamlessly blended */}
        <div className="max-w-7xl mx-auto px-6 relative z-10 mt-12 mb-20">
          <div className="bg-white rounded-[3rem] p-6 md:p-16 shadow-[0_30px_80px_rgba(0,0,0,0.15)] border-0 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#FF8C00]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 md:divide-x divide-stone-100 relative z-10">
              <StatCounter end={stats.totalDonation || 0} label="Unique Donors" duration={2.5} textColor="text-[#FF8C00]" labelColor="text-stone-800" />
              <StatCounter end={stats.totalDevotees || 0} label="Registered Devotees" duration={2} textColor="text-[#FF8C00]" labelColor="text-stone-800" />
              <StatCounter end={stats.totalEvents || 0} label="Events Conducted" duration={2} textColor="text-[#FF8C00]" labelColor="text-stone-800" />
              <StatCounter end={stats.totalAnnadan || 0} label="Annadan Entries" duration={1.5} textColor="text-[#FF8C00]" labelColor="text-stone-800" />
            </div>
          </div>
        </div>
      </section>

      {/* Unified Engagement Block: Events & Branches */}
      <section className="relative z-20 -mt-16 pt-32 pb-32 bg-white rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">

          {/* Events Sub-section */}
          <div className="mb-32">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div className="max-w-2xl text-center md:text-left">
                <h2 className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4">Join Us</h2>
                <h3 className="text-4xl md:text-5xl font-serif font-bold text-caramel-deep mb-6">{t('home.upcoming_events') || 'Upcoming Events'}</h3>
                <p className="text-caramel-dark text-lg font-light">{t('home.upcoming_events_desc') || 'Participate in divine celebrations and spiritual gatherings.'}</p>
              </div>
              <Link to="/events" className="hidden md:inline-flex px-8 py-3 bg-cream text-primary font-bold text-xs rounded-full border border-gold hover:bg-gold hover:text-white transition-all uppercase tracking-widest whitespace-nowrap">
                View All Events
              </Link>
            </div>

            <div className="grid lg:grid-cols-2 gap-10">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event, idx) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    className="flex flex-col md:flex-row bg-white rounded-3xl overflow-hidden group shadow-lg border border-stone-200 hover:shadow-2xl transition-all duration-500"
                  >
                    <div className="md:w-1/2 overflow-hidden shrink-0">
                      <EventMedia 
                        src={event.featuredImage || event.videoFile} 
                        alt={event.title}
                        aspectRatio="aspect-video h-full"
                        objectFit="cover"
                        allowLightbox={true}
                        className="rounded-none md:rounded-l-3xl"
                      />
                    </div>
                    <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-between relative z-10 bg-gradient-to-b from-white to-stone-50/50">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200/60 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {event.branch?.name || "Global"}
                          </span>
                          <div className="text-primary font-bold text-xs flex items-center gap-1.5 tracking-wider uppercase">
                            <FaCalendarAlt />
                            {new Date(event.eventDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                        <h4 className="text-xl md:text-2xl font-serif font-bold text-caramel-deep mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors">{event.title}</h4>
                        <p className="text-caramel-dark mb-6 text-xs md:text-sm line-clamp-3 font-light leading-relaxed">{event.shortDescription || event.fullDescription}</p>
                      </div>
                      <Link to={`/events/${event.slug}`} className="self-start inline-flex items-center gap-2 px-5 py-2.5 bg-cream text-primary border border-gold hover:bg-gold hover:text-white font-bold text-xs uppercase tracking-widest rounded-full transition-all duration-300 shadow-sm">
                        View Details <FaChevronRight size={10} />
                      </Link>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-1 lg:col-span-2 text-center py-16 bg-cream rounded-[2rem] border border-white shadow-inner">
                  <p className="text-caramel-dark text-lg font-light">More spiritual events coming soon. Stay tuned!</p>
                </div>
              )}
            </div>

            <div className="mt-10 text-center md:hidden">
              <Link to="/events" className="inline-flex px-8 py-3 bg-cream text-primary font-bold text-xs rounded-full border border-gold hover:bg-gold hover:text-white transition-all uppercase tracking-widest">
                View All Events
              </Link>
            </div>
          </div>

          {/* Branches Sub-section */}
          <div>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4">Temple Locations</h2>
              <h3 className="text-4xl md:text-5xl font-serif font-bold text-caramel-deep mb-6">Our Branches</h3>
              <p className="text-caramel-dark text-lg font-light">Find a Shri Rudrapashupati Kolekar Maharaj Sansthan branch near you.</p>
            </div>

            <div className="relative group mt-8">
              <button
                onClick={scrollBranchesLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 z-10 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl text-primary border border-gold/30 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 hidden md:flex"
              >
                <FaChevronRight className="rotate-180" />
              </button>

              <div
                ref={branchesSliderRef}
                className="flex gap-8 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-8 px-4"
              >
                {branches.map(branch => (
                  <motion.div
                    key={branch._id}
                    className="min-w-[280px] sm:min-w-[320px] md:min-w-[350px] snap-center bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-200 shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 text-center flex flex-col items-center"
                  >
                    <div className="w-16 h-16 bg-white rounded-full border border-gold/30 flex items-center justify-center mb-6 shadow-inner text-primary">
                      <FaMapMarkerAlt className="text-2xl" />
                    </div>
                    <h4 className="text-xl font-serif font-bold text-caramel-deep mb-3">{branch.name}</h4>
                    <p className="text-sm font-light text-caramel-dark mb-6 line-clamp-3">{branch.address}</p>
                    <Link to={`/branches/${branch._id}`} className="mt-auto inline-flex items-center gap-2 text-gold font-bold text-xs uppercase tracking-widest hover:text-primary transition-colors">
                      View Details <FaChevronRight size={10} />
                    </Link>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={scrollBranchesRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 z-10 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl text-primary border border-gold/30 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
              >
                <FaChevronRight />
              </button>
            </div>
            <div className="text-center mt-16">
              <Link to="/branches" className="px-10 py-4 bg-gradient-to-r from-[#4A0E0E] to-[#7B1113] text-white rounded-full font-bold uppercase tracking-widest hover:shadow-[0_0_20px_rgba(123,17,19,0.4)] transition-all text-xs inline-block border border-gold/30">
                View All Branches
              </Link>
            </div>
          </div>

        </div>
      </section>

      <Footer />

      {/* Fullscreen Lightbox Modal for News */}
      <AnimatePresence>
        {selectedNewsImageIndex !== null && sliderNews.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl"
            onClick={() => setSelectedNewsImageIndex(null)}
          >
            <button 
              className="absolute top-6 right-6 md:top-10 md:right-10 w-12 h-12 bg-white/10 hover:bg-[#FF8C00] hover:text-[#4A0E0E] text-white rounded-full flex items-center justify-center transition-colors border border-white/20 z-[110]"
              onClick={() => setSelectedNewsImageIndex(null)}
            >
              <FaTimes className="w-5 h-5" />
            </button>

            <button 
              className="absolute left-4 md:left-10 w-12 h-12 md:w-16 md:h-16 bg-white/5 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors border border-white/10 z-[110] backdrop-blur-md"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNewsImageIndex((prev) => (prev - 1 + sliderNews.length) % sliderNews.length);
              }}
            >
              <FaChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button 
              className="absolute right-4 md:right-10 w-12 h-12 md:w-16 md:h-16 bg-white/5 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors border border-white/10 z-[110] backdrop-blur-md"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNewsImageIndex((prev) => (prev + 1) % sliderNews.length);
              }}
            >
              <FaChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <div 
              className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-20"
              onClick={(e) => e.stopPropagation()} 
            >
              <motion.img
                key={selectedNewsImageIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                src={getImageUrl(sliderNews[selectedNewsImageIndex].coverImage)}
                alt="News"
                className="max-w-full max-h-[85vh] object-contain rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
