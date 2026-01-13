"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
    Calculator,
    Settings,
    Download,
    Zap,
    Building2,
    HardHat,
    Lightbulb,
    X,
    Send,
    CheckSquare,
    Square,
    Camera,
    Calendar,
    User,
    FileText,
    Plus,
    Trash2,
    Briefcase,
    LayoutDashboard,
    Save,
    MapPin,
    Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- Types ---
type ZoneType = 'fashion' | 'living' | 'fnb' | 'center';
type GradeType = 'basic' | 'standard' | 'premium';
type ConstructionType = 'general' | 'restoration' | 'permit';
type ViewMode = 'calculator' | 'dashboard';

interface ScopeItem {
    id: string;
    label: string;
    active: boolean;
    area: number;
    unitPrice: number;
    remarks: string;
    ratio?: number;
    isFixedRate?: boolean;
}

interface Photo {
    id: number;
    src: string;
    desc: string;
    date: string;
}

interface ChatMessage {
    role: 'ai' | 'user';
    text: string;
}

interface SavedEstimate {
    id: string;
    createdAt: string;
    projectInfo: {
        name: string;
        author: string;
        startDate: string;
        endDate: string;
        remarks: string;
    };
    params: {
        zone: ZoneType;
        grade: GradeType;
        constructionType: ConstructionType;
        area: number;
    };
    totals: {
        total: number;
    };
    data: any; // Full state backup
}

