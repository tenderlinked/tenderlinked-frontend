'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();
    const [searchValue, setSearchValue] = useState("");
    const [suggestions, setSuggestions] = useState<{ text: string, type: string, category: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Click outside listener
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!searchValue || searchValue.length < 2) {
            setSuggestions([]);
            return;
        }
        
        const fetchSuggestions = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenders/autocomplete?q=${encodeURIComponent(searchValue)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data);
                }
            } catch (err) {
                console.error("Autocomplete fetch error", err);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [searchValue]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
        setShowSuggestions(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setShowSuggestions(false);
            if (searchValue) {
                router.push(`/tenders?q=${encodeURIComponent(searchValue)}`);
            } else {
                router.push(`/tenders`);
            }
        }
    };

    const handleSuggestionClick = (suggestion: { text: string, type: string, category: string }) => {
        setShowSuggestions(false);
        const params = new URLSearchParams();
        params.set(suggestion.category, suggestion.text);
        router.push(`/tenders?${params.toString()}`);
    };

    const handleSearchClick = () => {
        setShowSuggestions(false);
        if (searchValue) {
            router.push(`/tenders?q=${encodeURIComponent(searchValue)}`);
        } else {
            router.push(`/tenders`);
        }
    };

    useEffect(() => {
        const observerOptions = {
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('opacity-100', 'translate-y-0');
                    entry.target.classList.remove('opacity-0', 'translate-y-10');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.stat-card').forEach(el => {
            el.classList.add('opacity-0', 'translate-y-10', 'transition-all', 'duration-700');
            observer.observe(el);
        });

        
    }, []);

    return (
        <div className="bg-white text-gray-900 font-body-md selection:bg-[#2563EB]-fixed selection:text-white-fixed">
<main>

<section className="relative min-h-[700px] flex items-center justify-center overflow-hidden">
<div className="absolute inset-0 z-0 bg-inverse-surface">
<div className="absolute inset-0 opacity-40 mix-blend-overlay" data-alt="A cinematic, wide-angle shot of a modern glass skyscraper reflecting a clear blue sky, emphasizing corporate authority and architectural precision. The lighting is crisp and professional, with high-contrast shadows and a clean, light-mode palette of blues and grays to reflect a dependable government environment." style={{  }}></div>
<div className="absolute inset-0 bg-gradient-to-b from-transparent via-inverse-surface/80 to-inverse-surface"></div>
</div>
<div className="relative z-10 max-w-max-width mx-auto px-margin-desktop text-center">
<h1 className="font-bold text-4xl text-display-lg text-white mb-6 animate-fade-in-up">Find relevant Indian government tenders easily</h1>

<div className="max-w-3xl mx-auto mb-12">
<div className="bg-white p-2 rounded-xl flex flex-col md:flex-row items-stretch md:items-center gap-2 shadow-xl relative" ref={searchRef}>
<div className="flex-1 flex items-center px-4 gap-3">
<span className="material-symbols-outlined text-outline text-gray-400">search</span>
<input 
  className="w-full bg-transparent border-none focus:ring-0 text-gray-900 placeholder:text-gray-500 py-3 font-body-md outline-none" 
  placeholder="Search by keywords, GeM ID, or Indian authority..." 
  type="text" 
  value={searchValue}
  onChange={handleSearch}
  onKeyDown={handleKeyDown}
  onFocus={() => setShowSuggestions(true)}
/>
</div>
<button onClick={handleSearchClick} className="bg-blue-700 text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all">
                            Search Tenders
                        </button>
                        
{/* Autocomplete Dropdown */}
{showSuggestions && suggestions.length > 0 && (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-[100] max-h-96 overflow-y-auto text-left">
        {suggestions.map((s, idx) => (
            <div 
                key={`${s.text}-${s.type}-${idx}`} 
                onClick={() => handleSuggestionClick(s)}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-slate-100 last:border-0 transition-colors"
            >
                <div className="flex-shrink-0 text-slate-400">
                    <span className="material-symbols-outlined text-sm">search</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700">
                        {s.text}
                    </span>
                    <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                        in {s.type}
                    </span>
                </div>
            </div>
        ))}
    </div>
)}
</div>
</div>

<div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
<div className="text-white">
<div className="font-bold text-3xl text-3xl">200K+</div>
<div className="font-body-sm text-sm opacity-80">Tender Sources</div>
</div>
<div className="text-white">
<div className="font-bold text-3xl text-3xl">25K+</div>
<div className="font-body-sm text-sm opacity-80">Daily Tenders</div>
</div>
<div className="text-white">
<div className="font-bold text-3xl text-3xl">190+</div>
<div className="font-body-sm text-sm opacity-80">States &amp; UTs Covered</div>
</div>
<div className="text-white">
<div className="font-bold text-3xl text-3xl">$2T+</div>
<div className="font-body-sm text-sm opacity-80">Annual Value</div>
</div>
</div>
</div>
</section>

<section className="py-24 bg-white">
<div className="max-w-max-width mx-auto px-margin-desktop">
<div className="text-center mb-16">
<h2 className="font-bold text-3xl text-3xl text-gray-900 mb-4">Precision Procurement Tools</h2>
<p className="text-lg text-body-lg text-gray-500 max-w-2xl mx-auto">Navigate complex government markets with institutional-grade search and monitoring features.</p>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
<div className="bg-white border border-gray-200 p-8 rounded-xl stat-card transition-all group duration-700 opacity-100 translate-y-0">
<div className="w-12 h-12 bg-[#2563EB]/10 rounded-lg flex items-center justify-center text-[#2563EB] mb-6 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
</div>
<h3 className="font-bold text-[20px] mb-3">Get documents easily</h3>
<p className="font-body-md text-gray-500">Download BOQ, RFP, and Corrigendum documents directly with a single click from our verified repository.</p>
</div>
<div className="bg-white border border-gray-200 p-8 rounded-xl stat-card transition-all group duration-700 opacity-100 translate-y-0">
<div className="w-12 h-12 bg-[#2563EB]/10 rounded-lg flex items-center justify-center text-[#2563EB] mb-6 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
</div>
<h3 className="font-bold text-[20px] mb-3">Get notified for changes</h3>
<p className="font-body-md text-gray-500">Real-time alerts for submission date extensions, clarifications, and award notices directly to your inbox.</p>
</div>
<div className="bg-white border border-gray-200 p-8 rounded-xl stat-card transition-all group duration-700 opacity-100 translate-y-0">
<div className="w-12 h-12 bg-[#2563EB]/10 rounded-lg flex items-center justify-center text-[#2563EB] mb-6 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>robot_2</span>
</div>
<h3 className="font-bold text-[20px] mb-3">Automate your search</h3>
<p className="font-body-md text-gray-500">Set up saved searches and let our AI engine find the most relevant opportunities based on your profile.</p>
</div>
<div className="bg-white border border-gray-200 p-8 rounded-xl stat-card transition-all group duration-700 opacity-100 translate-y-0">
<div className="w-12 h-12 bg-[#2563EB]/10 rounded-lg flex items-center justify-center text-[#2563EB] mb-6 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>search_check</span>
</div>
<h3 className="font-bold text-[20px] mb-3">Search easily like Google</h3>
<p className="font-body-md text-gray-500">Advanced semantic search that understands intent, supporting Boolean operators and multi-lingual queries.</p>
</div>
</div>
</div>
</section>

<section className="py-24 bg-gray-50">
<div className="max-w-max-width mx-auto px-margin-desktop">

<div className="mb-20">
<div className="flex items-end justify-between mb-8">
<div>
<h2 className="font-bold text-3xl text-3xl text-gray-900">Explore by Keywords</h2>
<p className="text-gray-500">Direct access to specialized industry sectors.</p>
</div>
<a className="text-[#2563EB] font-bold hover:underline flex items-center gap-1" href="#">View All Sectors <span className="material-symbols-outlined">chevron_right</span></a>
</div>
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-gutter">
<div className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-xl hover:border-[#2563EB] transition-all cursor-pointer group">
<div className="w-full h-32 mb-4 rounded-lg bg-white flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
<div className="absolute inset-0" data-alt="A professional architectural photograph of a high-rise construction site with a yellow crane against a bright blue sky. The image should be clean, focused, and professional, utilizing a teal and white aesthetic to represent the construction industry's efficiency." style={{  }}></div>
</div>
<span className="font-bold text-gray-900 group-hover:text-[#2563EB]">Construction</span>
</div>
<div className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-xl hover:border-[#2563EB] transition-all cursor-pointer group">
<div className="w-full h-32 mb-4 rounded-lg bg-white flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
<div className="absolute inset-0" data-alt="A high-angle view of a freshly paved asphalt road stretching into the distance with sharp white lane markings. The scene is bright and airy, symbolizing infrastructure development with a professional, clean light-mode aesthetic in line with government procurement." style={{  }}></div>
</div>
<span className="font-bold text-gray-900 group-hover:text-[#2563EB]">Road Work</span>
</div>
<div className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-xl hover:border-[#2563EB] transition-all cursor-pointer group">
<div className="w-full h-32 mb-4 rounded-lg bg-white flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
<div className="absolute inset-0" data-alt="An artistic representation of a computer motherboard with glowing data pathways. The lighting is subtle and professional, focused on technology and IT procurement, following a minimalist corporate style with teal accents and soft white highlights." style={{  }}></div>
</div>
<span className="font-bold text-gray-900 group-hover:text-[#2563EB]">IT Services</span>
</div>
<div className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-xl hover:border-[#2563EB] transition-all cursor-pointer group">
<div className="w-full h-32 mb-4 rounded-lg bg-white flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
<div className="absolute inset-0" data-alt="A close-up of high-quality medical equipment in a sterilized laboratory setting. The atmosphere is clinical, reliable, and professional, reflecting the healthcare sector with a palette of crisp whites and deep teals to maintain institutional trust." style={{  }}></div>
</div>
<span className="font-bold text-gray-900 group-hover:text-[#2563EB]">Medical</span>
</div>
<div className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-xl hover:border-[#2563EB] transition-all cursor-pointer group">
<div className="w-full h-32 mb-4 rounded-lg bg-white flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
<div className="absolute inset-0" data-alt="Modern solar panels and a wind turbine in a green landscape, signifying sustainable energy. The image is bright and professional, representing green energy procurement with high-key lighting and a sophisticated corporate aesthetic." style={{  }}></div>
</div>
<span className="font-bold text-gray-900 group-hover:text-[#2563EB]">Energy</span>
</div>
<div className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-xl hover:border-[#2563EB] transition-all cursor-pointer group">
<div className="w-full h-32 mb-4 rounded-lg bg-white flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
<div className="absolute inset-0" data-alt="A large logistics warehouse with organized shelves and a forklift in motion. The image should be dynamic yet highly structured, depicting the supply chain and logistics sector with a clean, industrial-modern aesthetic using teal and slate tones." style={{  }}></div>
</div>
<span className="font-bold text-gray-900 group-hover:text-[#2563EB]">Logistics</span>
</div>
</div>
</div>

<div className="mb-20">
<h2 className="font-bold text-3xl text-3xl text-gray-900 mb-8">Explore by Authorities</h2>
<div className="flex flex-wrap gap-4">
<div className="px-8 py-6 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:shadow-md transition-all grayscale hover:grayscale-0">
<div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div> 
<span className="ml-4 font-bold text-gray-500">Defense Ministry</span>
</div>
<div className="px-8 py-6 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:shadow-md transition-all grayscale hover:grayscale-0">
<div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
<span className="ml-4 font-bold text-gray-500">Highway Auth</span>
</div>
<div className="px-8 py-6 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:shadow-md transition-all grayscale hover:grayscale-0">
<div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
<span className="ml-4 font-bold text-gray-500">Smart Cities</span>
</div>
<div className="px-8 py-6 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:shadow-md transition-all grayscale hover:grayscale-0">
<div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
<span className="ml-4 font-bold text-gray-500">Railways</span>
</div>
<div className="px-8 py-6 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:shadow-md transition-all grayscale hover:grayscale-0">
<div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
<span className="ml-4 font-bold text-gray-500">NHAI</span>
</div>
</div>
</div>

<div>
<h2 className="font-bold text-3xl text-3xl text-gray-900 mb-8">Explore by Region</h2>
<div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter items-center">
<div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm h-[400px] flex items-center justify-center overflow-hidden relative">
<div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#00685e 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>

<div className="text-center p-8"><span className="material-symbols-outlined text-[#2563EB] text-[40px] mb-4">map</span><p className="font-bold text-gray-500">Interactive India Map</p><p className="text-sm text-gray-500 opacity-60">Visualizing tenders across all Indian states</p></div></div>
<div className="grid grid-cols-2 gap-4"><button className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-[#2563EB] transition-all text-left"><span className="material-symbols-outlined text-[#2563EB]">map</span><div><div className="font-bold">Maharashtra</div><div className="text-xs text-gray-500">4,240 Tenders</div></div></button><button className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-[#2563EB] transition-all text-left"><span className="material-symbols-outlined text-[#2563EB]">map</span><div><div className="font-bold">Uttar Pradesh</div><div className="text-xs text-gray-500">3,890 Tenders</div></div></button><button className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-[#2563EB] transition-all text-left"><span className="material-symbols-outlined text-[#2563EB]">map</span><div><div className="font-bold">Tamil Nadu</div><div className="text-xs text-gray-500">2,110 Tenders</div></div></button><button className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-[#2563EB] transition-all text-left"><span className="material-symbols-outlined text-[#2563EB]">map</span><div><div className="font-bold">Delhi (City)</div><div className="text-xs text-gray-500">5,540 Tenders</div></div></button><button className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-[#2563EB] transition-all text-left"><span className="material-symbols-outlined text-[#2563EB]">map</span><div><div className="font-bold">Karnataka</div><div className="text-xs text-gray-500">2,500 Tenders</div></div></button><button className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-[#2563EB] transition-all text-left"><span className="material-symbols-outlined text-[#2563EB]">map</span><div><div className="font-bold">Gujarat</div><div className="text-xs text-gray-500">1,760 Tenders</div></div></button></div>
</div>
</div>
</div>
</section>

<section className="py-24 bg-white border-y border-gray-200">
<div className="max-w-max-width mx-auto px-margin-desktop text-center">
<h2 className="font-bold text-3xl text-3xl text-gray-900 mb-12">A million SMBs &amp; some of the world's best companies trust us</h2>
<div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all">
<span className="font-bold font-extrabold text-gray-900/40">TATA STEEL</span>
<span className="font-bold font-bold tracking-tighter text-gray-900/40">PwC</span>
<span className="font-bold font-bold text-gray-900/40">LARSEN &amp; TOUBRO</span>
<span className="font-bold font-bold italic text-gray-900/40">SIEMENS</span>
<span className="font-bold font-bold tracking-widest text-gray-900/40">ABB</span>
<span className="font-bold font-bold text-gray-900/40">BOSCH</span>
</div>
</div>
</section>

<section className="py-24 relative overflow-hidden bg-[#2563EB] text-white">

<div className="relative z-10 max-w-max-width mx-auto px-margin-desktop text-center">
<div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-md p-12 rounded-2xl border border-white/20">
<h2 className="font-bold text-4xl text-[40px] mb-6">Scale your government business today</h2>
<p className="text-lg mb-10 opacity-90">Join thousands of enterprises winning high-value contracts with TenderLinked's analytical tools and real-time intelligence.</p>
<div className="flex flex-col sm:flex-row gap-4 justify-center">
<button className="bg-white text-[#2563EB] px-10 py-4 rounded-lg font-bold text-body-lg hover:bg-white text-[#2563EB] transition-all shadow-lg active:scale-95">Request Demo</button>
<button className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-lg font-bold text-body-lg hover:bg-white/10 transition-all active:scale-95">View Pricing</button>
</div>
</div>
</div>
</section>
</main>
</div>
);
}
