"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Briefcase,
  IndianRupee,
  Save,
  Sparkles,
  Plus,
  X,
  Check,
  Search,
  Building2,
  Trash2,
  ChevronDown,
  ChevronUp
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LicenseMeta {
  key: string;
  label: string;
  category: string;
}

const CANONICAL_LICENSES_LIST: LicenseMeta[] = [
  { key: "GSTIN", label: "GST Registration Certificate", category: "General & Tax" },
  { key: "PAN", label: "PAN Card Registration", category: "General & Tax" },
  { key: "OEM_AUTHORIZATION", label: "OEM Authorization Certificate", category: "Technical & Trade" },
  { key: "DSC_CERTIFICATE", label: "Digital Signature Certificate (DSC)", category: "General & Tax" },
  { key: "ELECTRICAL_LICENSE", label: "Electrical Contractor License (HT/LT)", category: "Technical & Trade" },
  { key: "CONTRACTOR_REGISTRATION", label: "PWD / CPWD Contractor Enlistment Card", category: "Technical & Trade" },
  { key: "LABOR_LICENSE", label: "Contract Labor & EPF/ESI License", category: "Statutory & Labor" },
  { key: "SECURITY_AGENCY_PSARA", label: "PSARA Private Security Agency License", category: "Security & Protection" },
  { key: "DRUG_LICENSE", label: "Wholesale Drug & Pharmacy License (Form 20/21)", category: "Medical & Pharma" },
  { key: "FOOD_SAFETY_FSSAI", label: "FSSAI Food Safety License", category: "Catering & Food" },
  { key: "MSME_UDYAM", label: "MSME / Udyam Certificate", category: "General & Tax" },
  { key: "MINING_LICENSE", label: "Mining Lease & Quarry License", category: "Mining & Resources" },
  { key: "EXPLOSIVE_PESO", label: "PESO Explosives & Blasting License", category: "Industrial & Safety" },
  { key: "POLLUTION_PCB_CLEARANCE", label: "Pollution Control Board Consent (CTO/CTE)", category: "Environmental" },
  { key: "ISO_CERTIFICATION", label: "ISO 9001 / ISO 14001 Quality Certification", category: "Quality & Compliance" },
  { key: "FIRE_NOC", label: "Fire Department NOC & License", category: "Industrial & Safety" },
  { key: "WEIGHTS_MEASURES", label: "Legal Metrology & Calibration Certificate", category: "Industrial & Safety" },
];

const CATEGORY_OPTIONS = [
  "Civil Works", "Roads & Highways", "Medical & Hospital", "Electrical",
  "IT & Software", "Water & Sanitation", "Vehicles & Transport", "Security Services",
  "Catering & Housekeeping", "Solar & Renewable Energy", "Agriculture & Forestry",
  "Mining & Minerals", "Consultancy & Professional Services", "Machinery & Equipment",
  "Railways & Metro", "Telecom & Communication", "Oil & Gas", "Power Generation",
  "Defence", "Smart City", "Urban Development", "Ports & Dredging"
];

const STATE_OPTIONS = [
  "Odisha", "West Bengal", "Telangana", "Andhra Pradesh", "Maharashtra",
  "Delhi", "Karnataka", "Tamil Nadu", "Gujarat", "Pan-India"
];

const CONTRACTOR_CLASS_GROUPS = [
  {
    group: "State PWD / Regional Classes",
    options: [
      { key: "SUPER_CLASS", label: "Super Class (Unlimited Value)" },
      { key: "SPECIAL_CLASS", label: "Special Class / Class I (High Value)" },
      { key: "CLASS_A", label: "Class A / Class 1 / Degree ENGG" },
      { key: "CLASS_B", label: "Class B / Class 2 / Diploma ENGG" },
      { key: "CLASS_C", label: "Class C / Class 3 Contractor" },
      { key: "CLASS_D", label: "Class D / Class 4 / Class 5 Contractor" },
    ]
  },
  {
    group: "CPWD & Central Govt Enlistment",
    options: [
      { key: "CPWD_CLASS_1_SUPER", label: "CPWD Class I (Super / Unlimited)" },
      { key: "CPWD_CLASS_1", label: "CPWD Class I (AAA / AA / A)" },
      { key: "CPWD_CLASS_2", label: "CPWD Class II" },
      { key: "CPWD_CLASS_3", label: "CPWD Class III" },
      { key: "CPWD_CLASS_4", label: "CPWD Class IV / V" },
    ]
  },
  {
    group: "General",
    options: [
      { key: "UNCLASSED", label: "Unclassed / General Vendor" },
    ]
  }
];

