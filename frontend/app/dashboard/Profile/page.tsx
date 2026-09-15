import React from 'react';
import ProfileHeader from './components/ProfileHeader';
import Participation from './components/Participation';
import ActivityTracker from './components/ActivityTracker';

export default function ProfileDashboard() {
    return (
        <div className="min-h-full bg-[#fafafa] p-3 sm:p-4 lg:p-3 font-sans flex flex-col">
            <div className="max-w-[1240px] w-full mx-auto flex flex-col gap-3">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
                    {/* LEFT COLUMN */}
                    <div className="xl:col-span-4 flex flex-col gap-3">
                        <ProfileHeader />
                        <Participation />
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="xl:col-span-8 flex flex-col gap-3">
                        <ActivityTracker />
                    </div>
                </div>
            </div>
        </div>
    );
}

