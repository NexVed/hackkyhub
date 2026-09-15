"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, ArrowUpRight } from 'lucide-react';

const generateHeatmapData = () => {
    const data = [];
    for (let m = 0; m < 5; m++) { // Changed from 3 to 5 months
        const month = [];
        for (let w = 0; w < 5; w++) {
            const week = [];
            for (let d = 0; d < 7; d++) {
                if (Math.random() > 0.4) {
                    week.push(Math.floor(Math.random() * 4) + 1);
                } else {
                    week.push(0);
                }
            }
            month.push(week);
        }
        data.push(month);
    }
    return data;
};

// Light theme heatmap intensity classes
const getIntensityClass = (int: number) => {
    switch (int) {
        case 0: return 'bg-[#F3F4F6]'; // Very Light Gray
        case 1: return 'bg-[#D1FAE5]'; // Light Green
        case 2: return 'bg-[#6EE7B7]'; // Medium Green
        case 3: return 'bg-[#10B981]'; // Main Green
        case 4: return 'bg-[#059669]'; // Dark Green
        default: return 'bg-[#F3F4F6]';
    }
};

export default function ActivityTracker() {
    const [heatmapData, setHeatmapData] = useState<number[][][]>([]);

    useEffect(() => {
        setHeatmapData(generateHeatmapData());
    }, []);

    const months = [
        { name: 'Apr', total: '3,109', data: heatmapData[0] || null },
        { name: 'May', total: '4,521', data: heatmapData[1] || null },
        { name: 'Jun', total: '6,102', data: heatmapData[2] || null },
        { name: 'Jul', total: '7,845', data: heatmapData[3] || null },
        { name: 'Aug', total: '4,298', data: heatmapData[4] || null }
    ];

    return (
        <div className="bg-white rounded-[10px] p-4 lg:p-5 flex flex-col relative shadow-sm border border-[#E5E7EB] overflow-hidden flex-1 shrink-0">

            {/* Header Section */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start md:items-center mb-5 relative z-10 w-full">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#F9FAFB] flex items-center justify-center border border-[#E5E7EB]">
                            <Calendar size={12} className="text-[#4B5563]" />
                        </div>
                        <div>
                            <h3 className="text-[#111827] font-semibold text-[14px] tracking-tight">Hackathon Activity Tracker</h3>
                            <p className="text-[#6B7280] text-[11px] mt-0.5">Apr 1 - Aug 31, 2025</p>
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-[10px] text-[#6B7280] uppercase tracking-widest font-semibold mb-0.5">Total Actions</div>
                        <div className="text-2xl font-bold text-[#111827] tracking-tight font-mono">
                            18,245
                        </div>
                    </div>
                </div>

                <button className="flex min-h-10 w-full items-center justify-center gap-1.5 px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-full font-semibold text-[11px] shadow-[0_4px_10px_rgba(16,185,129,0.2)] transition-all duration-300 sm:min-h-0 sm:w-auto">
                    Export <ArrowUpRight size={12} strokeWidth={2.5} />
                </button>
            </div>

            <div className="flex-grow flex flex-col justify-center relative z-10 w-full overflow-x-auto custom-scrollbar no-scrollbar py-1">
                <div className="flex min-w-[590px] gap-4 lg:gap-6 mx-auto w-full justify-between">
                    {months.map((month, i) => (
                        <div key={i} className="flex flex-col shrink-0 flex-1 items-center">
                            <div className="text-[#111827] font-semibold text-[11px] mb-2 text-center w-full">{month.name}</div>

                            <div className="flex gap-1.5 justify-center w-full">
                                {/* Weekday Labels (Rows) */}
                                {/* Moved weekday labels to be conditionally rendered or removed based on space */}
                                {i === 0 && ( // Only show for the first month
                                    <div className="flex flex-col justify-between py-0.5 pr-1 text-[9px] font-medium text-[#9CA3AF] text-right h-[75px] shrink-0">
                                        <span className="h-2 flex items-center">M</span>
                                        <span className="h-2 flex items-center">T</span>
                                        <span className="h-2 flex items-center">W</span>
                                        <span className="h-2 flex items-center">T</span>
                                        <span className="h-2 flex items-center">F</span>
                                        <span className="h-2 flex items-center">S</span>
                                        <span className="h-2 flex items-center">S</span>
                                    </div>
                                )}

                                {/* Dot Matrix Heatmap */}
                                <div className="flex gap-1 h-[75px] justify-center mx-auto">
                                    {month.data && month.data.map((week, wIndex) => (
                                        <div key={wIndex} className="flex flex-col justify-between h-full">
                                            {week.map((dayInt: number, dIndex: number) => (
                                                <div
                                                    key={dIndex}
                                                    className={`w-[8px] h-[8px] sm:w-[9px] sm:h-[9px] rounded-[2px] transition-all duration-200 hover:scale-125 hover:border hover:border-black/10 cursor-pointer ${getIntensityClass(dayInt)} relative group shrink-0`}
                                                >
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block whitespace-nowrap px-1.5 py-0.5 bg-[#1F2937] text-[9px] font-medium text-white rounded shadow-lg z-20 pointer-events-none">
                                                        {month.name} {(wIndex * 7) + dIndex + 1}: {dayInt * 12} acts
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Monthly Footnote */}
                            <div className="mt-2 text-[#6B7280] font-medium text-[9px] text-center w-full">
                                {month.total}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Row */}
            <div className="mt-3 pt-3 border-t border-[#E5E7EB] flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0">

                <div className="text-[#9CA3AF] text-[9px]">Views · Apply · Chats · Docs</div>

                {/* Heatmap Legend */}
                <div className="flex items-center gap-1.5 text-[9px] text-[#6B7280] font-medium">
                    <span>Less</span>
                    <div className="flex gap-0.5">
                        <div className="w-[8px] h-[8px] rounded-[1px] bg-[#F3F4F6]"></div>
                        <div className="w-[8px] h-[8px] rounded-[1px] bg-[#D1FAE5]"></div>
                        <div className="w-[8px] h-[8px] rounded-[1px] bg-[#6EE7B7]"></div>
                        <div className="w-[8px] h-[8px] rounded-[1px] bg-[#10B981]"></div>
                        <div className="w-[8px] h-[8px] rounded-[1px] bg-[#059669]"></div>
                    </div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}