const ALL_CLASS_OPTIONS_MAP: Record<string, { label: string; group: string }> = {
  SUPER_CLASS: { label: "Super Class (Unlimited Value)", group: "State PWD" },
  SPECIAL_CLASS: { label: "Special Class / Class I (High Value)", group: "State PWD" },
  CLASS_A: { label: "Class A / Class 1 / Degree ENGG", group: "State PWD" },
  CLASS_B: { label: "Class B / Class 2 / Diploma ENGG", group: "State PWD" },
  CLASS_C: { label: "Class C / Class 3 Contractor", group: "State PWD" },
  CLASS_D: { label: "Class D / Class 4 / Class 5 Contractor", group: "State PWD" },
  CPWD_CLASS_1_SUPER: { label: "CPWD Class I (Super / Unlimited)", group: "CPWD" },
  CPWD_CLASS_1: { label: "CPWD Class I (AAA / AA / A)", group: "CPWD" },
  CPWD_CLASS_2: { label: "CPWD Class II", group: "CPWD" },
  CPWD_CLASS_3: { label: "CPWD Class III", group: "CPWD" },
  CPWD_CLASS_4: { label: "CPWD Class IV / V", group: "CPWD" },
  UNCLASSED: { label: "Unclassed / General Vendor", group: "General" },
};

import { useSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function BidderProfileSettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Single Add Preference Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<string>("states");
  const [modalSearchQuery, setModalSearchQuery] = useState("");

  // Form State
  const [annualTurnoverLakhs, setAnnualTurnoverLakhs] = useState<string>("");
  const [netWorthLakhs, setNetWorthLakhs] = useState<string>("");
  const [experienceYears, setExperienceYears] = useState<string>("");
  const [maxSingleWorkLakhs, setMaxSingleWorkLakhs] = useState<string>("");
  const [selectedContractorClasses, setSelectedContractorClasses] = useState<string[]>([]);
  const [companyType, setCompanyType] = useState<string>("PRIVATE_LIMITED");

  const [targetAmountRange, setTargetAmountRange] = useState<string>("ANY");

  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [selectedMachinery, setSelectedMachinery] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [isOwnerOrAdmin, setIsOwnerOrAdmin] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    licenses: false,
    states: false,
    categories: false,
    classes: false,
    financial: false
  });

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [isDirty, setIsDirty] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const markDirty = () => {
    if (isLoaded) {
      setIsDirty(true);
    }
  };

  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/bidders/profile`, {
        headers: {
          "Authorization": `Bearer ${(session as any)?.accessToken || ''}`,
          "x-user-id": (session?.user as any)?.id || session?.user?.email || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setIsOwnerOrAdmin(data.isOwnerOrAdmin !== false);
        if (data.annualTurnover) setAnnualTurnoverLakhs((data.annualTurnover / 100000).toString());
        if (data.netWorth) setNetWorthLakhs((data.netWorth / 100000).toString());
        if (data.experienceYears) setExperienceYears(data.experienceYears.toString());
        if (data.maxSingleWorkValue) {
          const lakhs = (data.maxSingleWorkValue / 100000).toString();
          setMaxSingleWorkLakhs(lakhs);
          if (["5", "10", "25", "50", "100", "250", "500", "1000", "5000"].includes(lakhs)) {
            setTargetAmountRange(lakhs);
          } else {
            setTargetAmountRange("CUSTOM");
          }
        } else {
          setTargetAmountRange("ANY");
        }
        if (data.contractorClass) {
          if (Array.isArray(data.contractorClass)) {
            setSelectedContractorClasses(data.contractorClass.filter((c: string) => c !== 'UNCLASSED'));
          } else if (typeof data.contractorClass === 'string') {
            setSelectedContractorClasses(data.contractorClass.split(',').map((s: string) => s.trim()).filter((c: string) => c && c !== 'UNCLASSED'));
          }
        }
        if (data.companyType) setCompanyType(data.companyType);
        if (Array.isArray(data.licenses)) setSelectedLicenses(data.licenses);
        if (Array.isArray(data.machineryOwned)) setSelectedMachinery(data.machineryOwned);
        if (Array.isArray(data.preferredCategories)) setSelectedCategories(data.preferredCategories);
        if (Array.isArray(data.preferredStates)) setSelectedStates(data.preferredStates);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
      setIsDirty(false);
      setIsLoaded(true);
    }
  };

  // Toggle Preference Handlers
  const toggleContractorClass = (key: string, groupOptions?: { key: string }[]) => {
    markDirty();
    if (groupOptions) {
      const groupKeys = groupOptions.map(o => o.key);
      setSelectedContractorClasses(prev => {
        const filtered = prev.filter(k => !groupKeys.includes(k) && k !== "UNCLASSED");
        return [...filtered, key];
      });
    } else {
      setSelectedContractorClasses(prev => {
        if (prev.includes(key)) {
          return prev.filter(k => k !== key);
        } else {
          return [...prev.filter(k => k !== "UNCLASSED"), key];
        }
      });
    }
  };

  const removeContractorClass = (key: string) => {
    markDirty();
    setSelectedContractorClasses(prev => prev.filter(k => k !== key));
  };

  const toggleLicense = (key: string) => {
    markDirty();
    setSelectedLicenses(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const removeLicense = (key: string) => {
    markDirty();
    setSelectedLicenses(prev => prev.filter(k => k !== key));
  };

  const toggleState = (st: string) => {
    markDirty();
    setSelectedStates(prev =>
      prev.includes(st) ? prev.filter(s => s !== st) : [...prev, st]
    );
  };

  const removeState = (st: string) => {
    markDirty();
    setSelectedStates(prev => prev.filter(s => s !== st));
  };

  const toggleCategory = (cat: string) => {
    markDirty();
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const removeCategory = (cat: string) => {
    markDirty();
    setSelectedCategories(prev => prev.filter(c => c !== cat));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToastMessage(null);

    const userId = (session?.user as any)?.id || session?.user?.email || "default_bidder_user";

    const payload = {
      userId,
      annualTurnover: annualTurnoverLakhs ? parseFloat(annualTurnoverLakhs) * 100000 : null,
      netWorth: netWorthLakhs ? parseFloat(netWorthLakhs) * 100000 : null,
      experienceYears: experienceYears ? parseInt(experienceYears, 10) : null,
      maxSingleWorkValue: maxSingleWorkLakhs ? parseFloat(maxSingleWorkLakhs) * 100000 : null,
      contractorClass: selectedContractorClasses.join(","),
      companyType,
      licenses: selectedLicenses,
      machineryOwned: selectedMachinery,
      preferredCategories: selectedCategories,
      preferredStates: selectedStates,
    };

    try {
      const res = await fetch(`${API_URL}/api/bidders/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(session as any)?.accessToken || ''}`,
          "x-user-id": userId
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const resData = await res.json();
        if (resData.success === false) {
          alert(`Failed to save profile: ${resData.error || "Server error"}`);
        } else {
          setToastMessage("Bidder profile saved successfully!");
          setIsDirty(false);
          setTimeout(() => setToastMessage(null), 4000);
        }
      } else {
        const errText = await res.text();
        alert(`Failed to save profile: ${errText || res.statusText}`);
      }
    } catch (err) {
      alert("Error saving profile.");
    } finally {
      setSaving(false);
    }
  };

  const hasAdminRights = isOwnerOrAdmin || (session?.user as any)?.tenantRole === 'OWNER' || (session?.user as any)?.tenantRole === 'ADMIN' || (session?.user as any)?.isOwner || (session?.user as any)?.globalRole === 'SUPER_ADMIN';

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-blue-600 font-medium">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Loading Bidder Profile...
        </div>
      </div>
    );
  }



  const activeClasses = selectedContractorClasses.filter(c => c !== "UNCLASSED");
  const hasFinancialConfig = Boolean(annualTurnoverLakhs || netWorthLakhs || maxSingleWorkLakhs || experienceYears || (targetAmountRange && targetAmountRange !== "ANY"));
  const hasAnyPreferences = activeClasses.length > 0 || selectedLicenses.length > 0 || selectedStates.length > 0 || selectedCategories.length > 0 || hasFinancialConfig;

  // Filtering for single Add Preference Modal
  const q = modalSearchQuery.toLowerCase().trim();
  const filteredStates = STATE_OPTIONS.filter(s => s.toLowerCase().includes(q));
  const filteredCategories = CATEGORY_OPTIONS.filter(c => c.toLowerCase().includes(q));
  const filteredLicenses = CANONICAL_LICENSES_LIST.filter(l => l.label.toLowerCase().includes(q) || l.category.toLowerCase().includes(q));

  return (
    <div className="min-h-screen pt-24 pb-20 bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-gray-100">
      <div className="max-w-[1536px] mx-auto px-4 md:px-8">
        
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm mb-1">
              <UserCheckIcon className="w-5 h-5 text-blue-600" />
              <span>BIDDER PROFILE & PREFERENCES</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
              Company Capacity & Preferences
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              Configure your active financial capacity, enlistment classes, licenses, states, and categories to train AI tender matching.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            
            {/* Single "+ Add Preference" Button */}
            {isOwnerOrAdmin && (
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="w-4.5 h-4.5" />
                    <span>Add Preference</span>
                  </button>
                </DialogTrigger>

              <DialogContent className="sm:max-w-4xl md:max-w-5xl w-full p-0 overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-2xl">
                <div className="p-6 border-b border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/30">
                  <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" />
                    <span>Add New Preference</span>
                  </DialogTitle>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                    Select operating states, target categories, licenses, registration classes, or financial limits.
                  </p>

                  {/* Search Input */}
                  <div className="relative mt-4">
                    <Search className="w-4.5 h-4.5 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search states, categories, licenses, or registration classes..."
                      value={modalSearchQuery}
                      onChange={(e) => setModalSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-2xs"
                    />
                    {modalSearchQuery && (
                      <button
                        onClick={() => setModalSearchQuery("")}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Tab Selector inside Modal */}
                <div className="flex border-b border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50 px-6 pt-2 gap-2 overflow-x-auto">
                  {[
                    { id: "states", label: "Operating States", icon: MapPin },
                    { id: "categories", label: "Target Categories", icon: Briefcase },
                    { id: "licenses", label: "Verified Licenses", icon: ShieldCheck },
                    { id: "classes", label: "Registration Classes", icon: UserCheckIcon },
                    { id: "financial", label: "Financial Limits", icon: IndianRupee },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeModalTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => { setActiveModalTab(tab.id); }}
                        className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                          isActive
                            ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900 rounded-t-xl shadow-2xs"
                            : "border-transparent text-slate-500 hover:text-slate-800 dark:text-gray-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Modal Item Content (Wider & Taller) */}
                <div className="p-6 md:p-8 max-h-[560px] min-h-[380px] overflow-y-auto">
                  
                  {/* STATES TAB */}
                  {activeModalTab === "states" && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                      {filteredStates.length === 0 ? (
                        <div className="text-xs text-slate-400 py-8 text-center col-span-full">No matching states found.</div>
                      ) : (
                        filteredStates.map((st) => {
                          const isAdded = selectedStates.includes(st);
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => toggleState(st)}
                              className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                                isAdded
                                  ? "bg-indigo-600 text-white border-indigo-700 shadow-md"
                                  : "bg-slate-50 dark:bg-gray-800/80 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:border-indigo-300"
                              }`}
                            >
                              <span>{st}</span>
                              {isAdded ? <Check className="w-4 h-4 text-white shrink-0" /> : <Plus className="w-4 h-4 text-slate-400 shrink-0" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* CATEGORIES TAB */}
                  {activeModalTab === "categories" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {filteredCategories.length === 0 ? (
                        <div className="text-xs text-slate-400 py-8 text-center col-span-full">No matching categories found.</div>
                      ) : (
                        filteredCategories.map((cat) => {
                          const isAdded = selectedCategories.includes(cat);
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => toggleCategory(cat)}
                              className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer text-left ${
                                isAdded
                                  ? "bg-blue-600 text-white border-blue-700 shadow-md"
                                  : "bg-slate-50 dark:bg-gray-800/80 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:border-blue-300"
                              }`}
                            >
                              <span className="truncate pr-2">{cat}</span>
                              {isAdded ? <Check className="w-4 h-4 text-white shrink-0" /> : <Plus className="w-4 h-4 text-slate-400 shrink-0" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* LICENSES TAB */}
                  {activeModalTab === "licenses" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {filteredLicenses.length === 0 ? (
                        <div className="text-xs text-slate-400 py-8 text-center col-span-full">No matching licenses found.</div>
                      ) : (
                        filteredLicenses.map((lic) => {
                          const isAdded = selectedLicenses.includes(lic.key);
                          return (
                            <button
                              key={lic.key}
                              type="button"
                              onClick={() => toggleLicense(lic.key)}
                              className={`p-3.5 rounded-xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                                isAdded
                                  ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                                  : "bg-slate-50 dark:bg-gray-800/60 border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:border-blue-300"
                              }`}
                            >
                              <div className="pr-2">
                                <div className={`text-[9px] uppercase tracking-wider font-extrabold mb-0.5 ${isAdded ? "text-blue-100" : "text-slate-400 dark:text-gray-400"}`}>{lic.category}</div>
                                <div className="text-xs font-bold leading-snug">{lic.label}</div>
                              </div>
                              {isAdded ? <Check className="w-4 h-4 text-white shrink-0 mt-0.5" /> : <Plus className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* REGISTRATION CLASSES TAB */}
                  {activeModalTab === "classes" && (
                    <div className="space-y-6">
                      {CONTRACTOR_CLASS_GROUPS.map((grp) => (
                        <div key={grp.group} className="bg-slate-50/70 dark:bg-gray-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-gray-700/60">
                          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-3">
                            {grp.group}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {grp.options.map((opt) => {
                              const isAdded = selectedContractorClasses.includes(opt.key);
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  onClick={() => toggleContractorClass(opt.key, grp.options)}
                                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                                    isAdded
                                      ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                                      : "bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:border-blue-300"
                                  }`}
                                >
                                  <span className="truncate pr-2">{opt.label}</span>
                                  {isAdded ? <Check className="w-4 h-4 text-white shrink-0" /> : <Plus className="w-4 h-4 text-slate-400 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* FINANCIAL CAPACITY TAB */}
                  {activeModalTab === "financial" && (
                    <div className="space-y-6">
                      
                      {/* Target Tender Value / Capacity Range */}
                      <div className="bg-slate-50/70 dark:bg-gray-800/40 p-5 rounded-xl border border-slate-200/60 dark:border-gray-700/60">
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-3">
                          Target Tender Value Range / Execution Limit
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                          {[
                            { key: "5", label: "Up to ₹ 5 Lakhs" },
                            { key: "10", label: "Up to ₹ 10 Lakhs" },
                            { key: "25", label: "Up to ₹ 25 Lakhs" },
                            { key: "50", label: "Up to ₹ 50 Lakhs" },
                            { key: "100", label: "Up to ₹ 1 Crore" },
                            { key: "250", label: "Up to ₹ 2.5 Crores" },
                            { key: "500", label: "Up to ₹ 5 Crores" },
                            { key: "1000", label: "Up to ₹ 10 Crores" },
                            { key: "5000", label: "Up to ₹ 50 Crores" },
                            { key: "ANY", label: "Any Amount (No Limit)" },
                          ].map((range) => {
                            const isSelected = maxSingleWorkLakhs === range.key || targetAmountRange === range.key;
                            return (
                              <button
                                key={range.key}
                                type="button"
                                onClick={() => {
                                  markDirty();
                                  setTargetAmountRange(range.key);
                                  if (range.key !== "ANY") {
                                    setMaxSingleWorkLakhs(range.key);
                                  } else {
                                    setMaxSingleWorkLakhs("");
                                  }
                                }}
                                className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                                    : "bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:border-blue-300"
                                }`}
                              >
                                <span>{range.label}</span>
                                {isSelected ? <Check className="w-4 h-4 text-white shrink-0 ml-1" /> : <Plus className="w-4 h-4 text-slate-400 shrink-0 ml-1" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Average Annual Turnover Range */}
                      <div className="bg-slate-50/70 dark:bg-gray-800/40 p-5 rounded-xl border border-slate-200/60 dark:border-gray-700/60">
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-3">
                          Average Annual Turnover Range
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                          {[
                            { val: "10", label: "Under ₹ 10 Lakhs" },
                            { val: "50", label: "₹ 10L - ₹ 50 Lakhs" },
                            { val: "100", label: "₹ 50L - ₹ 1 Crore" },
                            { val: "250", label: "₹ 1 Cr - ₹ 2.5 Crores" },
                            { val: "500", label: "₹ 2.5 Cr - ₹ 5 Crores" },
                            { val: "1000", label: "₹ 5 Cr - ₹ 10 Crores" },
                            { val: "2500", label: "Above ₹ 10 Crores" },
                          ].map((to) => {
                            const isSelected = annualTurnoverLakhs === to.val;
                            return (
                              <button
                                key={to.val}
                                type="button"
                                onClick={() => {
                                  markDirty();
                                  setAnnualTurnoverLakhs(isSelected ? "" : to.val);
                                }}
                                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                                    : "bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:border-emerald-300"
                                }`}
                              >
                                <span>{to.label}</span>
                                {isSelected ? <Check className="w-4 h-4 text-white shrink-0 ml-1" /> : <Plus className="w-4 h-4 text-slate-400 shrink-0 ml-1" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Company Entity Type Options */}
                      <div className="bg-slate-50/70 dark:bg-gray-800/40 p-5 rounded-xl border border-slate-200/60 dark:border-gray-700/60">
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-3">
                          Company Entity Type
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                          {[
                            { key: "MSE", label: "MSE / MSME" },
                            { key: "PRIVATE_LIMITED", label: "Private Limited" },
                            { key: "PROPRIETORSHIP", label: "Proprietorship" },
                            { key: "PARTNERSHIP", label: "Partnership" },
                            { key: "LLP_JV", label: "LLP / JV" },
                          ].map((ent) => {
                            const isSelected = companyType === ent.key;
                            return (
                              <button
                                key={ent.key}
                                type="button"
                                onClick={() => {
                                  markDirty();
                                  setCompanyType(ent.key);
                                }}
                                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                                    : "bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:border-blue-300"
                                }`}
                              >
                                <span>{ent.label}</span>
                                {isSelected ? <Check className="w-4 h-4 text-white shrink-0 ml-1" /> : <Plus className="w-4 h-4 text-slate-400 shrink-0 ml-1" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  )}

                </div>

                {/* Modal Footer */}
                <div className="p-4 md:px-8 border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/30 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </DialogContent>
            </Dialog>
            )}

            <button
              onClick={() => router.push("/tenders/recommended")}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>View Recommended Tenders</span>
            </button>
          </div>
        </div>

        {!isOwnerOrAdmin && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs rounded-xl flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 flex items-center justify-center shrink-0">
                <Building2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Shared Company Bidder Profile</p>
                <p className="text-slate-600 dark:text-gray-300 mt-0.5">These bidding preferences were configured by your Tenant Owner/Admin and are applied to all tender evaluations across your company workspace.</p>
              </div>
            </div>
            <span className="text-[11px] font-extrabold text-blue-700 bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-md shrink-0">
              Read-Only Member View
            </span>
          </div>
        )}

        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-medium rounded-xl flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {!hasAnyPreferences ? (
            /* CLEAN EMPTY STATE */
            <div className="bg-white dark:bg-gray-900 p-12 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm text-center my-8">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mx-auto mb-4 font-bold">
                <Plus className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                No Profile Preferences Configured
              </h3>
              <p className="text-sm text-slate-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                Click the <strong className="text-blue-600 dark:text-blue-400">"+ Add Preference"</strong> button at top right to add your operating states, target categories, enlistment classes, or verified licenses.
              </p>
            </div>
          ) : (
            /* TABLE FORMAT SUMMARY */
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm overflow-hidden my-6">
              
              {/* Table Title Bar */}
              <div className="p-6 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Bidder Profile & Preferences</h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                    Summary of configured financial capacity, enlistment classes, licenses, states, and categories.
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                  {activeClasses.length + selectedLicenses.length + selectedStates.length + selectedCategories.length + (hasFinancialConfig ? 1 : 0)} Configured
                </span>
              </div>

              {/* Preferences Summary Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-gray-800/60 border-b border-slate-100 dark:border-gray-800 text-slate-400 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-6">Preference Type</th>
                      <th className="py-3.5 px-6">Configured Value / Details</th>
                      <th className="py-3.5 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-800 font-medium">
                    
                    {/* 1. Verified Licenses Group */}
                    {selectedLicenses.length > 0 && (
                      <React.Fragment>
                        <tr 
                          onClick={() => toggleGroup('licenses')}
                          className="bg-slate-50/70 hover:bg-slate-100/80 dark:bg-gray-800/40 dark:hover:bg-gray-800/70 cursor-pointer transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-200/70 dark:border-blue-800">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>Licenses</span>
                              </span>
                              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                                {selectedLicenses.length}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-700 dark:text-gray-300 font-medium">
                            {selectedLicenses.map(k => CANONICAL_LICENSES_LIST.find(l => l.key === k)?.label || k).slice(0, 3).join(', ')}
                            {selectedLicenses.length > 3 ? ` + ${selectedLicenses.length - 3} more` : ''}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button type="button" className="text-slate-400 hover:text-blue-600 p-1 rounded-lg transition-colors">
                              {openGroups.licenses ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                        {openGroups.licenses && selectedLicenses.map((licKey, idx) => {
                          const lic = CANONICAL_LICENSES_LIST.find(l => l.key === licKey) || { label: licKey, category: 'License' };
                          return (
                            <tr key={licKey} className="bg-blue-50/20 dark:bg-blue-950/10 border-t border-slate-100 dark:border-gray-800">
                              <td className="py-3 px-6 pl-10 text-blue-600 dark:text-blue-400 font-extrabold text-[11px]">No. {idx + 1}</td>
                              <td className="py-3 px-6">
                                <div className="font-bold text-slate-800 dark:text-slate-200">{lic.label}</div>
                                <div className="text-[10px] text-slate-400">{lic.category}</div>
                              </td>
                              <td className="py-3 px-6 text-right">
                                {isOwnerOrAdmin && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeLicense(licKey); }}
                                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                    title="Remove License"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    )}

                    {/* 2. Operating States Group */}
                    {selectedStates.length > 0 && (
                      <React.Fragment>
                        <tr 
                          onClick={() => toggleGroup('states')}
                          className="bg-slate-50/70 hover:bg-slate-100/80 dark:bg-gray-800/40 dark:hover:bg-gray-800/70 cursor-pointer transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-200/70 dark:border-blue-800">
                                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>Operating States</span>
                              </span>
                              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                                {selectedStates.length}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-700 dark:text-gray-300 font-medium">
                            {selectedStates.join(', ')}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button type="button" className="text-slate-400 hover:text-blue-600 p-1 rounded-lg transition-colors">
                              {openGroups.states ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                        {openGroups.states && selectedStates.map((st, idx) => (
                          <tr key={st} className="bg-blue-50/20 dark:bg-blue-950/10 border-t border-slate-100 dark:border-gray-800">
                            <td className="py-3 px-6 pl-10 text-blue-600 dark:text-blue-400 font-extrabold text-[11px]">No. {idx + 1}</td>
                            <td className="py-3 px-6">
                              <div className="font-bold text-slate-800 dark:text-slate-200">{st}</div>
                            </td>
                            <td className="py-3 px-6 text-right">
                              {isOwnerOrAdmin && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); removeState(st); }}
                                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                  title="Remove State"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    )}

                    {/* 3. Target Categories Group */}
                    {selectedCategories.length > 0 && (
                      <React.Fragment>
                        <tr 
                          onClick={() => toggleGroup('categories')}
                          className="bg-slate-50/70 hover:bg-slate-100/80 dark:bg-gray-800/40 dark:hover:bg-gray-800/70 cursor-pointer transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-200/70 dark:border-blue-800">
                                <Briefcase className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>Target Categories</span>
                              </span>
                              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                                {selectedCategories.length}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-700 dark:text-gray-300 font-medium">
                            {selectedCategories.join(', ')}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button type="button" className="text-slate-400 hover:text-blue-600 p-1 rounded-lg transition-colors">
                              {openGroups.categories ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                        {openGroups.categories && selectedCategories.map((cat, idx) => (
                          <tr key={cat} className="bg-blue-50/20 dark:bg-blue-950/10 border-t border-slate-100 dark:border-gray-800">
                            <td className="py-3 px-6 pl-10 text-blue-600 dark:text-blue-400 font-extrabold text-[11px]">No. {idx + 1}</td>
                            <td className="py-3 px-6">
                              <div className="font-bold text-slate-800 dark:text-slate-200">{cat}</div>
                            </td>
                            <td className="py-3 px-6 text-right">
                              {isOwnerOrAdmin && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); removeCategory(cat); }}
                                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                  title="Remove Category"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    )}

                    {/* 4. Registration Classes Group */}
                    {activeClasses.length > 0 && (
                      <React.Fragment>
                        <tr 
                          onClick={() => toggleGroup('classes')}
                          className="bg-slate-50/70 hover:bg-slate-100/80 dark:bg-gray-800/40 dark:hover:bg-gray-800/70 cursor-pointer transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-200/70 dark:border-blue-800">
                                <Briefcase className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>Registration Classes</span>
                              </span>
                              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                                {activeClasses.length}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-700 dark:text-gray-300 font-medium">
                            {activeClasses.map(c => ALL_CLASS_OPTIONS_MAP[c]?.label || c).join(', ')}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button type="button" className="text-slate-400 hover:text-blue-600 p-1 rounded-lg transition-colors">
                              {openGroups.classes ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                        {openGroups.classes && activeClasses.map((clsKey, idx) => {
                          const meta = ALL_CLASS_OPTIONS_MAP[clsKey] || { label: clsKey, group: 'Enlistment' };
                          return (
                            <tr key={clsKey} className="bg-blue-50/20 dark:bg-blue-950/10 border-t border-slate-100 dark:border-gray-800">
                              <td className="py-3 px-6 pl-10 text-blue-600 dark:text-blue-400 font-extrabold text-[11px]">No. {idx + 1}</td>
                              <td className="py-3 px-6">
                                <div className="font-bold text-slate-800 dark:text-slate-200">{meta.label}</div>
                                <div className="text-[10px] text-slate-400">{meta.group}</div>
                              </td>
                              <td className="py-3 px-6 text-right">
                                {isOwnerOrAdmin && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeContractorClass(clsKey); }}
                                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                    title="Remove Class"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    )}

                    {/* 5. Financial Capacity Group */}
                    {hasFinancialConfig && (
                      <React.Fragment>
                        <tr 
                          onClick={() => toggleGroup('financial')}
                          className="bg-slate-50/70 hover:bg-slate-100/80 dark:bg-gray-800/40 dark:hover:bg-gray-800/70 cursor-pointer transition-colors"
                        >
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-200/70 dark:border-blue-800">
                              <IndianRupee className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>Financial Capacity</span>
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-700 dark:text-gray-300 font-medium">
                            {maxSingleWorkLakhs ? `Max Work: ₹ ${maxSingleWorkLakhs}L` : 'Financial Limits Configured'} | Entity: {companyType.replace("_", " ")}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button type="button" className="text-slate-400 hover:text-blue-600 p-1 rounded-lg transition-colors">
                              {openGroups.financial ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                        {openGroups.financial && (
                          <tr className="bg-blue-50/20 dark:bg-blue-950/10 border-t border-slate-100 dark:border-gray-800">
                            <td className="py-3.5 px-6 pl-10 text-blue-600 dark:text-blue-400 font-extrabold text-[11px]">Details</td>
                            <td className="py-3.5 px-6">
                              <div className="font-bold text-slate-800 dark:text-slate-200 flex flex-wrap gap-x-4 gap-y-1">
                                {annualTurnoverLakhs && <span>Turnover: ₹ {annualTurnoverLakhs}L</span>}
                                {maxSingleWorkLakhs && <span>Max Work: ₹ {maxSingleWorkLakhs}L</span>}
                                {netWorthLakhs && <span>Net Worth: ₹ {netWorthLakhs}L</span>}
                                {experienceYears && <span>Exp: {experienceYears} Yrs</span>}
                                {companyType && <span>Entity: {companyType.replace("_", " ")}</span>}
                              </div>
                            </td>
                            <td className="py-3.5 px-6 text-right">
                              {isOwnerOrAdmin && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAnnualTurnoverLakhs("");
                                    setNetWorthLakhs("");
                                    setMaxSingleWorkLakhs("");
                                    setExperienceYears("");
                                    setTargetAmountRange("ANY");
                                    markDirty();
                                  }}
                                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                  title="Remove Financial Limits"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )}

                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Submit Action Bar */}
          {isOwnerOrAdmin && (
            <div className="flex items-center justify-end gap-4 pt-4">
              <button
                type="submit"
                disabled={saving || !isDirty}
                className={`flex items-center gap-2 px-8 py-3.5 font-bold rounded-xl text-sm transition-all ${
                  !isDirty && !saving
                    ? "bg-slate-200 dark:bg-gray-800 text-slate-400 dark:text-gray-500 border border-slate-300 dark:border-gray-700 cursor-not-allowed shadow-none"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 cursor-pointer"
                }`}
              >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : !isDirty ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Bidder Profile</span>
                </>
              )}
            </button>
          </div>
          )}

        </form>
      </div>
    </div>
  );
}

function UserCheckIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
