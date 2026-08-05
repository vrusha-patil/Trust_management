import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  FiSearch,
  FiPlus,
  FiUser,
  FiMapPin,
  FiActivity,
  FiCheck,
  FiChevronRight,
  FiChevronLeft,
  FiX,
  FiLayers,
  FiFilter,
  FiTrendingUp,
  FiInfo,
  FiCalendar,
  FiClock,
} from "react-icons/fi";
import { FaUserFriends, FaCrown } from "react-icons/fa";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import VanshawalTree from "../../components/family/VanshawalTree";
import DevoteeProfileDetail from "../../components/family/DevoteeProfileDetail";
import { indiaStates, stateCities } from "../../data/indiaStatesAndCities";

const DevoteeVanshawal = () => {
  const { user } = useAuth();
  const isBranchManager = user?.role === "BranchManager";
  const isDevotee = user?.role === "Devotee";

  const [searchParams, setSearchParams] = useSearchParams();

  // Root tree visualizer state
  const activeFamilyRoot = searchParams.get("viewFamily") || null;
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  // Parse state from URL search params
  const initQuery = searchParams.get("q") || "";
  const initState = searchParams.get("state") || "";
  const initCity = searchParams.get("city") || "";
  const initVillage = searchParams.get("village") || "";
  const initBranch = searchParams.get("branchId") || "";
  const initSortBy = searchParams.get("sortBy") || "familyName";
  const initSortOrder = searchParams.get("sortOrder") || "asc";
  const initPage = parseInt(searchParams.get("page") || "1");

  // Dynamic filter state from URL
  const initSurname = searchParams.get("surname") || "";
  const initMinMembers = searchParams.get("minMembers") || "";
  const initMaxMembers = searchParams.get("maxMembers") || "";
  const initGenCount = searchParams.get("generationCount") || "";

  // React state fields
  const [searchQuery, setSearchQuery] = useState(initQuery);
  const [selectedState, setSelectedState] = useState(initState);
  const [selectedCity, setSelectedCity] = useState(initCity);
  const [selectedVillage, setSelectedVillage] = useState(initVillage);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState(initBranch);
  const [sortBy, setSortBy] = useState(initSortBy);
  const [sortOrder, setSortOrder] = useState(initSortOrder);
  const [currentPage, setCurrentPage] = useState(initPage);

  // Advanced Filter state
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [surnameFilter, setSurnameFilter] = useState(initSurname);
  const [minMembers, setMinMembers] = useState(initMinMembers);
  const [maxMembers, setMaxMembers] = useState(initMaxMembers);
  const [generationFilter, setGenerationFilter] = useState(initGenCount);

  // Dropdown list data
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [villages, setVillages] = useState([]);
  const [branches, setBranches] = useState([]);

  // Search Results
  const [searchResults, setSearchResults] = useState([]);
  const [devoteeResults, setDevoteeResults] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Search suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  // City families search state
  const [citySearchQuery, setCitySearchQuery] = useState("");

  // Modals / forms state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddRelativeModalOpen, setIsAddRelativeModalOpen] = useState(false);
  const [selectedRelative, setSelectedRelative] = useState(null);
  const [relationType, setRelationType] = useState("Son");
  const [submitting, setSubmitting] = useState(false);

  const initialFormState = {
    name: "",
    gender: "Male",
    dob: "",
    mobile: "",
    email: "",
    aadhaar: "",
    address: "",
    branch: "",
    kuldevta: "",
    bloodGroup: "",
    maritalStatus: "Single",
    village: "",
    taluka: "",
    state: "",
    city: "",
  };
  const [formData, setFormData] = useState(initialFormState);

  // Sync state to URL search parameters
  const updateUrlParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch branches, states, and load tree if viewFamily is in URL
  useEffect(() => {
    fetchBranches();
    fetchStates();
    if (activeFamilyRoot) {
      fetchFamilyMembers(activeFamilyRoot);
    } else {
      executeSearch();
    }
  }, [activeFamilyRoot, searchParams]);

  // Autocomplete Suggestions logic
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const delayDebounce = setTimeout(async () => {
      try {
        setSuggestionsLoading(true);
        const res = await api.get(
          `/family/search-suggestions?q=${encodeURIComponent(searchQuery)}`,
          {
            signal: controller.signal,
          },
        );
        setSuggestions(res.data.data || []);
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error(err);
        }
      } finally {
        setSuggestionsLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(delayDebounce);
      controller.abort();
    };
  }, [searchQuery]);

  // Fetch cities when selectedState changes
  useEffect(() => {
    if (selectedState) {
      fetchCities(selectedState);
    } else {
      setCities([]);
      setVillages([]);
    }
  }, [selectedState]);

  // Fetch villages when selectedCity changes
  useEffect(() => {
    if (selectedState && selectedCity) {
      fetchVillages(selectedState, selectedCity);
    } else {
      setVillages([]);
    }
  }, [selectedState, selectedCity]);

  const fetchBranches = async () => {
    try {
      const res = await api.get("/branches");
      setBranches(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStates = async () => {
    try {
      const res = await api.get("/family/filters/states");
      setStates(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCities = async (stateVal) => {
    try {
      const res = await api.get(
        `/family/filters/cities?state=${encodeURIComponent(stateVal)}`,
      );
      setCities(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVillages = async (stateVal, cityVal) => {
    try {
      const res = await api.get(
        `/family/filters/villages?state=${encodeURIComponent(stateVal)}&city=${encodeURIComponent(cityVal)}`,
      );
      setVillages(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFamilyMembers = async (rootId) => {
    try {
      setLoading(true);
      const res = await api.get(`/family/tree/${rootId}`);
      setFamilyMembers(res.data.data || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch family tree members.");
    } finally {
      setLoading(false);
    }
  };

  // Perform full search based on active filters
  const executeSearch = async () => {
    try {
      setSearching(true);
      const params = {
        q: searchQuery,
        state: selectedState,
        city: selectedCity,
        village: selectedVillage,
        branchId: selectedBranchFilter,
        surname: surnameFilter,
        minMembers,
        maxMembers,
        generationCount: generationFilter,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: 10,
      };

      const res = await api.get("/family/search", { params });
      setSearchResults(res.data.families || []);
      setDevoteeResults(res.data.devotees || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (err) {
      console.error(err);
      setError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setShowSuggestions(false);
    updateUrlParams({
      q: searchQuery,
      state: selectedState,
      city: selectedCity,
      village: selectedVillage,
      branchId: selectedBranchFilter,
      surname: surnameFilter,
      minMembers,
      maxMembers,
      generationCount: generationFilter,
      sortBy,
      sortOrder,
      page: 1,
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedState("");
    setSelectedCity("");
    setSelectedVillage("");
    setSelectedBranchFilter("");
    setSurnameFilter("");
    setGotraFilter("");
    setMinMembers("");
    setMaxMembers("");
    setGenerationFilter("");
    setCitySearchQuery("");
    setCurrentPage(1);
    setSearchParams(new URLSearchParams());
  };

  const handleSuggestionKeyDown = (e) => {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        Math.min(prev + 1, suggestions.length - 1),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (
        activeSuggestionIndex >= 0 &&
        activeSuggestionIndex < suggestions.length
      ) {
        const item = suggestions[activeSuggestionIndex];
        selectSuggestion(item);
      } else {
        handleSearchSubmit();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (item) => {
    setShowSuggestions(false);
    if (item.isFamilyHead) {
      updateUrlParams({ viewFamily: item.familyId || item._id });
    } else {
      setSelectedMemberId(item._id);
      updateUrlParams({ viewFamily: item.familyRootId });
    }
  };

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = { ...formData };
      if (isBranchManager) {
        payload.branch = user.branch;
      }
      const res = await api.post("/family/create", payload);
      setIsCreateModalOpen(false);
      setFormData(initialFormState);
      updateUrlParams({ viewFamily: res.data.data._id });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create family.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRelative = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        devoteeData: { ...formData },
        relationshipType: relationType,
        relativeId: selectedRelative._id,
      };
      if (isBranchManager) {
        payload.devoteeData.branch = user.branch;
      }
      await api.post("/family/add-member", payload);
      setIsAddRelativeModalOpen(false);
      setFormData(initialFormState);
      fetchFamilyMembers(activeFamilyRoot);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add family member.");
    } finally {
      setSubmitting(false);
    }
  };

  const triggerAddRelative = (relative, type = "Son") => {
    setSelectedRelative(relative);
    setRelationType(type);
    let defaultGender = "Male";
    if (["Daughter", "Mother", "Sister"].includes(type)) {
      defaultGender = "Female";
    } else if (type === "Spouse") {
      defaultGender = relative.gender === "Male" ? "Female" : "Male";
    }
    setFormData({
      ...initialFormState,
      gender: defaultGender,
      kuldevta: relative.kuldevta || "",
      address: relative.address || "",
      village: relative.village || "",
      taluka: relative.taluka || "",
      state: relative.state || "",
      city: relative.city || "",
      branch: relative.branch?._id || relative.branch || "",
    });
    setIsAddRelativeModalOpen(true);
  };

  // Filter city summaries locally based on city search input
  const filteredCityResults = searchResults.filter((head) => {
    if (!citySearchQuery) return true;
    const term = citySearchQuery.toLowerCase().trim();
    return (
      head.name.toLowerCase().includes(term) ||
      head.familyId?.toLowerCase().includes(term) ||
      head.mobile?.includes(term) ||
      head.village?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="w-full space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FaUserFriends className="text-saffron-500" /> Devotee Vanshawal
            Portal
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Browse state-wise, city-wise lineages, configure relationships, and
            discover devotee families.
          </p>
        </div>

        {!isDevotee && !activeFamilyRoot && (
          <button
            onClick={() => {
              setFormData(initialFormState);
              setIsCreateModalOpen(true);
            }}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <FiPlus /> Create New Vanshawal
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 font-bold p-4 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Main Search Layout */}
      {!activeFamilyRoot ? (
        <div className="space-y-6">
          {/* Top Panel: Hierarchical & Global Search controls */}
          <div className="bg-white border border-gray-150 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6">
            {/* Hierarchical Flow Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  State Filter
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedCity("");
                    setSelectedVillage("");
                    updateUrlParams({
                      state: e.target.value,
                      city: "",
                      village: "",
                      page: 1,
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-saffron-500/20"
                >
                  <option value="">Select State</option>
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  City Filter
                </label>
                <select
                  disabled={!selectedState}
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setSelectedVillage("");
                    updateUrlParams({
                      city: e.target.value,
                      village: "",
                      page: 1,
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-saffron-500/20 disabled:opacity-50"
                >
                  <option value="">Select City</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Village Filter
                </label>
                <select
                  disabled={!selectedCity}
                  value={selectedVillage}
                  onChange={(e) => {
                    setSelectedVillage(e.target.value);
                    updateUrlParams({ village: e.target.value, page: 1 });
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-saffron-500/20 disabled:opacity-50"
                >
                  <option value="">Select Village</option>
                  {villages.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Global Search box with Autocomplete */}
            <div className="relative" ref={suggestionsRef}>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                Global Search
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search by devotee name, family name, family head, mobile, devotee ID, family ID, city, village, or branch..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleSuggestionKeyDown}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-saffron-500/20 transition-all text-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    type="button"
                    className={`col-span-1 px-3 sm:px-5 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider border flex items-center justify-center gap-1.5 transition-colors ${
                      isAdvancedOpen
                        ? "bg-saffron-50 border-saffron-300 text-saffron-700"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <FiFilter className="shrink-0" /> <span className="truncate">Advanced</span>
                  </button>
                  <button
                    onClick={handleClearFilters}
                    type="button"
                    className="col-span-1 px-3 sm:px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center truncate"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleSearchSubmit}
                    className="col-span-2 sm:col-span-1 px-8 py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-[10px] sm:text-xs font-black shadow-md uppercase tracking-wider transition-colors flex items-center justify-center"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* suggestions list */}
              <AnimatePresence>
                {showSuggestions &&
                  (suggestions.length > 0 || suggestionsLoading) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-150 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100"
                    >
                      {suggestionsLoading && (
                        <div className="px-4 py-3 text-xs text-slate-400 font-medium text-center">
                          Loading suggestions...
                        </div>
                      )}
                      {suggestions.map((item, idx) => (
                        <div
                          key={item._id}
                          onClick={() => selectSuggestion(item)}
                          className={`p-4 text-left cursor-pointer transition-colors flex justify-between items-center ${
                            idx === activeSuggestionIndex
                              ? "bg-saffron-50/50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div>
                            <p className="font-bold text-slate-800 text-xs flex items-center gap-1">
                              {item.isFamilyHead ? (
                                <FaCrown className="text-saffron-500" />
                              ) : (
                                <FiUser className="text-slate-400" />
                              )}
                              {item.name}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              ID: {item.devoteeId} • {item.city}, {item.state}
                            </p>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black uppercase">
                            {item.isFamilyHead ? "Family" : "Devotee"}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
              </AnimatePresence>
            </div>

            {/* Expandable Advanced Filters */}
            <AnimatePresence>
              {isAdvancedOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                        Surname
                      </label>
                      <input
                        type="text"
                        value={surnameFilter}
                        onChange={(e) => setSurnameFilter(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                        Min Family Members
                      </label>
                      <input
                        type="number"
                        value={minMembers}
                        onChange={(e) => setMinMembers(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                        Max Family Members
                      </label>
                      <input
                        type="number"
                        value={maxMembers}
                        onChange={(e) => setMaxMembers(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                        Generations Count
                      </label>
                      <input
                        type="number"
                        value={generationFilter}
                        onChange={(e) => setGenerationFilter(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                      />
                    </div>
                    {!isBranchManager && (
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                          Branch
                        </label>
                        <select
                          value={selectedBranchFilter}
                          onChange={(e) =>
                            setSelectedBranchFilter(e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                        >
                          <option value="">All Branches</option>
                          {branches.map((b) => (
                            <option key={b._id} value={b._id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* City summary and Search within City section */}
          {selectedCity && (
            <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <FiInfo className="text-saffron-500 text-lg" />
                <div>
                  <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">
                    {selectedCity} Family Summary
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                    Found {searchResults.length} families in this city.
                  </p>
                </div>
              </div>

              <div className="relative w-full sm:w-64">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search families in this city..."
                  value={citySearchQuery}
                  onChange={(e) => setCitySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-250 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-saffron-500 focus:border-saffron-500"
                />
              </div>
            </div>
          )}

          {/* Results list grouped into Families & Devotees */}
          <div className="space-y-6">
            {/* Sort & pagination controls */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide">
                Search Results
              </h2>

              <div className="flex gap-3">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("-");
                    setSortBy(field);
                    setSortOrder(order);
                    updateUrlParams({
                      sortBy: field,
                      sortOrder: order,
                      page: 1,
                    });
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="familyName-asc">Family Name A-Z</option>
                  <option value="familyName-desc">Family Name Z-A</option>
                  <option value="familyHead-asc">Family Head A-Z</option>
                  <option value="familyHead-desc">Family Head Z-A</option>
                  <option value="memberCount-desc">Most Members First</option>
                  <option value="memberCount-asc">Fewest Members First</option>
                  <option value="createdAt-desc">Recently Created</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="updatedAt-desc">Recently Updated</option>
                  <option value="generationCount-desc">
                    Generation Count: High First
                  </option>
                </select>
              </div>
            </div>

            {searching ? (
              <div className="py-20 flex justify-center items-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-saffron-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Families Grid */}
                <div className="lg:col-span-8 space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Families ({filteredCityResults.length})
                  </h3>

                  {filteredCityResults.map((head) => (
                    <div
                      key={head._id}
                      className="bg-white border border-gray-150 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-saffron-50/50 rounded-bl-full opacity-60 pointer-events-none"></div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-saffron-50 text-saffron-600 flex items-center justify-center text-xl shrink-0 font-bold">
                            {head.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 text-sm">
                              {head.name}'s Family
                            </h4>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                              Family ID:{" "}
                              {head.familyId ||
                                head._id.substring(0, 8).toUpperCase()}
                            </p>

                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5">
                              <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                <FiMapPin className="text-slate-400" />{" "}
                                {head.city || "N/A"}, {head.state || "N/A"}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                <FiLayers className="text-slate-400" /> Gen:{" "}
                                {head.generationCount || 1}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                <FiActivity className="text-slate-400" />{" "}
                                Members: {head.memberCount || 1}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={() =>
                              updateUrlParams({
                                viewFamily: head.familyId || head._id,
                              })
                            }
                            className="flex-1 sm:flex-initial px-4 py-2 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-black shadow-sm transition-colors"
                          >
                            View Tree
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMemberId(head._id);
                            }}
                            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200"
                          >
                            Details
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 mt-4 pt-3 flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1">
                          <FiCalendar /> Created:{" "}
                          {new Date(head.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiClock /> Updated:{" "}
                          {new Date(head.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}

                  {filteredCityResults.length === 0 && (
                    <div className="bg-white border border-gray-150 py-16 rounded-[2rem] text-center text-slate-400 font-bold text-xs uppercase tracking-wider">
                      No family records match the criteria.
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 pt-4">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => {
                          setCurrentPage((prev) => Math.max(prev - 1, 1));
                          updateUrlParams({ page: currentPage - 1 });
                        }}
                        className="p-2.5 rounded-xl border bg-white disabled:opacity-50 text-slate-600"
                      >
                        <FiChevronLeft />
                      </button>
                      <span className="text-xs font-black text-slate-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => {
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages),
                          );
                          updateUrlParams({ page: currentPage + 1 });
                        }}
                        className="p-2.5 rounded-xl border bg-white disabled:opacity-50 text-slate-600"
                      >
                        <FiChevronRight />
                      </button>
                    </div>
                  )}
                </div>

                {/* Devotees Grid */}
                <div className="lg:col-span-4 space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Devotees ({devoteeResults.length})
                  </h3>

                  <div className="bg-white border border-gray-150 rounded-[2rem] p-4 divide-y divide-slate-100">
                    {devoteeResults.map((dev) => (
                      <div
                        key={dev._id}
                        className="py-3 flex justify-between items-center first:pt-0 last:pb-0"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-xs">
                            {dev.name}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                            ID: {dev.devoteeId} • Mobile: {dev.mobile || "N/A"}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedMemberId(dev._id);
                            if (dev.familyRootId) {
                              updateUrlParams({ viewFamily: dev.familyRootId });
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase transition-colors"
                        >
                          View Profile
                        </button>
                      </div>
                    ))}
                    {devoteeResults.length === 0 && (
                      <div className="py-8 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">
                        Use search query to discover devotees.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Tree Visualizer & Profile Drawer */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div
            className={`lg:col-span-12 ${selectedMemberId ? "lg:col-span-8" : "lg:col-span-12"} transition-all`}
          >
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => {
                  setSelectedMemberId(null);
                  updateUrlParams({ viewFamily: null });
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <FiChevronLeft /> Back to Search
              </button>
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Active Vanshawal Head:{" "}
                {familyMembers.find((m) => m.isFamilyHead)?.name || "Head"}
              </div>
            </div>

            {loading ? (
              <div className="h-[500px] flex items-center justify-center bg-[#FAF9F5] rounded-[2rem] border border-slate-200/50">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-saffron-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <VanshawalTree
                members={familyMembers}
                onSelectMember={setSelectedMemberId}
                selectedMemberId={selectedMemberId}
                onAddRelative={isDevotee ? null : triggerAddRelative}
              />
            )}
          </div>

          {selectedMemberId && (
            <div className="lg:col-span-4 h-[600px]">
              <DevoteeProfileDetail
                devoteeId={selectedMemberId}
                onClose={() => setSelectedMemberId(null)}
                onSelectMember={setSelectedMemberId}
                onViewFamilyTree={(rootId) => {
                  updateUrlParams({ viewFamily: rootId });
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Premium Create Family Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden relative border-t-8 border-t-saffron-500 max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">
                    Create New Family Register
                  </h3>
                  <p className="text-slate-400 font-bold text-xs mt-0.5">
                    The first devotee registered will become the Family Head.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              <form
                onSubmit={handleCreateFamily}
                className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-saffron-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Gender *
                    </label>
                    <select
                      required
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-saffron-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) =>
                        setFormData({ ...formData, dob: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-saffron-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) =>
                        setFormData({ ...formData, mobile: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-saffron-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-saffron-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Aadhaar Number
                    </label>
                    <input
                      type="text"
                      value={formData.aadhaar}
                      onChange={(e) =>
                        setFormData({ ...formData, aadhaar: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-saffron-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Kuldevta
                    </label>
                    <input
                      type="text"
                      value={formData.kuldevta}
                      onChange={(e) =>
                        setFormData({ ...formData, kuldevta: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-saffron-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Blood Group
                    </label>
                    <input
                      type="text"
                      value={formData.bloodGroup}
                      onChange={(e) =>
                        setFormData({ ...formData, bloodGroup: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-saffron-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Marital Status
                    </label>
                    <select
                      value={formData.maritalStatus}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maritalStatus: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-saffron-500"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                    </select>
                  </div>
                </div>

                {!isBranchManager && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Branch
                    </label>
                    <select
                      value={formData.branch}
                      onChange={(e) =>
                        setFormData({ ...formData, branch: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-saffron-500"
                    >
                      <option value="">Main Trust</option>
                      {branches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-saffron-500 resize-none h-16"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Village
                    </label>
                    <input
                      type="text"
                      value={formData.village}
                      onChange={(e) =>
                        setFormData({ ...formData, village: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-saffron-500"
                      placeholder="Village"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Taluka
                    </label>
                    <input
                      type="text"
                      value={formData.taluka}
                      onChange={(e) =>
                        setFormData({ ...formData, taluka: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-saffron-500"
                      placeholder="Taluka"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      State
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value, city: "" })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-saffron-500"
                    >
                      <option value="">Select State</option>
                      {indiaStates.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      City
                    </label>
                    <select
                      value={formData.city}
                      disabled={!formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-saffron-500 disabled:opacity-50"
                    >
                      <option value="">Select City</option>
                      {(stateCities[formData.state] || []).map((ct) => (
                        <option key={ct} value={ct}>
                          {ct}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={submitting}
                    type="submit"
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg"
                  >
                    {submitting ? "Creating..." : "Create Family"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Add Relative Modal */}
      <AnimatePresence>
        {isAddRelativeModalOpen && selectedRelative && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden relative border-t-8 border-t-saffron-500 max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">
                    Add Family Member
                  </h3>
                  <p className="text-slate-400 font-bold text-xs mt-0.5">
                    Adding relative to member:{" "}
                    <span className="text-saffron-600 font-black">
                      {selectedRelative.name}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setIsAddRelativeModalOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              <form
                onSubmit={handleAddRelative}
                className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar"
              >
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    Relationship Type *
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      "Son",
                      "Daughter",
                      "Father",
                      "Mother",
                      "Spouse",
                      "Brother",
                      "Sister",
                    ].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setRelationType(type)}
                        className={`py-2 text-xs font-black rounded-lg border text-center transition-colors ${
                          relationType === type
                            ? "bg-saffron-500 border-saffron-500 text-white shadow-md"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Gender (Will auto-configure based on role)
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) =>
                        setFormData({ ...formData, dob: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) =>
                        setFormData({ ...formData, mobile: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Aadhaar Number
                    </label>
                    <input
                      type="text"
                      value={formData.aadhaar}
                      onChange={(e) =>
                        setFormData({ ...formData, aadhaar: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Kuldevta
                    </label>
                    <input
                      type="text"
                      value={formData.kuldevta}
                      onChange={(e) =>
                        setFormData({ ...formData, kuldevta: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Blood Group
                    </label>
                    <input
                      type="text"
                      value={formData.bloodGroup}
                      onChange={(e) =>
                        setFormData({ ...formData, bloodGroup: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Marital Status
                    </label>
                    <select
                      value={formData.maritalStatus}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maritalStatus: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-saffron-500"
                    placeholder="Address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Village
                    </label>
                    <input
                      type="text"
                      value={formData.village}
                      onChange={(e) =>
                        setFormData({ ...formData, village: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-saffron-500"
                      placeholder="Village"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Taluka
                    </label>
                    <input
                      type="text"
                      value={formData.taluka}
                      onChange={(e) =>
                        setFormData({ ...formData, taluka: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-saffron-500"
                      placeholder="Taluka"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      State
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value, city: "" })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-saffron-500"
                    >
                      <option value="">Select State</option>
                      {indiaStates.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      City
                    </label>
                    <select
                      value={formData.city}
                      disabled={!formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-saffron-500 disabled:opacity-50"
                    >
                      <option value="">Select City</option>
                      {(stateCities[formData.state] || []).map((ct) => (
                        <option key={ct} value={ct}>
                          {ct}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddRelativeModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={submitting}
                    type="submit"
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg"
                  >
                    {submitting ? "Adding..." : "Add Member"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DevoteeVanshawal;
