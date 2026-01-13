"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
    Calculator,
    Settings,
    Download,
    RefreshCcw,
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
    ArrowLeft
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
    // --- Constant Data (Ipark Mall Specific) ---
    const zones: Record<ZoneType, { name: string; baseRate: number; desc: string }> = {
        fashion: { name: '패션파크', baseRate: 1800000, desc: '의류 매장 중심, 조명 및 디스플레이 강조' },
        living: { name: '리빙파크', baseRate: 1600000, desc: '가구 및 생활용품, 조닝별 연출 중요' },
        fnb: { name: 'F&B/푸드코트', baseRate: 2500000, desc: '주방 설비, 덕트, 방수 공사 필수' },
        center: { name: '더 센터/로비', baseRate: 2200000, desc: '공용부 연출, 고성능 자재 적용' }
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
    const [view, setView] = useState<ViewMode>('calculator');
    const [savedEstimates, setSavedEstimates] = useState<SavedEstimate[]>([]);

    // 1. Project Basic Info
    const [projectInfo, setProjectInfo] = useState({
        name: '아이파크몰 리뉴얼 공사',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        author: '시설팀 홍길동',
        remarks: ''
    });

    // 2. Estimation Params
    const [area, setArea] = useState(100); // sqm
    const [zone, setZone] = useState<ZoneType>('fashion');
    const [grade, setGrade] = useState<GradeType>('standard');
    const [constructionType, setConstructionType] = useState<ConstructionType>('general');

    // 3. Detailed Scope State
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

    // 4. Site Photos
    const [photos, setPhotos] = useState<Photo[]>([]);

    // 5. AI & UI State
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
        { role: 'ai', text: '안녕하세요! 아이파크몰 리뉴얼 AI 튜터입니다. 공사 유형별 단가 조정이나 항목에 대해 궁금한 점을 물어보세요.' }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Refs
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const printRef = useRef<HTMLDivElement>(null);

    // --- Effects ---
    useEffect(() => {
        const saved = localStorage.getItem('ipark_estimates');
        if (saved) {
            try {
                setSavedEstimates(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load estimates", e);
            }
        }
    }, []);

    // Update Scope Areas when Main Area changes
    useEffect(() => {
        setDetailedScopes(prev => prev.map(scope => ({
            ...scope,
            area: area
        })));
    }, [area]);

    // Update Unit Prices
    useEffect(() => {
        const baseRate = zones[zone].baseRate * grades[grade].multiplier;
        const baseDemolition = 80000;

        setDetailedScopes(prev => prev.map(scope => {
            let newScope = { ...scope };
            let multiplier = 1.0;
            let calculatedPrice = 0;

            if (constructionType === 'general') {
                multiplier = 0.8;
                if (scope.id === 'demolition') {
                    calculatedPrice = baseDemolition * multiplier;
                } else {
                    calculatedPrice = Math.round(baseRate * (scope.ratio || 0) * multiplier);
                }
                if (scope.id === 'licensing') newScope.active = false;

            } else if (constructionType === 'restoration') {
                if (scope.id === 'demolition') {
                    calculatedPrice = baseDemolition * 1.5;
                } else if (['floor', 'wall', 'ceiling'].includes(scope.id)) {
                    calculatedPrice = Math.round(baseRate * (scope.ratio || 0) * 0.1);
                } else {
                    calculatedPrice = Math.round(baseRate * (scope.ratio || 0) * 0.2);
                }
                if (['furniture', 'signage', 'licensing'].includes(scope.id)) {
                    newScope.active = false;
                }

            } else if (constructionType === 'permit') {
                multiplier = 1.0;
                if (scope.id === 'demolition') {
                    calculatedPrice = baseDemolition;
                } else {
                    calculatedPrice = Math.round(baseRate * (scope.ratio || 0));
                }
                if (scope.id === 'licensing') newScope.active = true;
            }

            newScope.unitPrice = calculatedPrice;
            return newScope;
        }));
    }, [zone, grade, constructionType, area, zones, grades]);

    // Add scroll to bottom effect
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // --- Handlers ---
    const handleScopeChange = (id: string, field: keyof ScopeItem, value: any) => {
        setDetailedScopes(prev => prev.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ));
    };

    const toggleScopeActive = (id: string) => {
        setDetailedScopes(prev => prev.map(s =>
            s.id === id ? { ...s, active: !s.active } : s
        ));
    };

    const handleInfoChange = (field: string, value: string) => {
        setProjectInfo(prev => ({ ...prev, [field]: value }));
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setPhotos([...photos, {
                        id: Date.now(),
                        src: reader.result,
                        desc: '현장 특이사항 기재 필요',
                        date: new Date().toLocaleDateString()
                    }]);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = (id: number) => {
        setPhotos(photos.filter(p => p.id !== id));
    };

    const updatePhotoDesc = (id: number, text: string) => {
        setPhotos(photos.map(p => p.id === id ? { ...p, desc: text } : p));
    };

    // --- Calculation Summary ---
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

    // --- Feature Handlers ---
    const handleExportPDF = async () => {
        if (!printRef.current) return;

        try {
            const canvas = await html2canvas(printRef.current, {
                scale: 2,
                logging: false,
                useCORS: true
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${projectInfo.name}_견적서.pdf`);
        } catch (error) {
            console.error("PDF Fail", error);
            alert("PDF 생성 중 오류가 발생했습니다.");
        }
    };

    const handleSaveEstimate = () => {
        const newEstimate: SavedEstimate = {
            id: Date.now().toString(),
            createdAt: new Date().toLocaleString(),
            projectInfo: { ...projectInfo },
            params: { zone, grade, constructionType, area },
            totals: { total: totals.total },
            data: {
                detailedScopes,
                photos
            }
        };

        const updated = [newEstimate, ...savedEstimates];
        setSavedEstimates(updated);
        localStorage.setItem('ipark_estimates', JSON.stringify(updated));
        alert("견적이 저장되었습니다.");
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

    const handleDeleteEstimate = (id: string) => {
        if (confirm("정말 삭제하시겠습니까?")) {
            const updated = savedEstimates.filter(e => e.id !== id);
            setSavedEstimates(updated);
            localStorage.setItem('ipark_estimates', JSON.stringify(updated));
        }
    };

    const handleSendMessage = async () => {
        if (!userInput.trim()) return;
        const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: userInput }];
        setChatHistory(newHistory);
        setUserInput('');
        setIsGenerating(true);

        const visibleScopes = detailedScopes.filter(s => {
            if (constructionType === 'restoration' && ['furniture', 'signage'].includes(s.id)) return false;
            if (constructionType !== 'permit' && s.id === 'licensing') return false;
            return s.active;
        });

        const scopeContext = visibleScopes
            .map(s => `- ${s.label}: ${s.area}㎡, 단가 ${s.unitPrice.toLocaleString()}원 (비고: ${s.remarks || '없음'})`)
            .join('\n');

        const systemPrompt = `당신은 아이파크몰 리뉴얼 공사 전문가 AI 튜터입니다.
현재 프로젝트: ${projectInfo.name}
설정: 공사유형(${constructionTypes[constructionType].name}), 구역(${zones[zone].name}), 등급(${grades[grade].name}), 면적(${area}㎡)
총 견적: ${totals.total.toLocaleString()}원 (일반관리비 10% 포함).
상세 공종:
${scopeContext}
사용자의 질문에 대해 건설 지식을 바탕으로 설명하세요. 한국어로 답변하세요.`;

        try {
            // Placeholder API call
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: userInput }] }],
                    systemInstruction: { parts: [{ text: systemPrompt }] }
                })
            });

            const data = await response.json();
            const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "죄송합니다. 답변을 생성하지 못했습니다.";
            setChatHistory([...newHistory, { role: 'ai', text: aiResponse }]);
        } catch (error) {
            setChatHistory([...newHistory, { role: 'ai', text: "연결 오류가 발생했습니다." }]);
        } finally {
            setIsGenerating(false);
        }
    };

    // --- Sub-Components ---
    const DashboardView = () => (
        <div className="max-w-5xl mx-auto p-8 space-y-8 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <LayoutDashboard className="text-blue-600" />
                        견적 대시보드
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">저장된 견적 내역을 관리하고 불러옵니다.</p>
                </div>
                <button
                    onClick={() => {
                        // Reset basic state for new project
                        setProjectInfo({
                            name: '새 리뉴얼 공사',
                            startDate: new Date().toISOString().split('T')[0],
                            endDate: new Date().toISOString().split('T')[0],
                            author: '',
                            remarks: ''
                        });
                        setArea(100);
                        setPhotos([]);
                        setView('calculator');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold transition-colors shadow-lg shadow-blue-600/20"
                >
                    <Plus size={18} /> 새 견적 작성
                </button>
            </div>

            {savedEstimates.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
                    <Briefcase className="mx-auto text-slate-300 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-600">저장된 견적이 없습니다.</h3>
                    <p className="text-slate-400">새로운 견적을 작성하고 저장해보세요.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedEstimates.map(est => (
                        <div key={est.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded bg-blue-50 text-blue-600`}>
                                    {est.params.constructionType === 'general' ? '일반공사' : est.params.constructionType === 'restoration' ? '원상복구' : '인허가'}
                                </span>
                                <span className="text-xs text-slate-400">{est.createdAt}</span>
                            </div>
                            <h3 className="font-bold text-lg mb-1 truncate">{est.projectInfo.name}</h3>
                            <p className="text-sm text-slate-500 mb-4">{est.projectInfo.author || '작성자 미지정'}</p>

                            <div className="space-y-2 text-sm text-slate-600 mb-6 bg-slate-50 p-3 rounded-lg">
                                <div className="flex justify-between">
                                    <span>면적</span>
                                    <span className="font-bold text-slate-800">{est.params.area}㎡</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>총 금액</span>
                                    <span className="font-bold text-blue-600">{est.totals.total.toLocaleString()}원</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleLoadEstimate(est)}
                                    className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
                                >
                                    불러오기
                                </button>
                                <button
                                    onClick={() => handleDeleteEstimate(est.id)}
                                    className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20 print:bg-white print:p-0">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-sm no-print transition-all">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-600/20">
                        <Building2 className="text-white" size={24} />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h1 className="text-xl font-bold tracking-tight text-slate-800">IPARK MALL <span className="text-blue-600">Smart Estimator</span></h1>
                        <span className="text-xs font-bold text-slate-400 hidden md:inline-block">V2.0</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                    {view === 'calculator' ? (
                        <button
                            onClick={() => setView('dashboard')}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                        >
                            <LayoutDashboard size={18} />
                            <span className="hidden md:inline">대시보드</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setView('calculator')}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <Calculator size={18} />
                            <span className="hidden md:inline">견적기</span>
                        </button>
                    )}

                    <div className="w-px h-4 bg-slate-300 mx-1"></div>

                    <button onClick={() => setIsAiOpen(!isAiOpen)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all font-semibold ${isAiOpen ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        <Zap size={18} fill={isAiOpen ? 'currentColor' : 'none'} />
                        AI 튜터 {isAiOpen ? 'ON' : 'OFF'}
                    </button>
                </div>
            </header>

            {view === 'dashboard' ? (
                <DashboardView />
            ) : (
                <main className="max-w-[1600px] mx-auto p-6 lg:p-8 space-y-8" ref={printRef}>

                    {/* 1. TOP SECTION: Total Estimate Dashboard */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden print:rounded-none print:shadow-none print:text-black print:bg-white print:border-b-2 print:border-black group h-[300px] flex flex-col justify-end">

                        {/* Dynamic Gradient Background (Preserved for aesthetic) */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] z-0"></div>
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 blur-[120px] -mr-32 -mt-32 rounded-full z-0 animate-pulse"></div>

                        <div className="relative z-10 w-full">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded print:bg-black print:text-white">PROJECT ESTIMATE</span>
                                        <span className="text-slate-400 print:text-black text-xs font-medium">{new Date().toLocaleDateString()} 기준</span>
                                    </div>
                                    <h2 className="text-4xl font-bold tracking-tight print:text-black">{projectInfo.name || '공사명 미입력'}</h2>
                                    <div className="flex flex-wrap gap-4 lg:gap-6 text-sm text-slate-400 print:text-black mt-2 font-medium">
                                        <span className="flex items-center gap-1.5"><Building2 size={16} /> {zones[zone].name}</span>
                                        <span className="flex items-center gap-1.5"><Settings size={16} /> {constructionTypes[constructionType].name}</span>
                                        <span className="flex items-center gap-1.5"><HardHat size={16} /> {grades[grade].name}</span>
                                        <span className="flex items-center gap-1.5"><Calculator size={16} /> {area}m² ({Math.round(area * 0.3025)}평)</span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-slate-400 text-sm mb-1 print:text-black">총 예상 공사비 (VAT 별도)</p>
                                    <div className="text-6xl font-black tracking-tight mb-2 print:text-black tabular-nums">
                                        ₩ {totals.total.toLocaleString()}
                                    </div>
                                    <div className="flex justify-end gap-4 text-sm text-slate-400 print:text-black">
                                        <span>순공사비: {totals.subtotal.toLocaleString()}</span>
                                        <span className="text-blue-400 font-bold print:text-black">일반관리비(10%): {totals.overhead.toLocaleString()}</span>
                                    </div>

                                    <div className="mt-6 flex justify-end gap-3 no-print">
                                        <button onClick={handleSaveEstimate} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-slate-600 text-sm font-bold">
                                            <Save size={16} /> 저장
                                        </button>
                                        <button onClick={() => setIsAiOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/40 text-sm font-bold">
                                            <Zap size={16} /> AI 견적 정밀 분석
                                        </button>
                                        <button onClick={handleExportPDF} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-slate-700 text-sm font-medium">
                                            <Download size={16} /> PDF 저장 / 인쇄
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* 2. Grid Layout for Settings & Details */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                        {/* LEFT COLUMN: Inputs & Settings */}
                        <div className="xl:col-span-8 space-y-6 print-full-width">
                            {/* Project Basic Info */}
                            <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100 print:border print:border-slate-300">
                                <div className="flex items-center gap-2 mb-6">
                                    <FileText className="text-blue-600 print:text-black" size={20} />
                                    <h3 className="text-lg font-bold">공사 개요 및 기본 설정</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">공사명</label>
                                        <input type="text" value={projectInfo.name} onChange={(e) => handleInfoChange('name', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">작성자</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-3.5 text-slate-400" size={16} />
                                            <input type="text" value={projectInfo.author} onChange={(e) => handleInfoChange('author', e.target.value)}
                                                className="w-full pl-11 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">공사 기간</label>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <Calendar className="absolute left-4 top-3.5 text-slate-400" size={16} />
                                                <input type="date" value={projectInfo.startDate} onChange={(e) => handleInfoChange('startDate', e.target.value)}
                                                    className="w-full pl-11 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                                                />
                                            </div>
                                            <span className="text-slate-400">~</span>
                                            <div className="relative flex-1">
                                                <Calendar className="absolute left-4 top-3.5 text-slate-400" size={16} />
                                                <input type="date" value={projectInfo.endDate} onChange={(e) => handleInfoChange('endDate', e.target.value)}
                                                    className="w-full pl-11 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">특이사항 (전체)</label>
                                        <input type="text" value={projectInfo.remarks} onChange={(e) => handleInfoChange('remarks', e.target.value)}
                                            placeholder="예: 야간 공사 필수, 백화점 휴점일 공사"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Estimation Parameters */}
                            <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100 print:break-inside-avoid print:border print:border-slate-300">
                                <div className="flex items-center gap-2 mb-6">
                                    <Settings className="text-blue-600 print:text-black" size={20} />
                                    <h3 className="text-lg font-bold">견적 산출 기준 설정</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="col-span-1 md:col-span-2 bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                                        <label className="text-sm font-bold text-blue-800 uppercase mb-3 block flex items-center gap-2">
                                            <Briefcase size={16} /> 공사 유형 (CONSTRUCTION TYPE)
                                        </label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {Object.entries(constructionTypes).map(([key, val]) => (
                                                <button key={key} onClick={() => setConstructionType(key as ConstructionType)}
                                                    className={`text-left px-5 py-4 rounded-xl border transition-all duration-200 ${constructionType === key
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:shadow-md'
                                                        }`}
                                                >
                                                    <div className="font-bold text-sm mb-1">{val.name}</div>
                                                    <div className={`text-[11px] ${constructionType === key ? 'text-blue-100' : 'text-slate-400'}`}>
                                                        {val.desc}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">리뉴얼 구역</label>
                                        <div className="relative">
                                            <select value={zone} onChange={(e) => setZone(e.target.value as ZoneType)}
                                                className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                {Object.entries(zones).map(([key, val]) => (
                                                    <option key={key} value={key}>{val.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-4 pointer-events-none text-slate-400">▼</div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">마감 등급</label>
                                        <div className="relative">
                                            <select value={grade} onChange={(e) => setGrade(e.target.value as GradeType)}
                                                className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                {Object.entries(grades).map(([key, val]) => (
                                                    <option key={key} value={key}>{val.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-4 pointer-events-none text-slate-400">▼</div>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">전용 면적 (m²)</label>
                                        <div className="flex items-center gap-6">
                                            <input type="number" value={area} onChange={(e) => setArea(Number(e.target.value))}
                                                className="w-36 border border-slate-200 rounded-xl px-4 py-3 font-bold text-lg text-center"
                                            />
                                            <input type="range" min="10" max="3000" value={area} onChange={(e) => setArea(Number(e.target.value))}
                                                className="flex-1 h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 no-print"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Scope Table */}
                            <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100 print:border print:border-slate-300">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <Calculator className="text-blue-600 print:text-black" size={20} />
                                        <h3 className="text-lg font-bold">공종별 상세 내역</h3>
                                    </div>
                                    <button onClick={() => setIsAiOpen(true)} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors no-print">
                                        <CheckSquare size={14} /> AI 안전 점검 리스트 생성
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[700px] text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-left text-slate-500">
                                                <th className="pb-3 pl-2 w-10 no-print"></th>
                                                <th className="pb-3 font-semibold">공종명</th>
                                                <th className="pb-3 font-semibold text-right">면적(m²)</th>
                                                <th className="pb-3 font-semibold text-right">단가(원)</th>
                                                <th className="pb-3 font-semibold text-right">금액(원)</th>
                                                <th className="pb-3 font-semibold pl-6">특이사항</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {detailedScopes
                                                .filter(scope => {
                                                    if (constructionType === 'restoration' && ['furniture', 'signage'].includes(scope.id)) return false;
                                                    if (constructionType !== 'permit' && scope.id === 'licensing') return false;
                                                    return true;
                                                })
                                                .map((scope) => (
                                                    <tr key={scope.id} className={`group transition-colors ${scope.active ? 'bg-white' : 'bg-slate-50 opacity-40 print:hidden'}`}>
                                                        <td className="py-4 pl-2 no-print">
                                                            <button onClick={() => toggleScopeActive(scope.id)} className="text-blue-600 hover:text-blue-700 transition-colors">
                                                                {scope.active ? <CheckSquare size={20} /> : <Square size={20} />}
                                                            </button>
                                                        </td>
                                                        <td className="py-4 font-bold text-slate-700">
                                                            {scope.label}
                                                            {scope.id === 'licensing' && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">필수</span>}
                                                        </td>
                                                        <td className="py-4 text-right">
                                                            <div className="inline-block px-2 text-slate-600">{scope.area}</div>
                                                        </td>
                                                        <td className="py-4 text-right">
                                                            <div className={`font-medium ${scope.id === 'demolition' && constructionType === 'restoration' ? 'text-red-500 font-bold' : 'text-slate-600'}`}>
                                                                {scope.unitPrice.toLocaleString()}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 text-right font-bold text-slate-900">
                                                            {(scope.area * scope.unitPrice).toLocaleString()}
                                                        </td>
                                                        <td className="py-4 pl-6">
                                                            <input type="text" value={scope.remarks} onChange={(e) => handleScopeChange(scope.id, 'remarks', e.target.value)}
                                                                placeholder="-"
                                                                className="w-full bg-transparent border-b border-transparent focus:border-blue-300 outline-none text-slate-600" />
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50 border-t-2 border-slate-100 font-bold text-slate-800">
                                            <tr>
                                                <td colSpan={1} className="no-print"></td>
                                                <td colSpan={3} className="py-4 text-right pr-4 text-sm">소계 (순공사비)</td>
                                                <td className="py-4 text-right text-lg">{totals.subtotal.toLocaleString()}</td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td colSpan={1} className="no-print"></td>
                                                <td colSpan={3} className="py-4 text-right pr-4 text-sm text-blue-600 print:text-black">일반관리비 (10%)</td>
                                                <td className="py-2 text-right text-blue-600 print:text-black">{totals.overhead.toLocaleString()}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Site Photos Register */}
                            <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100 print:break-inside-avoid print:border print:border-slate-300 page-break">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <Camera className="text-blue-600 print:text-black" size={20} />
                                        <h3 className="text-lg font-bold">현장 사진 대장</h3>
                                    </div>
                                    <button onClick={() => fileInputRef.current?.click()} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors no-print">
                                        <Plus size={16} /> 사진 추가
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                                </div>

                                {photos.length === 0 ? (
                                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-slate-400 text-sm font-medium">등록된 현장 사진이 없습니다.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {photos.map((photo) => (
                                            <div key={photo.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col group print:border-slate-300">
                                                <div className="relative h-48 bg-slate-100">
                                                    <img src={photo.src} alt="Site" className="w-full h-full object-cover" />
                                                    <button onClick={() => removePhoto(photo.id)} className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 no-print">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                <div className="p-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{photo.date}</span>
                                                    </div>
                                                    <input type="text" value={photo.desc} onChange={(e) => updatePhotoDesc(photo.id, e.target.value)}
                                                        className="w-full text-sm font-medium border-b border-transparent focus:border-blue-500 outline-none pb-1"
                                                        placeholder="사진 설명 입력..."
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Summary & AI */}
                        <div className="xl:col-span-4 space-y-6 print:hidden">
                            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 sticky top-24">
                                <div className="flex items-start gap-3">
                                    <Lightbulb className="text-amber-600 mt-1" size={20} />
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm mb-2">예산 관리 TIP</h4>
                                        <ul className="text-xs text-slate-700 leading-relaxed space-y-2 list-disc pl-4">
                                            {constructionType === 'restoration' ? (
                                                <li className="font-bold text-red-600">원상 복구 공사는 철거 비용 비중이 높습니다. 폐기물 처리량이 예산의 핵심 변수입니다.</li>
                                            ) : (
                                                <li>일반관리비 10%는 필수 비용이므로, 절감을 위해선 순공사비의 '자재 등급'을 조정하는 것이 효과적입니다.</li>
                                            )}
                                            <li>현재 평당 단가는 약 <span className="font-bold text-amber-700">{Math.round(totals.total / (area * 0.3025)).toLocaleString()}원</span>입니다.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* AI Call To Action */}
                            <div className="bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-900/20 text-center">
                                <h3 className="font-bold text-xl mb-2">전문가 검토가 필요하신가요?</h3>
                                <p className="text-blue-100 text-sm mb-6 max-w-[200px] mx-auto opacity-90">입력하신 데이터를 바탕으로 AI 튜터가 리스크를 분석해 드립니다.</p>
                                <button onClick={() => setIsAiOpen(true)} className="w-full bg-white text-blue-600 font-bold py-3.5 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
                                    <Zap size={18} /> AI 튜터 열기
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            )}

            {/* AI Tutor Chatbot Drawer */}
            <AnimatePresence>
                {isAiOpen && (
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 right-0 md:right-8 w-full md:w-[450px] z-50 no-print"
                    >
                        <div className="bg-white md:rounded-t-3xl shadow-2xl border border-slate-200 flex flex-col h-[80vh] md:h-[600px]">
                            {/* Chat Header */}
                            <div className="p-5 border-b flex justify-between items-center bg-blue-600 text-white md:rounded-t-3xl">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-xl">
                                        <Zap size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold hidden md:block">아이파크 리뉴얼 AI 튜터</h3>
                                        <span className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Expert Consulting</span>
                                    </div>
                                </div>
                                <button onClick={() => setIsAiOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
                                {chatHistory.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                                            : 'bg-white text-slate-700 rounded-tl-none border border-slate-200 shadow-sm'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isGenerating && (
                                    <div className="flex justify-start">
                                        <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm">
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                                                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 bg-white border-t border-slate-100">
                                <div className="relative">
                                    <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="궁금한 점을 물어보세요..."
                                        className="w-full pl-4 pr-12 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    />
                                    <button onClick={handleSendMessage} disabled={isGenerating}
                                        className="absolute right-2 top-1.5 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all">
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