export default function Page() {
    // --- Data ---
    const zones: Record<ZoneType, { name: string; baseRate: number }> = {
        fashion: { name: '패션파크', baseRate: 1800000 },
        living: { name: '리빙파크', baseRate: 1600000 },
        fnb: { name: 'F&B/푸드코트', baseRate: 2500000 },
        center: { name: '더 센터/로비', baseRate: 2200000 }
    };

    const grades: Record<GradeType, { name: string; multiplier: number }> = {
        basic: { name: '실속형', multiplier: 0.9 },
        standard: { name: '표준형', multiplier: 1.0 },
        premium: { name: '프리미엄', multiplier: 1.3 }
    };

    const constructionTypes: Record<ConstructionType, { name: string; desc: string }> = {
        general: { name: '일반 공사', desc: '표준 리뉴얼 (단가 80% 적용)' },
        restoration: { name: '원상 복구 공사', desc: '철거 중심 (철거 150%, 마감 10%)' },
        permit: { name: '인허가 공사', desc: '관공서 대관 업무 포함 (단가 100%)' }
    };

    // --- State ---
    const [view, setView] = useState<ViewMode>('calculator');
    const [savedEstimates, setSavedEstimates] = useState<SavedEstimate[]>([]);

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

    const [detailedScopes, setDetailedScopes] = useState<ScopeItem[]>([
        { id: 'licensing', label: '인허가', active: false, area: 100, unitPrice: 0, remarks: '대관 업무 및 필증', ratio: 0.1 },
        { id: 'demolition', label: '가설/철거', active: true, area: 100, unitPrice: 80000, remarks: '', isFixedRate: true },
        { id: 'floor', label: '바닥 공사', active: true, area: 100, unitPrice: 0, remarks: '', ratio: 0.15 },
        { id: 'wall', label: '벽체 공사', active: true, area: 100, unitPrice: 0, remarks: '', ratio: 0.25 },
        { id: 'ceiling', label: '천장 공사', active: true, area: 100, unitPrice: 0, remarks: '', ratio: 0.20 },
        { id: 'electrical', label: '전기/조명', active: true, area: 100, unitPrice: 0, remarks: '', ratio: 0.15 },
        { id: 'hvac', label: '공조 설비', active: true, area: 100, unitPrice: 0, remarks: '', ratio: 0.12 },
        { id: 'firefighting', label: '소방/안전', active: true, area: 100, unitPrice: 0, remarks: '', ratio: 0.08 },
        { id: 'furniture', label: '집기/가구', active: false, area: 100, unitPrice: 0, remarks: '별도 발주 예정', ratio: 0.25 },
        { id: 'signage', label: '사인 공사', active: false, area: 100, unitPrice: 0, remarks: '', ratio: 0.05 },
        { id: 'etc', label: '기타 공사', active: false, area: 100, unitPrice: 0, remarks: '', ratio: 0.05 },
    ]);

    const [photos, setPhotos] = useState<Photo[]>([]);
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
        { role: 'ai', text: '안녕하세요! 아이파크몰 리뉴얼 AI 튜터입니다.' }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const printRef = useRef<HTMLDivElement>(null);

    // --- Effects ---
    useEffect(() => {
        const saved = localStorage.getItem('ipark_estimates');
        if (saved) {
            try { setSavedEstimates(JSON.parse(saved)); } catch (e) { }
        }
    }, []);

    useEffect(() => {
        setDetailedScopes(prev => prev.map(scope => ({ ...scope, area: area })));
    }, [area]);

    useEffect(() => {
        const baseRate = zones[zone].baseRate * grades[grade].multiplier;
        const baseDemolition = 80000;

        setDetailedScopes(prev => prev.map(scope => {
            let newScope = { ...scope };
            let multiplier = 1.0;
            let calculatedPrice = 0;

            if (constructionType === 'general') {
                multiplier = 0.8;
                if (scope.id === 'demolition') calculatedPrice = baseDemolition * multiplier;
                else calculatedPrice = Math.round(baseRate * (scope.ratio || 0) * multiplier);
                if (scope.id === 'licensing') newScope.active = false;
            } else if (constructionType === 'restoration') {
                if (scope.id === 'demolition') calculatedPrice = baseDemolition * 1.5;
                else if (['floor', 'wall', 'ceiling'].includes(scope.id)) calculatedPrice = Math.round(baseRate * (scope.ratio || 0) * 0.1);
                else calculatedPrice = Math.round(baseRate * (scope.ratio || 0) * 0.2);
                if (['furniture', 'signage', 'licensing'].includes(scope.id)) newScope.active = false;
            } else if (constructionType === 'permit') {
                multiplier = 1.0;
                if (scope.id === 'demolition') calculatedPrice = baseDemolition;
                else calculatedPrice = Math.round(baseRate * (scope.ratio || 0));
                if (scope.id === 'licensing') newScope.active = true;
            }

            newScope.unitPrice = calculatedPrice;
            return newScope;
        }));
    }, [zone, grade, constructionType, area]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // --- Calculation ---
    const calculateTotal = () => {
        let subtotal = 0;
        const visibleScopes = detailedScopes.filter(s => {
            if (constructionType === 'restoration' && ['furniture', 'signage'].includes(s.id)) return false;
            if (constructionType !== 'permit' && s.id === 'licensing') return false;
            return true;
        });
        const activeItems = visibleScopes.filter(s => s.active);
        activeItems.forEach(s => {
            subtotal += (s.area * s.unitPrice);
        });
        const overhead = subtotal * 0.10;
        return { subtotal, overhead, total: subtotal + overhead };
    };

    const totals = calculateTotal();

    // --- Handlers ---
    const handleScopeChange = (id: string, field: keyof ScopeItem, value: any) => {
        setDetailedScopes(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const toggleScopeActive = (id: string) => {
        setDetailedScopes(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setPhotos([...photos, { id: Date.now(), src: reader.result, desc: '현장 특이사항', date: new Date().toLocaleDateString() }]);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleExportPDF = async () => {
        if (!printRef.current) return;
        try {
            const canvas = await html2canvas(printRef.current, { scale: 2, logging: false, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${projectInfo.name}_견적서.pdf`);
        } catch (error) { alert("오류 발생"); }
    };

    const handleSaveEstimate = () => {
        const newEstimate: SavedEstimate = {
            id: Date.now().toString(),
            createdAt: new Date().toLocaleString(),
            projectInfo: { ...projectInfo },
            params: { zone, grade, constructionType, area },
            totals: { total: totals.total },
            data: { detailedScopes, photos }
        };
        const updated = [newEstimate, ...savedEstimates];
        setSavedEstimates(updated);
        localStorage.setItem('ipark_estimates', JSON.stringify(updated));
        alert("저장되었습니다.");
    };

    const handleLoadEstimate = (est: SavedEstimate) => {
        setProjectInfo(est.projectInfo);
        setZone(est.params.zone);
        setGrade(est.params.grade);
        setConstructionType(est.params.constructionType);
        setArea(est.params.area);
        setDetailedScopes(est.data.detailedScopes);
        setPhotos(est.data.photos);
        setView('calculator');
    };

    const handleSendMessage = async () => {
        if (!userInput.trim()) return;
        setChatHistory(prev => [...prev, { role: 'user', text: userInput }]);
        setUserInput('');
        setIsGenerating(true);
        setTimeout(() => {
            setChatHistory(prev => [...prev, { role: 'ai', text: "네, 알겠습니다. 해당 내용에 대해 검토해 드리겠습니다." }]);
            setIsGenerating(false);
        }, 1000);
    };

    // --- Dashboard Component ---
    const Dashboard = () => (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2"><LayoutDashboard /> 견적 대시보드</h2>
                <button onClick={() => setView('calculator')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">견적 작성하기</button>
            </div>
            <div className="grid gap-4">
                {savedEstimates.map(est => (
                    <div key={est.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">{est.projectInfo.name}</h3>
                            <p className="text-sm text-slate-500">{est.createdAt} | {est.projectInfo.author}</p>
                            <p className="text-sm mt-1">{est.params.area}㎡ | ₩{est.totals.total.toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleLoadEstimate(est)} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">불러오기</button>
                            <button onClick={() => {
                                const updated = savedEstimates.filter(e => e.id !== est.id);
                                setSavedEstimates(updated);
                                localStorage.setItem('ipark_estimates', JSON.stringify(updated));
                            }} className="bg-red-50 text-red-500 p-2 rounded-lg"><Trash2 size={18} /></button>
                        </div>
                    </div>
                ))}
                {savedEstimates.length === 0 && <div className="text-center py-10 text-slate-400">저장된 견적이 없습니다.</div>}
            </div>
        </div>
    );

    if (view === 'dashboard') return <Dashboard />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20 print:bg-white print:p-0">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 flex justify-between items-center px-6 py-4 no-print">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg"><Building2 className="text-white" size={20} /></div>
                    <span className="text-xl font-bold text-slate-800">IPARK MALL <span className="text-blue-600">Smart Estimator</span></span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('dashboard')} className="text-slate-500 hover:text-slate-800"><LayoutDashboard size={20} /></button>
                    <button onClick={() => setIsAiOpen(!isAiOpen)} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full font-bold flex items-center gap-2 text-sm">
                        <Zap size={16} fill="currentColor" /> AI 튜터 {isAiOpen ? 'ON' : 'OFF'}
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6 space-y-6" ref={printRef}>

                {/* 1. HERO CARD (Blue) */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-[#111827] text-white rounded-3xl p-8 relative overflow-hidden shadow-xl print:bg-white print:text-black print:border-b-2 print:border-black"
                >
                    {/* Background Decos */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none no-print"></div>

                    {/* Top Row: Tag & Date & PDF Button */}
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded print:bg-black">PROJECT ESTIMATE</span>
                            <span className="text-slate-400 text-xs font-medium print:text-black">{new Date().toLocaleDateString()} 기준</span>
                        </div>
                        <button onClick={handleExportPDF} className="border border-white/20 hover:bg-white/10 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors no-print">
                            <Download size={14} /> PDF 저장 / 인쇄
                        </button>
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl font-bold mb-6 print:text-black">{projectInfo.name}</h2>

                    {/* Info Grid */}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300 mb-8 font-medium print:text-black">
                        <span className="flex items-center gap-1.5"><Building2 size={16} /> {zones[zone].name}</span>
                        <span className="flex items-center gap-1.5"><Settings size={16} /> {constructionTypes[constructionType].name}</span>
                        <span className="flex items-center gap-1.5"><HardHat size={16} /> {grades[grade].name}</span>
                        <span className="flex items-center gap-1.5"><Calculator size={16} /> {area}m² ({Math.round(area * 0.3025)}평)</span>
                    </div>

                    {/* Price Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-t border-white/10 pt-6 no-print">
                        <div className="text-center md:text-left mx-auto md:mx-0">
                            <p className="text-slate-400 text-sm mb-1">총 예상 공사비 (VAT 별도)</p>
                            <div className="text-5xl font-black tracking-tighter">₩ {totals.total.toLocaleString()}</div>
                            <div className="flex gap-3 text-xs text-slate-400 mt-2 justify-center md:justify-start">
                                <span>순공사비: {totals.subtotal.toLocaleString()}</span>
                                <span className="text-blue-400 font-bold">일반관리비(10%): {totals.overhead.toLocaleString()}</span>
                            </div>
                        </div>
                        <button onClick={() => setIsAiOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all mx-auto md:mx-0">
                            <Zap size={18} /> AI 견적 정밀 분석
                        </button>
                    </div>

                    {/* Price Print Version */}
                    <div className="hidden print:block border-t border-black pt-6">
                        <div className="text-right">
                            <div className="text-4xl font-black text-black">₩ {totals.total.toLocaleString()}</div>
                            <div className="text-sm text-black">순공사비: {totals.subtotal.toLocaleString()} / 일반관리비: {totals.overhead.toLocaleString()}</div>
                        </div>
                    </div>
                </motion.div>

                {/* 2. Basic Settings */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 print:border print:border-slate-300">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-6"><FileText className="text-blue-600 print:text-black" size={20} /> 공사 개요 및 기본 설정</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500">공사명</label>
                            <input type="text" value={projectInfo.name} onChange={e => setProjectInfo({ ...projectInfo, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500">작성자</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <input type="text" value={projectInfo.author} onChange={e => setProjectInfo({ ...projectInfo, author: e.target.value })} className="w-full pl-10 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500">공사 기간</label>
                            <div className="flex gap-2">
                                <input type="date" value={projectInfo.startDate} onChange={e => setProjectInfo({ ...projectInfo, startDate: e.target.value })} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none" />
                                <span className="text-slate-400 self-center">~</span>
                                <input type="date" value={projectInfo.endDate} onChange={e => setProjectInfo({ ...projectInfo, endDate: e.target.value })} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500">특이사항 (전체)</label>
                            <input type="text" value={projectInfo.remarks} onChange={e => setProjectInfo({ ...projectInfo, remarks: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 outline-none" placeholder="예: 야간 공사 필수" />
                        </div>
                    </div>
                </div>

                {/* 3. Criteria Settings */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 print:break-inside-avoid print:border print:border-slate-300">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-6"><Settings className="text-blue-600 print:text-black" size={20} /> 견적 산출 기준 설정</h3>

                    {/* Construction Type Cards */}
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
                        <label className="text-xs font-bold text-blue-800 uppercase mb-3 block flex items-center gap-1.5"><Briefcase size={14} /> 공사 유형 (Construction Type)</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {Object.entries(constructionTypes).map(([key, val]) => (
                                <button key={key} onClick={() => setConstructionType(key as ConstructionType)}
                                    className={`text-left p-4 rounded-lg border transition-all ${constructionType === key ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                                    <div className="font-bold text-sm mb-1">{val.name}</div>
                                    <div className={`text-[10px] ${constructionType === key ? 'text-blue-100' : 'text-slate-400'}`}>{val.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Selectors */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">리뉴얼 구역</label>
                            <select value={zone} onChange={e => setZone(e.target.value as ZoneType)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-500">
                                {Object.entries(zones).map(([key, val]) => <option key={key} value={key}>{val.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">마감 등급</label>
                            <select value={grade} onChange={e => setGrade(e.target.value as GradeType)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-500">
                                {Object.entries(grades).map(([key, val]) => <option key={key} value={key}>{val.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 mb-2 block">전용 면적 (m²)</label>
                            <div className="flex items-center gap-4">
                                <input type="number" value={area} onChange={e => setArea(Number(e.target.value))} className="w-24 border border-slate-200 rounded-lg px-3 py-2 font-bold text-center" />
                                <input type="range" min="10" max="1000" value={area} onChange={e => setArea(Number(e.target.value))} className="flex-1 accent-blue-600 no-print" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Detailed List & Photos */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 print:break-inside-avoid print:border print:border-slate-300">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2"><Calculator className="text-blue-600 print:text-black" size={20} /> 공종별 상세 내역</h3>
                        <button onClick={() => setIsAiOpen(true)} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 no-print">
                            <CheckSquare size={14} /> AI 안전 점검 리스트 생성
                        </button>
                    </div>

                    <div className="overflow-x-auto mb-8">
                        <table className="w-full min-w-[600px] text-sm text-left">
                            <thead>
                                <tr className="border-b-2 border-slate-100">
                                    <th className="py-3 pl-2 w-10 no-print"></th>
                                    <th className="py-3 text-slate-500 font-bold">공종명</th>
                                    <th className="py-3 text-right text-slate-500 font-bold">면적(m²)</th>
                                    <th className="py-3 text-right text-slate-500 font-bold">단가(원)</th>
                                    <th className="py-3 text-right text-slate-500 font-bold">금액(원)</th>
                                    <th className="py-3 pl-4 text-slate-500 font-bold">특이사항</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {detailedScopes.map((scope) => {
                                    if (constructionType === 'restoration' && ['furniture', 'signage'].includes(scope.id)) return null;
                                    if (constructionType !== 'permit' && scope.id === 'licensing') return null;

                                    return (
                                        <tr key={scope.id} className={scope.active ? 'bg-white' : 'bg-slate-50 opacity-40 print:hidden'}>
                                            <td className="py-3 pl-2 no-print">
                                                <button onClick={() => toggleScopeActive(scope.id)} className="text-blue-600">
                                                    {scope.active ? <CheckSquare size={18} /> : <Square size={18} />}
                                                </button>
                                            </td>
                                            <td className="py-3 font-bold text-slate-700">
                                                {scope.label}
                                                {scope.id === 'licensing' && <span className="ml-1 bg-red-100 text-red-600 text-[10px] px-1 rounded font-bold">필수</span>}
                                            </td>
                                            <td className="py-3 text-right text-slate-600">{scope.area}</td>
                                            <td className="py-3 text-right text-slate-600">{scope.unitPrice.toLocaleString()}</td>
                                            <td className="py-3 text-right font-bold text-slate-900">{(scope.area * scope.unitPrice).toLocaleString()}</td>
                                            <td className="py-3 pl-4"><input type="text" value={scope.remarks} onChange={e => handleScopeChange(scope.id, 'remarks', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-blue-300 outline-none" placeholder="-" /></td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Site Photos */}
                    <div className="pt-6 border-t border-slate-100 page-break">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold flex items-center gap-2"><Camera className="text-blue-600 print:text-black" size={18} /> 현장 사진 대장</h4>
                            <button onClick={() => fileInputRef.current?.click()} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 no-print"><Plus size={14} /> 사진 추가</button>
                            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                        </div>

                        {photos.length === 0 ? (
                            <div className="border border-dashed border-slate-200 rounded-xl py-8 text-center bg-slate-50">
                                <span className="text-slate-400 text-sm">등록된 현장 사진이 없습니다.</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {photos.map(p => (
                                    <div key={p.id} className="border border-slate-100 rounded-lg overflow-hidden relative">
                                        <img src={p.src} className="w-full h-32 object-cover" alt="site" />
                                        <div className="p-2 bg-white text-xs font-medium">{p.desc}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. Tips Section */}
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex gap-3 print:break-inside-avoid print:hidden">
                    <Lightbulb className="text-amber-500 flex-shrink-0" size={24} />
                    <div>
                        <h4 className="font-bold text-amber-900 mb-2">예산 관리 TIP</h4>
                        <ul className="text-sm text-amber-800 space-y-1 list-disc pl-4">
                            <li>일반관리비 10%는 필수 비용이므로, 절감을 위해선 순공사비의 '자재 등급'을 조정하는 것이 효과적입니다.</li>
                            <li>현재 평당 단가는 약 <strong>{Math.round(totals.total / (area * 0.3025)).toLocaleString()}원</strong>입니다.</li>
                        </ul>
                    </div>
                </div>

                {/* 6. Footer Banner */}
                <div className="bg-blue-600 rounded-2xl p-8 text-white text-center shadow-lg shadow-blue-600/20 print:hidden">
                    <h3 className="text-xl font-bold mb-2">전문가 검토가 필요하신가요?</h3>
                    <p className="text-blue-100 text-sm mb-6">입력하신 데이터를 바탕으로 AI 튜터가 리스크를 분석해 드립니다.</p>
                    <button onClick={() => setIsAiOpen(true)} className="bg-white text-blue-600 font-bold px-8 py-3 rounded-xl flex items-center gap-2 mx-auto hover:bg-blue-50 transition-colors">
                        <Zap size={18} /> AI 튜터 열기
                    </button>
                </div>

            </main>

            {/* AI Chat Drawer */}
            <AnimatePresence>
                {isAiOpen && (
                    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-full w-full md:w-[400px] bg-white shadow-2xl z-50 flex flex-col no-print">
                        <div className="p-4 border-b flex justify-between items-center bg-blue-600 text-white">
                            <div className="font-bold flex items-center gap-2"><Zap size={18} /> AI 튜터</div>
                            <button onClick={() => setIsAiOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {chatHistory.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-700'}`}>{m.text}</div>
                                </div>
                            ))}
                            {isGenerating && <div className="text-xs text-slate-400 p-2">입력 중...</div>}
                            <div ref={chatEndRef}></div>
                        </div>
                        <div className="p-4 border-t">
                            <div className="flex gap-2">
                                <input className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none" value={userInput} onChange={e => setUserInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder="질문하기..." />
                                <button onClick={handleSendMessage} className="bg-blue-600 text-white p-2 rounded-lg"><Send size={18} /></button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
