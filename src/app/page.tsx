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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import pptxgen from 'pptxgenjs';
import { Image as ImageIcon, Presentation } from 'lucide-react';

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
        standard: { name: '표준형', multiplier: 0.8, desc: '아이파크몰 권장 표준 사양' },
        premium: { name: '프리미엄', multiplier: 1.3, desc: '수입 자재 및 특수 디자인 적용' }
    };

    const constructionTypes: Record<ConstructionType, { name: string; desc: string }> = {
        general: { name: '일반 공사', desc: '전기/설비/소방 90%, 그 외 100%' },
        restoration: { name: '원상 복구 공사', desc: '철거 150%, 마감/MEP 10%' },
        permit: { name: '인허가 공사', desc: '전기/설비/소방 120%, 그 외 100%' }
    };

    // --- State Management ---
    const [projectInfo, setProjectInfo] = useState({
        name: '아이파크몰 리뉴얼 공사',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        author: '시설팀 홍길동',
        remarks: '',
        isPending: false
    });

    const [area, setArea] = useState(100);
    const [zone, setZone] = useState<ZoneType>('fashion');
    const [grade, setGrade] = useState<GradeType>('standard');
    const [constructionType, setConstructionType] = useState<ConstructionType>('general');

    const [detailedScopes, setDetailedScopes] = useState([
        { id: 'licensing', label: '인허가 및 설계', active: true, area: 1, unitPrice: 0, remarks: '', isFixedRate: true, details: ['건축/대수선', '교통', '소방', '설비', '전기', '장애인편의시설'] as any[], isExpanded: false },
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
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<{ id: string, name: string, size: number }[]>([]);

    // Persistence State
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);

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

    const getGradeMultiplier = (g: GradeType, p: number) => {
        if (g === 'standard') {
            if (p < 100) return 0.96;
            if (p < 500) return 0.88;
            if (p < 1000) return 0.80;
            return 0.72;
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

    const currentGradeMultiplier = getGradeMultiplier(grade, area * 0.3025);

    useEffect(() => {
        const pyeong = area * 0.3025;



        // Construction Type Multipliers based on Image
        const CONSTRUCTION_MULTIPLIERS: Record<ConstructionType, Record<string, number>> = {
            general: {
                electrical: 0.9, hvac: 0.9, firefighting: 0.9,
                default: 1.0
            },
            restoration: {
                temporary: 1.5, demolition: 1.5,
                floor: 0.1, wall: 0.1, ceiling: 0.1, electrical: 0.1, hvac: 0.1, firefighting: 0.1,
                facade: 0, furniture: 0, signage: 0,
                default: 1.0
            },
            permit: {
                electrical: 1.2, hvac: 1.2, firefighting: 1.2,
                default: 1.0
            }
        };

        const gradeMultiplier = getGradeMultiplier(grade, pyeong);

        setDetailedScopes(prev => prev.map(scope => {
            let newScope = { ...scope };
            // Set Unit Price from Look-up Table * Tiered Multiplier
            const basePrice = UNIT_PRICES[zone][scope.id] || 0;

            // 2. Construction Type Multiplier
            const typeMultipliers = CONSTRUCTION_MULTIPLIERS[constructionType];

            // Check specific scope multiplier -> check default -> fallback 1.0
            let cMultiplier = 1.0;
            if (scope.id in typeMultipliers) {
                cMultiplier = typeMultipliers[scope.id];
            } else {
                cMultiplier = typeMultipliers.default || 1.0;
            }

            // 3. Apply Multipliers (Base * Construction * Grade/Area)
            newScope.unitPrice = Math.round(basePrice * cMultiplier * gradeMultiplier);
            return newScope;
        }));
    }, [zone, grade, area, constructionType]);

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

        // Breakdown: Insurance (7.5%), Profit (7.0%), Safety (Dynamic)
        // 1. Insurance: 7.5%
        const insurance = Math.round(subtotal * 0.075);

        // 2. Safety Management Cost: General Construction (Gap)
        // < 500 million: 2.93%
        // 500 million ~ 5 billion: 1.86% + 5,349,000
        // >= 5 billion: 1.97%
        let safety = 0;
        if (subtotal < 500000000) {
            safety = Math.round(subtotal * 0.0293);
        } else if (subtotal < 5000000000) {
            safety = Math.round(subtotal * 0.0186) + 5349000;
        } else {
            safety = Math.round(subtotal * 0.0197);
        }

        // 3. Corporate Profit: 7.0%
        const profit = Math.round(subtotal * 0.07);

        const overhead = insurance + safety + profit;
        const total = subtotal + overhead;
        const overheadRate = total > 0 ? (overhead / subtotal) : 0; // For reference if needed

        return { subtotal, overhead, insurance, safety, profit, total };
    };

    const totals = calculateTotal();

    // Helper to capture pages for PDF/PPT/JPG
    const captureEstimatePages = async () => {
        const element = document.getElementById('estimate-content');
        if (!element) return null;

        // Shared print styles
        const applyPdfStyles = (clone: HTMLElement) => {
            clone.style.width = '1200px';
            clone.style.maxWidth = 'none';
            clone.style.margin = '0 auto';
            clone.style.padding = '40px';
            clone.style.backgroundColor = 'white';
            clone.style.color = 'black';
            clone.style.position = 'absolute';
            clone.style.left = '0';
            clone.style.top = '0';
            clone.style.boxSizing = 'border-box';
            clone.style.lineHeight = '1.5';
            clone.style.height = 'auto'; // Force auto height
            clone.setAttribute('style', `${clone.getAttribute('style')}; height: auto !important; overflow: visible !important; max-height: none !important;`);
            clone.style.overflow = 'visible';
            clone.style.fontSize = '14px';

            const allElements = clone.querySelectorAll('*');
            allElements.forEach((el: any) => {
                el.style.overflow = 'visible';
                el.style.whiteSpace = 'normal';
                el.style.height = 'auto';
                el.style.wordBreak = 'keep-all'; // Better for Korean text
                el.style.overflowWrap = 'break-word';
            });

            const tables = clone.querySelectorAll('table');
            tables.forEach((el: any) => {
                el.style.tableLayout = 'fixed';
                el.style.width = '100%';

                // Keep headers readable
                const ths = el.querySelectorAll('th');
                ths.forEach((th: any) => th.style.whiteSpace = 'nowrap');
            });

            const cells = clone.querySelectorAll('td');
            cells.forEach((el: any) => {
                el.style.wordBreak = 'keep-all';
                el.style.overflowWrap = 'anywhere';
                el.style.whiteSpace = 'normal';
                el.style.height = 'auto';
            });

            const inputs = clone.querySelectorAll('input, select');
            inputs.forEach((el: any) => {
                el.style.border = 'none';
                el.style.backgroundColor = 'transparent';
                el.style.appearance = 'none';
                el.style.textAlign = el.type === 'number' || el.classList.contains('text-right') ? 'right' : 'left';
                el.style.padding = '0';
                el.style.color = 'black';
                el.style.fontSize = 'inherit';
                el.style.width = '100%';
            });

            const tableCells = clone.querySelectorAll('th, td');
            tableCells.forEach((el: any) => {
                el.style.padding = '12px 8px';
                el.style.fontSize = '14px';
            });

            const noPrints = clone.querySelectorAll('.no-print');
            noPrints.forEach((el: any) => el.style.display = 'none');

            const banner = clone.querySelector('.bg-amber-50');
            if (banner) {
                const parent = banner.closest('.grid');
                if (parent && parent.classList.contains('md:grid-cols-1')) {
                    (parent as HTMLElement).style.display = 'none';
                }
            }
        };

        const commonOptions = {
            scale: 2, // Use 2x scale for better performance with larger width
            useCORS: true,
            logging: false,
            windowWidth: 1600,
            windowHeight: 4000 // Increase virtual window height to prevent cutoff
        };

        const canvas1 = await html2canvas(element, {
            ...commonOptions,
            onclone: (documentClone) => {
                const body = documentClone.body;
                body.style.height = 'auto';
                body.style.overflow = 'visible';
                body.style.maxHeight = 'none';

                const clone = documentClone.querySelector('#estimate-content') as HTMLElement;
                if (clone) {
                    applyPdfStyles(clone);
                    const detaileList = clone.querySelector('#section-detailed-list') as HTMLElement;
                    if (detaileList) detaileList.style.display = 'none';
                    const photos = clone.querySelector('#section-photos') as HTMLElement;
                    if (photos) photos.style.display = 'none';
                    const attachments = clone.querySelector('#section-attachments') as HTMLElement;
                    if (attachments) attachments.style.display = 'none';
                    const tip = clone.querySelector('#section-budget-tip') as HTMLElement;
                    if (tip) tip.style.display = 'none';
                }
            }
        });

        const canvas2 = await html2canvas(element, {
            ...commonOptions,
            onclone: (documentClone) => {
                const body = documentClone.body;
                body.style.height = 'auto';
                body.style.overflow = 'visible';
                body.style.maxHeight = 'none';

                const clone = documentClone.querySelector('#estimate-content') as HTMLElement;
                if (clone) {
                    applyPdfStyles(clone);
                    const hero = clone.querySelector('#hero-section') as HTMLElement;
                    if (hero) hero.style.display = 'none';
                    const basicInfo = clone.querySelector('#section-basic-info') as HTMLElement;
                    if (basicInfo) basicInfo.style.display = 'none';
                    const criteria = clone.querySelector('#section-criteria') as HTMLElement;
                    if (criteria) criteria.style.display = 'none';
                    const photos = clone.querySelector('#section-photos') as HTMLElement;
                    if (photos) photos.style.display = 'none';
                    const attachments = clone.querySelector('#section-attachments') as HTMLElement;
                    if (attachments) attachments.style.display = 'none';
                    const tip = clone.querySelector('#section-budget-tip') as HTMLElement;
                    if (tip) tip.style.display = 'none';
                }
            }
        });

        const canvas3 = await html2canvas(element, {
            ...commonOptions,
            onclone: (documentClone) => {
                const body = documentClone.body;
                body.style.height = 'auto';
                body.style.overflow = 'visible';
                body.style.maxHeight = 'none';

                const clone = documentClone.querySelector('#estimate-content') as HTMLElement;
                if (clone) {
                    applyPdfStyles(clone);
                    const hero = clone.querySelector('#hero-section') as HTMLElement;
                    if (hero) hero.style.display = 'none';
                    const basicInfo = clone.querySelector('#section-basic-info') as HTMLElement;
                    if (basicInfo) basicInfo.style.display = 'none';
                    const criteria = clone.querySelector('#section-criteria') as HTMLElement;
                    if (criteria) criteria.style.display = 'none';
                    const detailedSection = clone.querySelector('#section-detailed-list');
                    if (detailedSection) (detailedSection as HTMLElement).style.display = 'none';
                    const photos = clone.querySelector('#section-photos') as HTMLElement;
                    if (photos) {
                        photos.style.display = 'block';
                        photos.style.margin = '0';
                        photos.style.borderTop = 'none';
                    }
                    const attachments = clone.querySelector('#section-attachments') as HTMLElement;
                    if (attachments) {
                        attachments.style.display = 'block';
                        attachments.style.marginTop = '20px';
                    }
                    const tip = clone.querySelector('#section-budget-tip') as HTMLElement;
                    if (tip) {
                        tip.style.display = 'flex';
                        const parent = tip.closest('.grid');
                        if (parent && (parent as HTMLElement).classList.contains('print:hidden')) {
                            (parent as HTMLElement).classList.remove('print:hidden');
                            (parent as HTMLElement).style.display = 'grid';
                        }
                    }
                }
            }
        });

        return [canvas1, canvas2, canvas3];
    };

    const handleDownloadPDF = async () => {
        setIsExporting(true);
        try {
            const canvases = await captureEstimatePages();
            if (!canvases) return;

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            canvases.forEach((canvas, index) => {
                if (index > 0) pdf.addPage();
                const imgData = canvas.toDataURL('image/png');
                const imgHeight = (canvas.height * pdfWidth) / canvas.width;

                if (index === 1 && imgHeight > pdfHeight) {
                    let heightLeft = imgHeight;
                    let position = 0;
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                    heightLeft -= pdfHeight;
                    while (heightLeft >= 0) {
                        position = heightLeft - imgHeight;
                        pdf.addPage();
                        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                        heightLeft -= pdfHeight;
                    }
                } else {
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
                }
            });

            pdf.save(`${projectInfo.name}_견적서.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('PDF 생성 중 오류가 발생했습니다.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDownloadJPG = async () => {
        setIsExporting(true);
        try {
            const canvases = await captureEstimatePages();
            if (!canvases) return;

            const totalHeight = canvases.reduce((acc, c) => acc + c.height, 0);
            const maxWidth = Math.max(...canvases.map(c => c.width));

            const combinedCanvas = document.createElement('canvas');
            combinedCanvas.width = maxWidth;
            combinedCanvas.height = totalHeight;
            const ctx = combinedCanvas.getContext('2d');
            if (!ctx) return;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);

            let currentY = 0;
            canvases.forEach(c => {
                ctx.drawImage(c, 0, currentY);
                currentY += c.height;
            });

            const link = document.createElement('a');
            link.download = `${projectInfo.name}_견적서.jpg`;
            link.href = combinedCanvas.toDataURL('image/jpeg', 0.9);
            link.click();

        } catch (error) {
            console.error('JPG Generation Error:', error);
            alert('JPG 생성 중 오류가 발생했습니다.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDownloadPPT = async () => {
        setIsExporting(true);
        try {
            const canvases = await captureEstimatePages();
            if (!canvases) return;

            // Safe instantiation of pptxgenjs
            let pres;
            try {
                // Try direct instantiation first (common in some environments)
                pres = new pptxgen();
            } catch (e) {
                // Fallback for ESM/Next.js default export
                try {
                    // @ts-ignore
                    pres = new pptxgen.default();
                } catch (e2) {
                    throw new Error('PPTX library failed to initialize.');
                }
            }

            if (!pres) throw new Error('PPTX Generator failed to initialize');

            pres.layout = 'LAYOUT_A4';

            canvases.forEach(c => {
                const slide = pres.addSlide();
                const imgData = c.toDataURL('image/png');

                // Use 'contain' to fit image within slide boundaries while maintaining aspect ratio
                slide.addImage({
                    data: imgData,
                    x: 0,
                    y: 0,
                    w: '100%',
                    h: '100%',
                    sizing: { type: 'contain' }
                });
            });

            await pres.writeFile({ fileName: `${projectInfo.name}_견적서.pptx` });

        } catch (error) {
            console.error('PPT Generation Error:', error);
            alert(`PPT 생성 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally {
            setIsExporting(false);
        }
    };

    // --- RENDER ---

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12 md:pb-24 print:bg-white print:p-0">

            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 flex flex-wrap gap-2 justify-between items-center px-4 md:px-6 py-4 no-print shadow-sm font-medium">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="bg-blue-600 p-2 rounded-xl shrink-0"><Building2 className="text-white" size={18} /></div>
                    <span className="text-sm md:text-xl font-black text-slate-800 tracking-tight leading-none">IPARK MALL <span className="text-blue-600 block md:inline">총무팀 Smart Estimator</span></span>
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

            <main id="estimate-content" className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">

                {/* 1. HERO SECTION */}
                <motion.div
                    id="hero-section"
                    initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#111827] text-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden shadow-2xl print:bg-white print:text-black print:border-b-2 print:border-black"
                >
                    {/* Background Decos */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -mr-32 -mt-32 pointer-events-none no-print"></div>

                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <span className="bg-white/10 backdrop-blur-md text-white border border-white/20 text-[11px] font-extrabold px-3 py-1.5 rounded-full tracking-wider shadow-sm">PROJECT ESTIMATE</span>
                            <span className="text-slate-400 text-xs font-semibold">
                                {projectInfo.isPending ? '공사 기간 미정' : new Date().toLocaleDateString() + ' 기준'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleDownloadPDF} disabled={isExporting} className="bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all backdrop-blur-sm no-print text-slate-200 hover:text-white disabled:opacity-50">
                                <Download size={16} /> PDF
                            </button>
                            <button onClick={handleDownloadJPG} disabled={isExporting} className="bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/30 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all backdrop-blur-sm no-print text-blue-100 hover:text-white disabled:opacity-50">
                                <ImageIcon size={16} /> JPG
                            </button>
                            <button onClick={handleDownloadPPT} disabled={isExporting} className="bg-orange-600/30 hover:bg-orange-600/50 border border-orange-400/30 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all backdrop-blur-sm no-print text-orange-100 hover:text-white disabled:opacity-50">
                                <Presentation size={16} /> PPT
                            </button>
                        </div>
                    </div>

                    <h2 className="text-2xl md:text-5xl font-black mb-4 md:mb-6 tracking-tight leading-tight">{projectInfo.name || '공사명 미입력'}</h2>

                    <div className="flex flex-wrap gap-2 md:gap-x-8 md:gap-y-3 text-xs md:text-base text-blue-100/90 mb-6 md:mb-10 font-bold">
                        <span className="flex items-center gap-1 md:gap-2 bg-blue-900/40 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-blue-500/20"><Building2 size={14} className="md:w-[18px]" /> {zones[zone].name}</span>
                        <span className="flex items-center gap-2 bg-blue-900/40 px-3 py-1.5 rounded-lg border border-blue-500/20"><Settings size={18} /> {constructionTypes[constructionType].name}</span>
                        <span className="flex items-center gap-2 bg-blue-900/40 px-3 py-1.5 rounded-lg border border-blue-500/20"><HardHat size={18} /> {grades[grade].name} <span className="text-yellow-400 text-[10px] ml-1">({Math.round(currentGradeMultiplier * 100)}%)</span></span>
                        <span className="flex items-center gap-2 bg-blue-900/40 px-3 py-1.5 rounded-lg border border-blue-500/20"><Calculator size={18} /> {Math.round(area * 0.3025)}평 ({area}m²)</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 border-t border-white/10 pt-6 md:pt-8 relative z-10 no-print">
                        <div>
                            <p className="text-slate-400 text-[10px] md:text-xs font-bold mb-1 md:mb-2 uppercase tracking-wide">총 예상 공사비 (VAT 별도)</p>
                            <div className="text-4xl md:text-6xl font-black tracking-tighter mb-2">₩ {totals.total.toLocaleString()}</div>
                            <div className="flex flex-wrap gap-3 md:gap-4 text-[10px] md:text-xs font-medium text-slate-400">
                                <span>직접공사비: {totals.subtotal.toLocaleString()}</span>
                                <span className="text-blue-400">간접공사비: {totals.overhead.toLocaleString()}</span>
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
                <div id="section-basic-info" className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 print:shadow-none print:border print:border-slate-300">
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
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">공사 기간</label>
                                <label className="flex items-center gap-2 cursor-pointer no-print">
                                    <input
                                        type="checkbox"
                                        checked={projectInfo.isPending}
                                        onChange={e => setProjectInfo({ ...projectInfo, isPending: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-xs font-bold text-slate-500">미정</span>
                                </label>
                            </div>
                            {projectInfo.isPending ? (
                                <div className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-400 text-center">
                                    공사 기간 미정
                                </div>
                            ) : (
                                <div className="flex gap-4">
                                    <input type="date" value={projectInfo.startDate} onChange={e => setProjectInfo({ ...projectInfo, startDate: e.target.value })} className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-100 outline-none" />
                                    <span className="text-slate-300 self-center font-bold">~</span>
                                    <input type="date" value={projectInfo.endDate} onChange={e => setProjectInfo({ ...projectInfo, endDate: e.target.value })} className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-100 outline-none" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">특이사항</label>
                            <input type="text" value={projectInfo.remarks} onChange={e => setProjectInfo({ ...projectInfo, remarks: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-800 font-medium focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300" placeholder="특이사항을 입력하세요" />
                        </div>
                    </div>
                </div>

                {/* 3. Criteria Settings */}
                <div id="section-criteria" className="bg-white rounded-[2rem] p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 print:break-inside-avoid">
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
                                            onFocus={(e) => e.target.select()}
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 font-black text-xl text-center text-slate-800 outline-none shadow-sm focus:border-blue-500 transition-all"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">평</span>
                                    </div>
                                    <span className="text-slate-300">⇄</span>
                                    <div className="relative flex-1">
                                        <input type="number" step="0.01" value={area} onChange={e => setArea(Number(e.target.value))} onFocus={(e) => e.target.select()} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 font-black text-xl text-center text-slate-800 outline-none shadow-sm focus:border-blue-500 transition-all" />
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
                <div id="section-detailed-list" className="bg-white rounded-[2rem] p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 print:break-inside-avoid">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-extrabold flex items-center gap-3 text-slate-800 border-l-4 border-blue-600 pl-3">
                            <Calculator className="text-blue-600" size={24} /> A. 직접 공사비
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
                                                        {(scope.isFixedRate || scope.area === 1) && <span className="absolute right-0 -mr-6 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">식</span>}
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

                    {/* B. Indirect Construction Cost Section */}
                    <div className="mb-12">
                        <h3 className="text-lg font-extrabold flex items-center gap-3 text-slate-800 border-l-4 border-slate-500 pl-3 mb-6">
                            <Briefcase className="text-slate-500" size={24} /> B. 간접 공사비
                        </h3>
                        <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100/50 border-b border-slate-200">
                                    <tr>
                                        <th className="py-3 pl-6 text-left text-slate-500 font-bold">구분</th>
                                        <th className="py-3 text-right text-slate-500 font-bold">비율</th>
                                        <th className="py-3 pr-6 text-right text-slate-500 font-bold">금액(원)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr>
                                        <td className="py-4 pl-6 font-bold text-slate-700">각종 보험료 (고용/산재 등)</td>
                                        <td className="py-4 text-right text-slate-500">7.5%</td>
                                        <td className="py-4 pr-6 text-right font-black text-slate-800">{totals.insurance.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 pl-6 font-bold text-slate-700">안전관리비 <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded ml-1">법정요율</span></td>
                                        <td className="py-4 text-right text-slate-500 text-xs">{(totals.safety / totals.subtotal * 100).toFixed(2)}%</td>
                                        <td className="py-4 pr-6 text-right font-black text-slate-800">{totals.safety.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 pl-6 font-bold text-slate-700">기업이윤 및 공과 잡비</td>
                                        <td className="py-4 text-right text-slate-500">7.0%</td>
                                        <td className="py-4 pr-6 text-right font-black text-slate-800">{totals.profit.toLocaleString()}</td>
                                    </tr>
                                    <tr className="bg-blue-50/50">
                                        <td className="py-4 pl-6 font-extrabold text-blue-900">소계</td>
                                        <td className="py-4 text-right text-blue-800 font-bold">{totals.subtotal > 0 ? (totals.overhead / totals.subtotal * 100).toFixed(1) : 0}%</td>
                                        <td className="py-4 pr-6 text-right font-extrabold text-blue-900">{totals.overhead.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Site Photos */}
                    <div id="section-photos" className="pt-8 border-t border-slate-100">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {photos.map(p => (
                                    <div key={p.id} className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedPhoto(p.src)}>
                                        <img src={p.src} className="w-full h-64 object-cover" alt="site" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 no-print">
                                            <button onClick={(e) => { e.stopPropagation(); removePhoto(p.id); }} className="bg-white/90 p-2 rounded-full text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
                                        </div>
                                        <div className="p-3 bg-white text-sm font-bold text-center border-t text-slate-600">{p.date}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* File Attachments */}
                    <div id="section-attachments" className="pt-8 border-t border-slate-100 mt-8">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold flex items-center gap-2 text-slate-700"><FileText className="text-blue-600" size={18} /> 첨부 파일</h4>
                            <button onClick={() => attachmentInputRef.current?.click()} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors no-print"><Plus size={14} /> 파일 추가</button>
                            <input
                                type="file"
                                ref={attachmentInputRef}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        if (file.size > 10 * 1024 * 1024) {
                                            alert('파일 크기는 10MB 이하여야 합니다.');
                                            return;
                                        }
                                        setAttachments([...attachments, {
                                            id: crypto.randomUUID(),
                                            name: file.name,
                                            size: file.size
                                        }]);
                                        e.target.value = '';
                                    }
                                }}
                                className="hidden"
                            />
                        </div>
                        {attachments.length === 0 ? (
                            <div className="border-2 border-dashed border-slate-200 rounded-3xl py-8 text-center bg-slate-50/50">
                                <span className="text-slate-400 text-sm font-medium">첨부된 파일이 없습니다.</span>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {attachments.map(file => (
                                    <li key={file.id} className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <FileText size={16} className="text-slate-400" />
                                            <span className="text-sm font-bold text-slate-700">{file.name}</span>
                                            <span className="text-xs text-slate-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                        </div>
                                        <button onClick={() => setAttachments(attachments.filter(a => a.id !== file.id))} className="text-slate-400 hover:text-red-500 no-print"><Trash2 size={16} /></button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Photo Modal */}
                    <AnimatePresence>
                        {selectedPhoto && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedPhoto(null)}
                                className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
                            >
                                <motion.img
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    src={selectedPhoto}
                                    className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                    onClick={() => setSelectedPhoto(null)}
                                    className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
                                >
                                    <span className="sr-only">닫기</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 5. Footer Banner & Tip */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6 print:hidden">
                    <div id="section-budget-tip" className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100 flex gap-4 items-start">
                        <div className="bg-orange-100 p-2 rounded-full text-orange-500"><Lightbulb size={20} /></div>
                        <div>
                            <h4 className="font-bold text-amber-900 mb-2">예산 관리 TIP</h4>
                            <p className="text-sm text-amber-800 leading-relaxed font-medium">
                                순공사비 기준 평당 단가는 약 <strong className="text-amber-900">{Math.round(totals.total / (area * 0.3025)).toLocaleString()}원</strong>입니다. 불필요한 마감재 스펙을 조정하면 예산을 절감할 수 있습니다.
                            </p>
                        </div>
                    </div>
                </div>

            </main>

        </div>
    );
}
