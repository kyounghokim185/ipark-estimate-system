"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
    Calculator,
    Settings,
    Download,
    RefreshCcw,
    CheckSquare,
    Square,
    Camera,
    Building2,
    HardHat,
    Lightbulb,
    Calendar,
    User,
    FileText,
    Plus,
    Trash2,
    Briefcase,
    AlertTriangle,
    CheckCircle,
    Loader2,
    ChevronDown,
    ChevronUp,
    Save,
    LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// --- Types ---
type ZoneType = 'fashion' | 'living' | 'fnb' | 'back';
type GradeType = 'basic' | 'standard' | 'premium';
type ConstructionType = 'general' | 'restoration' | 'permit';

export default function Page() {
    // --- Constant Data (Ipark Mall Specific) ---
    const zones: Record<ZoneType, { name: string; baseRate: number; desc: string }> = {
        fashion: { name: '패션파크', baseRate: 0, desc: '의류 매장 중심' },
        living: { name: '리빙파크', baseRate: 0, desc: '가구 및 생활용품' },
        fnb: { name: 'F&B', baseRate: 0, desc: '주방 설비 및 배기' },
        back: { name: '후방', baseRate: 0, desc: '직원 공간 및 창고' }
    };

    const UNIT_PRICES: Record<ZoneType, Record<string, number>> = {
        fashion: {
            licensing: 200000000, design: 240000, temporary: 240000, demolition: 240000,
            floor: 600000, wall: 1000000, ceiling: 1000000, facade: 240000,
            furniture: 600000, signage: 240000, electrical: 1000000, hvac: 600000, firefighting: 600000
        },
        living: {
            licensing: 200000000, design: 240000, temporary: 240000, demolition: 240000,
            floor: 600000, wall: 1000000, ceiling: 1000000, facade: 240000,
            furniture: 600000, signage: 240000, electrical: 1000000, hvac: 600000, firefighting: 600000
        },
        fnb: {
            licensing: 200000000, design: 300000, temporary: 240000, demolition: 300000,
            floor: 800000, wall: 1200000, ceiling: 1000000, facade: 300000,
            furniture: 900000, signage: 240000, electrical: 1200000, hvac: 1000000, firefighting: 1000000
        },
        back: {
            licensing: 200000000, design: 160000, temporary: 240000, demolition: 160000,
            floor: 350000, wall: 500000, ceiling: 500000, facade: 160000,
            furniture: 350000, signage: 160000, electrical: 800000, hvac: 500000, firefighting: 500000
        }
    };

    const grades: Record<GradeType, { name: string; multiplier: number; desc: string }> = {
        basic: { name: '실속형', multiplier: 0.9, desc: '가성비 위주의 마감재' },
        standard: { name: '표준형', multiplier: 1.0, desc: '아이파크몰 권장 표준 사양' },
        premium: { name: '프리미엄', multiplier: 1.3, desc: '수입 자재 및 특수 디자인 적용' }
    };

    const constructionTypes: Record<ConstructionType, { name: string; desc: string }> = {
        general: { name: '일반 공사', desc: '표준 리뉴얼 (단가 80% 적용)' },
        restoration: { name: '원상 복구 공사', desc: '철거 중심 (철거 150%, 마감 10%)' },
        permit: { name: '인허가 공사', desc: '관공서 대관 업무 포함 (단가 100%)' }
    };

    // --- State Management ---
    const [projectInfo, setProjectInfo] = useState({
        name: '아이파크몰 리뉴얼 공사',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        author: '시설팀 홍길동',
        remarks: ''
    });

    const [area, setArea] = useState(100);
    const [zone, setZone] = useState<ZoneType>('fashion');
    const [grade, setGrade] = useState<GradeType>('standard');
    const [constructionType, setConstructionType] = useState<ConstructionType>('general');

    const [detailedScopes, setDetailedScopes] = useState([
        { id: 'licensing', label: '인허가', active: true, area: 1, unitPrice: 0, remarks: '', isFixedRate: true, details: [] as any[], isExpanded: false },
        { id: 'design', label: '설계', active: true, area: 100, unitPrice: 0, remarks: '', isFixedRate: false, details: [] as any[], isExpanded: false },
        { id: 'temporary', label: '가설', active: true, area: 100, unitPrice: 0, remarks: '', isFixedRate: false, details: [] as any[], isExpanded: false },
        { id: 'demolition', label: '철거', active: true, area: 100, unitPrice: 0, remarks: '', isFixedRate: false, details: [] as any[], isExpanded: false },
        { id: 'floor', label: '바닥', active: true, area: 100, unitPrice: 0, remarks: '', isFixedRate: false, details: [] as any[], isExpanded: false },
        { id: 'wall', label: '벽체', active: true, area: 100, unitPrice: 0, remarks: '', isFixedRate: false, details: [] as any[], isExpanded: false },
        { id: 'ceiling', label: '천장/조명', active: true, area: 100, unitPrice: 0, remarks: '', isFixedRate: false, details: [] as any[], isExpanded: false },
        { id: 'facade', label: '파사드', active: true, area: 100, unitPrice: 0, remarks: '', isFixedRate: false, details: [] as any[], isExpanded: false },
        { id: 'furniture', label: '집기', active: true, area: 100, unitPrice: 0, remarks: '', isFixedRate: false, details: [] as any[], isExpanded: false },
        { id: 'signage', label: '사인', active: true, area: 100, unitPrice: 0, remarks: '', isFixedRate: false, details: [] as any[], isExpanded: false },
        { id: 'electrical', label: '전기/통신', active: true, area: 100, unitPrice: 0, remarks: '', isFixedRate: false, details: [] as any[], isExpanded: false },
        { id: 'hvac', label: '설비/위생', active: true, area: 100, unitPrice: 0, remarks: '', isFixedRate: false, details: [] as any[], isExpanded: false },
        { id: 'firefighting', label: '소방/제연', active: true, area: 100, unitPrice: 0, remarks: '', isFixedRate: false, details: [] as any[], isExpanded: false },
    ]);

    const [photos, setPhotos] = useState<{ id: number, src: string, desc: string, date: string }[]>([]);

    // Persistence State
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Load Estimate if ID is present

        const searchParams = new URLSearchParams(window.location.search);
        const id = searchParams.get('id');
        if (id) {
            const saved = localStorage.getItem('ipark_estimates');
            if (saved) {
                const estimates = JSON.parse(saved);
                const target = estimates.find((e: any) => e.id === id);
                if (target) {
                    setCurrentId(target.id);
                    setProjectInfo(target.projectInfo);
                    setArea(target.data.area);
                    setZone(target.data.zone);
                    setGrade(target.data.grade);
                    setConstructionType(target.data.constructionType);
                    setDetailedScopes(target.data.detailedScopes);
                    setPhotos(target.data.photos || []);
                }
            }
        }
    }, []);

    const handleSave = () => {
        setIsSaving(true);
        try {
            const saved = localStorage.getItem('ipark_estimates');
            let estimates = saved ? JSON.parse(saved) : [];

            const newEstimate = {
                id: currentId || crypto.randomUUID(),
                lastModified: Date.now(),
                projectInfo: projectInfo,
                totals: totals,
                data: {
                    area,
                    zone,
                    grade,
                    constructionType,
                    detailedScopes,
                    photos
                }
            };

            if (currentId) {
                estimates = estimates.map((e: any) => e.id === currentId ? newEstimate : e);
            } else {
                estimates.unshift(newEstimate); // Newest first
                setCurrentId(newEstimate.id);
                // Update URL without reload
                const newUrl = `${window.location.pathname}?id=${newEstimate.id}`;
                window.history.replaceState({ path: newUrl }, '', newUrl);
            }

            localStorage.setItem('ipark_estimates', JSON.stringify(estimates));
            alert('견적서가 저장되었습니다.');
        } catch (e) {
            console.error(e);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };



    useEffect(() => {
        // Convert GLOBAL Area (m2) to Pyeong for the scopes
        const pyeongArea = area * 0.3025;
        // setDetailedScopes(prev => prev.map(scope => ({ ...scope, area: pyeongArea })));
        setDetailedScopes(prev => prev.map(scope => {
            if (scope.isFixedRate) {
                return scope; // Fixed rate items have independent area (usually 1 or manually set)
            }
            return { ...scope, area: pyeongArea };
        }));
    }, [area]);

    useEffect(() => {
        const pyeong = area * 0.3025;

        const getMultiplier = (g: GradeType, p: number) => {
            if (g === 'standard') {
                if (p < 100) return 1.2;
                if (p < 500) return 1.1;
                if (p < 1000) return 1.0;
                return 0.9;
            }
            if (g === 'basic') {
                if (p < 100) return 1.2;
                if (p < 500) return 1.0;
                if (p < 1000) return 0.9;
                return 0.8;
            }
            if (g === 'premium') {
                if (p < 100) return 1.3;
                if (p < 500) return 1.2;
                if (p < 1000) return 1.1;
                return 1.0;
            }
            return 1.0;
        };

        const multiplier = getMultiplier(grade, pyeong);

        setDetailedScopes(prev => prev.map(scope => {
            let newScope = { ...scope };
            // Set Unit Price from Look-up Table * Tiered Multiplier
            const basePrice = UNIT_PRICES[zone][scope.id] || 0;

            newScope.unitPrice = Math.round(basePrice * multiplier);
            return newScope;
        }));
    }, [zone, grade, area]);

    const handleScopeChange = (id: string, field: string, value: any) => {
        setDetailedScopes(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const toggleScopeActive = (id: string) => {
        setDetailedScopes(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
    };

    const toggleScopeExpanded = (id: string) => {
        setDetailedScopes(prev => prev.map(s => s.id === id ? { ...s, isExpanded: !s.isExpanded } : s));
    };

    const addDetail = (scopeId: string) => {
        setDetailedScopes(prev => prev.map(s => {
            if (s.id === scopeId) {
                return {
                    ...s,
                    details: [...(s.details || []), { id: Date.now(), desc: '', area: 0, unitPrice: 0, remarks: '' }],
                    isExpanded: true // Auto expand when adding
                };
            }
            return s;
        }));
    };

    const updateDetail = (scopeId: string, detailId: number, field: string, value: any) => {
        setDetailedScopes(prev => prev.map(s => {
            if (s.id === scopeId) {
                return {
                    ...s,
                    details: s.details.map(d => d.id === detailId ? { ...d, [field]: value } : d)
                };
            }
            return s;
        }));
    };

    const removeDetail = (scopeId: string, detailId: number) => {
        setDetailedScopes(prev => prev.map(s => {
            if (s.id === scopeId) {
                return { ...s, details: s.details.filter(d => d.id !== detailId) };
            }
            return s;
        }));
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setPhotos([...photos, { id: Date.now(), src: reader.result, desc: '현장 특이사항 기재 필요', date: new Date().toLocaleDateString() }]);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = (id: number) => {
        setPhotos(photos.filter(p => p.id !== id));
    };

    const calculateTotal = () => {
        let subtotal = 0;
        const visibleScopes = detailedScopes.filter(s => {
            if (constructionType === 'restoration' && ['furniture', 'signage', 'facade'].includes(s.id)) return false;
            if (constructionType !== 'permit' && s.id === 'licensing') return false;
            return true;
        });
        const activeItems = visibleScopes.filter(s => s.active);

        activeItems.forEach(s => {
            // Main scope cost
            subtotal += Math.round(s.area * s.unitPrice);

            // Detailed items cost
            if (s.details && s.details.length > 0) {
                s.details.forEach((d: any) => {
                    subtotal += Math.round(d.area * d.unitPrice);
                });
            }
        });

        const overhead = Math.round(subtotal * 0.10);
        return { subtotal, overhead, total: subtotal + overhead };
    };

    const totals = calculateTotal();

    const handlePrint = () => { window.print(); };

    // --- RENDER ---

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12 md:pb-24 print:bg-white print:p-0">

            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 flex flex-wrap gap-2 justify-between items-center px-4 md:px-6 py-4 no-print shadow-sm font-medium">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="bg-blue-600 p-2 rounded-xl shrink-0"><Building2 className="text-white" size={18} /></div>
                    <span className="text-sm md:text-xl font-black text-slate-800 tracking-tight leading-none">IPARK MALL <span className="text-blue-600 block md:inline">Smart Estimator</span></span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                    <Link href="/dashboard" className="flex items-center gap-1 md:gap-2 px-3 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 hover:text-blue-600 transition-colors text-xs whitespace-nowrap">
                        <LayoutDashboard size={14} /> <span className="hidden md:inline">대시보드</span>
                    </Link>
                    <button onClick={handleSave} disabled={isSaving} className={`flex items-center gap-1 md:gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-colors whitespace-nowrap ${isSaving ? 'bg-blue-100 text-blue-400' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md hover:shadow-lg'}`}>
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {isSaving ? '저장...' : '저장'}
                    </button>
                    {/* AI Button Removed */}
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">

                {/* 1. HERO SECTION */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#111827] text-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden shadow-2xl print:bg-white print:text-black print:border-b-2 print:border-black"
                >
                    {/* Background Decos */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -mr-32 -mt-32 pointer-events-none no-print"></div>

                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <span className="bg-white/10 backdrop-blur-md text-white border border-white/20 text-[11px] font-extrabold px-3 py-1.5 rounded-full tracking-wider shadow-sm">PROJECT ESTIMATE</span>
                            <span className="text-slate-400 text-xs font-semibold">{new Date().toLocaleDateString()} 기준</span>
                        </div>
                        <button onClick={handlePrint} className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all backdrop-blur-sm no-print text-slate-200 hover:text-white">
                            <Download size={16} /> PDF 저장/인쇄
                        </button>
                    </div>

                    <h2 className="text-2xl md:text-5xl font-black mb-4 md:mb-6 tracking-tight leading-tight">{projectInfo.name || '공사명 미입력'}</h2>

                    <div className="flex flex-wrap gap-2 md:gap-x-8 md:gap-y-3 text-xs md:text-base text-blue-100/90 mb-6 md:mb-10 font-bold">
                        <span className="flex items-center gap-1 md:gap-2 bg-blue-900/40 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-blue-500/20"><Building2 size={14} className="md:w-[18px]" /> {zones[zone].name}</span>
                        <span className="flex items-center gap-2 bg-blue-900/40 px-3 py-1.5 rounded-lg border border-blue-500/20"><Settings size={18} /> {constructionTypes[constructionType].name}</span>
                        <span className="flex items-center gap-2 bg-blue-900/40 px-3 py-1.5 rounded-lg border border-blue-500/20"><HardHat size={18} /> {grades[grade].name}</span>
                        <span className="flex items-center gap-2 bg-blue-900/40 px-3 py-1.5 rounded-lg border border-blue-500/20"><Calculator size={18} /> {Math.round(area * 0.3025)}평 ({area}m²)</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 border-t border-white/10 pt-6 md:pt-8 relative z-10 no-print">
                        <div>
                            <p className="text-slate-400 text-[10px] md:text-xs font-bold mb-1 md:mb-2 uppercase tracking-wide">총 예상 공사비 (VAT 별도)</p>
                            <div className="text-4xl md:text-6xl font-black tracking-tighter mb-2">₩ {totals.total.toLocaleString()}</div>
                            <div className="flex flex-wrap gap-3 md:gap-4 text-[10px] md:text-xs font-medium text-slate-400">
                                <span>순공사비: {totals.subtotal.toLocaleString()}</span>
                                <span className="text-blue-400">일반관리비: {totals.overhead.toLocaleString()}</span>
                            </div>
                        </div>
                        {/* AI Button Removed */}
                    </div>

                    {/* Print Version Total */}
                    <div className="hidden print:block text-right pt-4 border-t border-black mt-4">
                        <div className="text-4xl font-black text-black">Total: ₩ {totals.total.toLocaleString()}</div>
                    </div>
                </motion.div>

                {/* 2. Basic Info Card */}
                <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 print:shadow-none print:border print:border-slate-300">
                    <h3 className="text-lg font-extrabold flex items-center gap-3 mb-6 md:mb-8 text-slate-800 border-l-4 border-blue-600 pl-3">
                        <FileText className="text-blue-600" size={24} /> 공사 개요 및 기본 설정
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">공사명</label>
                            <input type="text" value={projectInfo.name} onChange={e => setProjectInfo({ ...projectInfo, name: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-800 font-bold text-lg focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300" placeholder="공사명을 입력하세요" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">작성자</label>
                            <div className="relative">
                                <User className="absolute left-5 top-4 text-slate-400" size={18} />
                                <input type="text" value={projectInfo.author} onChange={e => setProjectInfo({ ...projectInfo, author: e.target.value })} className="w-full pl-12 bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-800 font-medium focus:ring-2 focus:ring-blue-100 transition-all" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">공사 기간</label>
                            <div className="flex gap-4">
                                <input type="date" value={projectInfo.startDate} onChange={e => setProjectInfo({ ...projectInfo, startDate: e.target.value })} className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-100 outline-none" />
                                <span className="text-slate-300 self-center font-bold">~</span>
                                <input type="date" value={projectInfo.endDate} onChange={e => setProjectInfo({ ...projectInfo, endDate: e.target.value })} className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-100 outline-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">특이사항</label>
                            <input type="text" value={projectInfo.remarks} onChange={e => setProjectInfo({ ...projectInfo, remarks: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-800 font-medium focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300" placeholder="특이사항을 입력하세요" />
                        </div>
                    </div>
                </div>

                {/* 3. Criteria Settings */}
                <div className="bg-white rounded-[2rem] p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 print:break-inside-avoid">
                    <h3 className="text-lg font-extrabold flex items-center gap-3 mb-8 text-slate-800 border-l-4 border-blue-600 pl-3">
                        <Settings className="text-blue-600" size={24} /> 견적 산출 기준 설정
                    </h3>

                    {/* Construction Type - Boxed Selector */}
                    <div className="mb-10">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4 block ml-1 flex items-center gap-2"><Briefcase size={14} /> 공사 유형</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(constructionTypes).map(([key, val]) => (
                                <button key={key} onClick={() => setConstructionType(key as ConstructionType)}
                                    className={`text-left p-6 rounded-[1.5rem] border-2 transition-all relative overflow-hidden group ${constructionType === key ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200 hover:bg-slate-50'}`}>
                                    <div className="relative z-10">
                                        <div className="font-black text-base mb-2">{val.name}</div>
                                        <div className={`text-xs font-medium leading-relaxed ${constructionType === key ? 'text-blue-100' : 'text-slate-400'}`}>{val.desc}</div>
                                    </div>
                                    {constructionType === key && <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Selectors */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8 align-end">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">리뉴얼 구역</label>
                                <div className="relative">
                                    <select value={zone} onChange={e => setZone(e.target.value as ZoneType)} className="w-full appearance-none bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer">
                                        {Object.entries(zones).map(([key, val]) => <option key={key} value={key}>{val.name}</option>)}
                                    </select>
                                    <div className="absolute right-5 top-5 text-slate-400 pointer-events-none text-xs">▼</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">마감 등급</label>
                                <div className="relative">
                                    <select value={grade} onChange={e => setGrade(e.target.value as GradeType)} className="w-full appearance-none bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer">
                                        {Object.entries(grades).map(([key, val]) => <option key={key} value={key}>{val.name}</option>)}
                                    </select>
                                    <div className="absolute right-5 top-5 text-slate-400 pointer-events-none text-xs">▼</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-[1.5rem] p-6 border border-slate-100 flex flex-col justify-center">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4 block">전용 면적</label>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={Number((area * 0.3025).toFixed(1))}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                if (!isNaN(val)) setArea(Number((val / 0.3025).toFixed(2)));
                                            }}
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 font-black text-xl text-center text-slate-800 outline-none shadow-sm focus:border-blue-500 transition-all"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">평</span>
                                    </div>
                                    <span className="text-slate-300">⇄</span>
                                    <div className="relative flex-1">
                                        <input type="number" step="0.01" value={area} onChange={e => setArea(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 font-black text-xl text-center text-slate-800 outline-none shadow-sm focus:border-blue-500 transition-all" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">m²</span>
                                    </div>
                                </div>
                                <div className="flex-1 px-1">
                                    <input type="range" min="10" max="16530" value={area} onChange={e => setArea(Number(e.target.value))} className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600 no-print" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Detailed List & Photos */}
                <div className="bg-white rounded-[2rem] p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 print:break-inside-avoid">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-extrabold flex items-center gap-3 text-slate-800 border-l-4 border-blue-600 pl-3">
                            <Calculator className="text-blue-600" size={24} /> 공종별 상세 내역
                        </h3>
                        {/* AI Button Removed */}
                    </div>

                    <div className="overflow-x-auto mb-8">
                        <table className="w-full min-w-[700px] text-sm group">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="py-4 pl-4 w-12 no-print"></th>
                                    <th className="py-4 text-slate-400 font-bold uppercase text-xs">공종명</th>
                                    <th className="py-4 text-right text-slate-400 font-bold uppercase text-xs">면적(평)</th>
                                    <th className="py-4 text-right text-slate-400 font-bold uppercase text-xs">단가(원)</th>
                                    <th className="py-4 text-right text-slate-400 font-bold uppercase text-xs">금액(원)</th>
                                    <th className="py-4 pl-6 text-slate-400 font-bold uppercase text-xs">특이사항</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {detailedScopes.map((scope) => {
                                    if (constructionType === 'restoration' && ['furniture', 'signage'].includes(scope.id)) return null;
                                    if (constructionType !== 'permit' && scope.id === 'licensing') return null;
                                    return (
                                        <React.Fragment key={scope.id}>
                                            <tr className={`transition-colors hover:bg-slate-50/50 ${scope.active ? '' : 'opacity-40 grayscale'}`}>
                                                <td className="py-4 pl-4 no-print align-middle">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => toggleScopeActive(scope.id)} className={`text-blue-600 hover:scale-110 transition-transform ${!scope.active && 'text-slate-300'}`}>
                                                            {scope.active ? <CheckSquare size={20} /> : <Square size={20} />}
                                                        </button>
                                                        {scope.active && (
                                                            <button onClick={() => toggleScopeExpanded(scope.id)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                                                                {scope.isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 font-bold text-slate-700 text-base align-middle">
                                                    {scope.label}
                                                    {scope.id === 'licensing' && <span className="ml-2 bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">필수</span>}
                                                </td>
                                                <td className="py-4 text-right align-middle">
                                                    <div className="relative inline-block">
                                                        <input
                                                            type="number"
                                                            value={scope.isFixedRate ? scope.area : Number(scope.area.toFixed(1))}
                                                            onChange={e => handleScopeChange(scope.id, 'area', Number(e.target.value))}
                                                            disabled={scope.isFixedRate}
                                                            className={`w-20 text-right font-medium bg-transparent border-b border-transparent focus:border-blue-300 outline-none transition-colors ${scope.isFixedRate ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600'}`}
                                                        />
                                                        {scope.isFixedRate && <span className="absolute right-0 -mr-6 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">식</span>}
                                                    </div>
                                                </td>
                                                <td className="py-4 text-right align-middle">
                                                    <input
                                                        type="number"
                                                        value={scope.unitPrice}
                                                        onChange={e => handleScopeChange(scope.id, 'unitPrice', Number(e.target.value))} // Note: This might be overwritten by auto-calc if logic isn't blocked, but user requested editing.
                                                        className="w-24 text-right font-medium text-slate-600 tracking-tight bg-transparent border-b border-transparent focus:border-blue-300 outline-none transition-colors"
                                                    />
                                                </td>
                                                <td className="py-4 text-right font-black text-slate-800 tracking-tight text-base align-middle">
                                                    {Math.round(
                                                        (scope.area * scope.unitPrice) +
                                                        (scope.details ? scope.details.reduce((acc: number, cur: any) => acc + (cur.area * cur.unitPrice), 0) : 0)
                                                    ).toLocaleString()}
                                                </td>
                                                <td className="py-4 pl-6 align-middle"><input type="text" value={scope.remarks} onChange={e => handleScopeChange(scope.id, 'remarks', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-blue-300 outline-none text-slate-600 placeholder:text-slate-300 transition-colors" placeholder="-" /></td>
                                            </tr>
                                            {/* Detailed Items Section */}
                                            {scope.active && scope.isExpanded && (
                                                <tr className="bg-slate-50/50">
                                                    <td colSpan={6} className="p-0">
                                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-12 py-6 border-b border-slate-100">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h5 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> 상세 항목 구성
                                                                </h5>
                                                                <button onClick={() => addDetail(scope.id)} className="text-xs bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-sm">
                                                                    <Plus size={12} /> 항목 추가
                                                                </button>
                                                            </div>

                                                            {scope.details && scope.details.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {scope.details.map((detail: any) => (
                                                                        <div key={detail.id} className="grid grid-cols-12 gap-4 items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                                            <div className="col-span-3">
                                                                                <input type="text" placeholder="항목명 (예: 타일)" value={detail.desc} onChange={e => updateDetail(scope.id, detail.id, 'desc', e.target.value)} className="w-full text-sm font-bold text-slate-700 bg-transparent outline-none placeholder:text-slate-300" />
                                                                            </div>
                                                                            <div className="col-span-2 flex items-center gap-2">
                                                                                <span className="text-[10px] text-slate-400 font-bold w-8">면적</span>
                                                                                <input type="number" value={detail.area} onChange={e => updateDetail(scope.id, detail.id, 'area', Number(e.target.value))} className="w-full text-sm text-right font-medium text-slate-600 bg-slate-50 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-blue-200" />
                                                                            </div>
                                                                            <div className="col-span-2 flex items-center gap-2">
                                                                                <span className="text-[10px] text-slate-400 font-bold w-8">단가</span>
                                                                                <input type="number" value={detail.unitPrice} onChange={e => updateDetail(scope.id, detail.id, 'unitPrice', Number(e.target.value))} className="w-full text-sm text-right font-medium text-slate-600 bg-slate-50 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-blue-200" />
                                                                            </div>
                                                                            <div className="col-span-2 text-right font-bold text-slate-800 text-sm">
                                                                                {(detail.area * detail.unitPrice).toLocaleString()}원
                                                                            </div>
                                                                            <div className="col-span-2">
                                                                                <input type="text" placeholder="비고" value={detail.remarks} onChange={e => updateDetail(scope.id, detail.id, 'remarks', e.target.value)} className="w-full text-xs text-slate-500 bg-transparent outline-none placeholder:text-slate-300" />
                                                                            </div>
                                                                            <div className="col-span-1 text-right">
                                                                                <button onClick={() => removeDetail(scope.id, detail.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><Trash2 size={14} /></button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    <div className="text-right text-xs font-bold text-slate-500 mt-2 p-2">
                                                                        상세 합계: <span className="text-blue-600 text-sm ml-1">{scope.details.reduce((acc: number, cur: any) => acc + (cur.area * cur.unitPrice), 0).toLocaleString()}원</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-4 text-xs text-slate-400 bg-slate-100/50 rounded-xl border border-dashed border-slate-200">
                                                                    추가된 상세 항목이 없습니다.
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Site Photos */}
                    <div className="pt-8 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold flex items-center gap-2 text-slate-700"><Camera className="text-blue-600" size={18} /> 현장 사진 대장</h4>
                            <button onClick={() => fileInputRef.current?.click()} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors no-print"><Plus size={14} /> 사진 추가</button>
                            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                        </div>

                        {photos.length === 0 ? (
                            <div className="border-2 border-dashed border-slate-200 rounded-3xl py-12 text-center bg-slate-50/50">
                                <span className="text-slate-400 text-sm font-medium">등록된 현장 사진이 없습니다.</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {photos.map(p => (
                                    <div key={p.id} className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                        <img src={p.src} className="w-full h-32 object-cover" alt="site" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 no-print">
                                            <button onClick={() => removePhoto(p.id)} className="bg-white/90 p-2 rounded-full text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
                                        </div>
                                        <div className="p-2 bg-white text-xs font-bold text-center border-t text-slate-600">{p.date}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. Footer Banner & Tip */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6 print:hidden">
                    <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100 flex gap-4 items-start">
                        <div className="bg-orange-100 p-2 rounded-full text-orange-500"><Lightbulb size={20} /></div>
                        <div>
                            <h4 className="font-bold text-amber-900 mb-2">예산 관리 TIP</h4>
                            <p className="text-sm text-amber-800 leading-relaxed font-medium">
                                순공사비 기준 평당 단가는 약 <strong className="text-amber-900">{Math.round(totals.subtotal / (area * 0.3025)).toLocaleString()}원</strong>입니다. 불필요한 마감재 스펙을 조정하면 예산을 절감할 수 있습니다.
                            </p>
                        </div>
                    </div>

                    <div className="bg-blue-600 rounded-[2rem] p-10 text-white text-center shadow-lg shadow-blue-600/20 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black mb-3">전문가 검토가 필요하신가요?</h3>
                            <p className="text-blue-100 text-base mb-8 font-medium">상세 견적 검토는 시설팀으로 문의해주세요.</p>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-20 -mb-20 blur-3xl"></div>
                    </div>
                </div>

            </main>

        </div>
    );
}
