"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    LayoutDashboard,
    Plus,
    FileText,
    Calendar,
    User,
    Trash2,
    ChevronRight,
    Search,
    Building2,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SavedEstimate {
    id: string; // UUID or timestamp
    lastModified: number;
    projectInfo: {
        name: string;
        author: string;
        startDate: string;
        endDate: string;
    };
    totals: {
        total: number;
    };
}

export default function DashboardPage() {
    const [estimates, setEstimates] = useState<SavedEstimate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadEstimates = () => {
            try {
                const saved = localStorage.getItem('ipark_estimates');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    // Sort by last modified desc
                    setEstimates(parsed.sort((a: SavedEstimate, b: SavedEstimate) => b.lastModified - a.lastModified));
                }
            } catch (e) {
                console.error("Failed to load estimates", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadEstimates();
    }, []);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent navigation
        if (confirm('정말로 이 견적서를 삭제하시겠습니까?')) {
            const newEstimates = estimates.filter(est => est.id !== id);
            setEstimates(newEstimates);
            localStorage.setItem('ipark_estimates', JSON.stringify(newEstimates));
        }
    };

    const filteredEstimates = estimates.filter(est =>
        est.projectInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        est.projectInfo.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-8 py-5 shadow-sm">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="bg-blue-600 p-2.5 rounded-xl hover:bg-blue-700 transition-colors">
                            <Building2 className="text-white" size={24} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Estimates <span className="text-blue-600">Dashboard</span></h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">아이파크몰 견적 관리 시스템</p>
                        </div>
                    </div>
                    <Link href="/" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 transition-all">
                        <Plus size={20} /> 새 견적 작성
                    </Link>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-8">

                {/* Search & Statistics */}
                <div className="flex flex-col md:flex-row gap-8 mb-10 items-end">
                    <div className="flex-1 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6">
                        <div className="bg-blue-50 p-4 rounded-full text-blue-600">
                            <FileText size={32} />
                        </div>
                        <div>
                            <div className="text-4xl font-black text-slate-800">{estimates.length}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">누적 견적서</div>
                        </div>
                    </div>
                    <div className="flex-[2] relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="공사명 또는 작성자 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border-none rounded-2xl pl-16 pr-6 py-6 text-lg font-bold shadow-sm focus:ring-2 focus:ring-blue-100 outline-none placeholder:text-slate-300 transition-all"
                        />
                    </div>
                </div>

                {/* List Grid */}
                {isLoading ? (
                    <div className="text-center py-20 text-slate-400 font-bold animate-pulse">데이터 로딩 중...</div>
                ) : filteredEstimates.length === 0 ? (
                    <div className="text-center py-32 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <LayoutDashboard size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">저장된 견적서가 없습니다.</h3>
                        <p className="text-slate-400 font-medium mb-8">새로운 프로젝트 견적을 작성하고 저장해보세요.</p>
                        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline">
                            새 견적 작성하기 <ArrowRight size={16} />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {filteredEstimates.map((est) => (
                                <motion.div
                                    key={est.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="group bg-white rounded-[2rem] p-6 hover:shadow-xl hover:-translate-y-1 transition-all border border-slate-100 relative overflow-hidden"
                                >
                                    <Link href={`/?id=${est.id}`} className="absolute inset-0 z-10 block"></Link>

                                    <div className="flex justify-between items-start mb-6 relative z-20 pointer-events-none">
                                        <div className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">PROJECT</div>
                                        <button onClick={(e) => handleDelete(est.id, e)} className="text-slate-300 hover:text-red-500 transition-colors pointer-events-auto p-2 -mr-2 -mt-2">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <h3 className="text-xl font-black text-slate-800 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                        {est.projectInfo.name || '공사명 없음'}
                                    </h3>

                                    <div className="space-y-3 mb-8">
                                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                            <User size={14} className="text-slate-400" /> {est.projectInfo.author || '-'}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                            <Calendar size={14} className="text-slate-400" /> {new Date(est.lastModified).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-50 flex justify-between items-end">
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Estimate</div>
                                            <div className="text-2xl font-black text-slate-800">
                                                ₩ {(est.totals?.total || 0).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-2.5 rounded-full text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}
