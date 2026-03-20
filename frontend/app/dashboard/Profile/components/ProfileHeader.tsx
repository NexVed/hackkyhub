import React from 'react';
import { BadgeCheck, MapPin, Pencil, Share2, Github, Linkedin, Link } from 'lucide-react';

export default function ProfileHeader() {
    return (
        <div className="bg-white rounded-[10px] overflow-hidden shadow-sm border border-[#E5E7EB] flex flex-col shrink-0">
            {/* Banner */}
            <div className="h-20 bg-gradient-to-r relative from-[#8B5CF6] to-[#C084FC] overflow-hidden">
                {/* Abstract geometry */}
                <div className="absolute inset-0 opacity-20">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                        <path d="M0,50 C30,80 70,20 100,50 L100,100 L0,100 Z" fill="white" />
                    </svg>
                </div>
                {/* Verified Badge */}
                <div className="absolute top-2.5 right-2.5 bg-white px-2 py-0.5 rounded-full flex items-center gap-1 text-[#8B5CF6] font-semibold text-[10px] shadow-sm">
                    <BadgeCheck size={10} className="text-[#8B5CF6]" />
                    <span>Verified</span>
                </div>
            </div>

            <div className="px-4 pb-4 relative">
                {/* Actions Overlay */}
                <div className="absolute top-2.5 right-4 flex flex-wrap items-center gap-1.5 z-20">
                    <button className="w-6 h-6 rounded-full bg-white text-[#6B7280] border border-[#E5E7EB] flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
                        <Share2 size={10} />
                    </button>
                    <button className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#E5E7EB] text-[#111827] text-[11px] font-medium hover:bg-gray-50 transition-colors bg-white shadow-sm">
                        <Pencil size={10} />
                        Edit
                    </button>
                </div>

                {/* Profile Image */}
                <div className="w-[60px] h-[60px] rounded-full border-[2.5px] border-white overflow-hidden -mt-8 bg-gray-100 relative z-10 shadow-sm flex items-center justify-center">
                    <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=120&h=120" alt="Jake Richards" className="w-full h-full object-cover" />
                </div>

                {/* Name & Details */}
                <div className="mt-2">
                    <h2 className="text-[16px] font-semibold text-[#111827] tracking-tight">Jake Richards</h2>
                    <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
                        <div className="flex items-center gap-1 text-[#6B7280] text-[11px]">
                            <span className="font-mono text-[10px]">{'</>'}</span>
                            Developer
                        </div>
                        <div className="flex items-center gap-1 text-[#6B7280] text-[11px]">
                            <MapPin size={10} />
                            Bangalore, India
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] text-[10px] font-medium rounded-full hover:bg-gray-100 transition-colors">
                            React <span className="bg-[#E5E7EB] text-[#4B5563] text-[8px] px-1 py-0.5 rounded-full font-bold">x12</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] text-[10px] font-medium rounded-full hover:bg-gray-100 transition-colors">
                            Node.js <span className="bg-[#E5E7EB] text-[#4B5563] text-[8px] px-1 py-0.5 rounded-full font-bold">x8</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] text-[10px] font-medium rounded-full hover:bg-gray-100 transition-colors">
                            Python <span className="bg-[#E5E7EB] text-[#4B5563] text-[8px] px-1 py-0.5 rounded-full font-bold">x5</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-dashed border-[#9CA3AF] text-[#6B7280] text-[10px] font-medium rounded-full hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors cursor-pointer">
                            +3 more
                        </span>
                    </div>
                    {/* Social Links */}
                    <div className="flex items-center gap-2.5 mt-2.5">
                        <a href="#" className="text-[#6B7280] hover:text-[#111827] transition-colors"><Github size={14} /></a>
                        <a href="#" className="text-[#6B7280] hover:text-[#0A66C2] transition-colors"><Linkedin size={14} /></a>
                        <a href="#" className="text-[#6B7280] hover:text-[#8B5CF6] transition-colors"><Link size={14} /></a>
                    </div>
                </div>
            </div>
        </div>
    );
}
