import React from 'react';
import { Calendar, ChevronDown, Info } from 'lucide-react';

export default function Participation() {
    return (
        <div className="bg-white rounded-[10px] p-4 shadow-sm border border-[#E5E7EB] flex flex-col shrink-0 flex-1">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-[13px] font-semibold text-[#111827] flex items-center gap-1.5">
                    Participation & Engagement
                    <div className="group relative cursor-help">
                        <Info size={12} className="text-[#E5E7EB] hover:text-[#6B7280] transition-colors" />
                    </div>
                </h3>
                <button className="flex items-center gap-1 px-2 py-1 border border-[#E5E7EB] rounded md:hidden xl:flex text-[10px] font-medium text-[#6B7280] hover:bg-gray-50 transition-colors">
                    <Calendar size={10} className="text-[#6B7280]" /> 90 Days <ChevronDown size={10} />
                </button>
            </div>

            <div className="flex flex-col xl:flex-row items-center justify-center gap-4 mb-3 mt-1">
                {/* Donut Chart */}
                <div className="relative w-[90px] h-[90px] shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        <defs>
                            <pattern id="diag-stripes" width="4" height="4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                                <line x1="0" y1="0" x2="0" y2="4" stroke="#D1FAE5" strokeWidth="2.5" />
                                <line x1="2" y1="0" x2="2" y2="4" stroke="#10B981" strokeWidth="2.5" />
                            </pattern>
                        </defs>
                        <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F9FAFB" strokeWidth="14" />
                        {/* Purple section */}
                        <circle cx="50" cy="50" r="38" fill="transparent" stroke="#8B5CF6" strokeWidth="14" strokeDasharray="143 238.7" strokeDashoffset="0" className="transition-all duration-1000 ease-out" />
                        {/* Green Striped section */}
                        <circle cx="50" cy="50" r="38" fill="transparent" stroke="url(#diag-stripes)" strokeWidth="14" strokeDasharray="48 238.7" strokeDashoffset="-143" className="transition-all duration-1000 ease-out" />
                        {/* Gray section */}
                        <circle cx="50" cy="50" r="38" fill="transparent" stroke="#9CA3AF" strokeWidth="14" strokeDasharray="47.7 238.7" strokeDashoffset="-191" className="transition-all duration-1000 ease-out" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-[12px] font-bold text-[#111827] mt-[2px]">$32,500</span>
                        <span className="text-[7px] font-medium text-[#6B7280]">Potential Prizes</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-2 w-auto">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-[#8B5CF6] shrink-0"></div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-[11px] font-semibold text-[#111827]">Platform Usage</span>
                            <span className="text-[9px] text-[#6B7280]">150 Logins</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "repeating-linear-gradient(45deg, #10B981, #10B981 2px, #D1FAE5 2px, #D1FAE5 4px)" }}></div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-[11px] font-semibold text-[#111827]">Hackathon Wins</span>
                            <span className="text-[9px] text-[#6B7280]">4 Challenges</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-[#9CA3AF] shrink-0"></div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-[11px] font-semibold text-[#111827]">Team Formations</span>
                            <span className="text-[9px] text-[#6B7280]">15 Teams</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Metrics Below Chart */}
            <div className="flex flex-col gap-3 mt-auto">
                <div className="flex flex-wrap items-center justify-center gap-1">
                    <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 text-[9px] font-semibold rounded-full border border-purple-100">Top 10% Participant</span>
                    <span className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[9px] font-semibold rounded-full border border-green-100">Consistent Contributor</span>
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-semibold rounded-full border border-blue-100">Team Player</span>
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px] font-medium text-[#6B7280]">
                        <span>Profile Completeness</span>
                        <span className="text-[#111827] font-bold">85%</span>
                    </div>
                    <div className="w-full h-1 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div className="h-full bg-[#10B981] rounded-full" style={{ width: '85%' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
