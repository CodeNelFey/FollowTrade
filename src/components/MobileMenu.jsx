import React from 'react';
import { LayoutDashboard, Megaphone, LineChart, Calendar as CalendarIcon, Calculator, Crown } from 'lucide-react';

const MobileMenu = ({ activeTab, onNavClick, user, hasNewUpdates }) => {
    const btnClass = (tab) => `flex flex-col items-center justify-center p-2 rounded-xl relative ${activeTab === tab ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-400'}`;

    return (
        <div className="md:hidden bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 p-2 grid grid-cols-5 gap-1">
            <button onClick={() => onNavClick('journal')} className={btnClass('journal')}>
                <LayoutDashboard size={20} />
                <span className="text-[9px] font-medium mt-1">Journal</span>
            </button>

            {/* ANALYSES + Couronne */}
            <button onClick={() => onNavClick('graphs')} className={btnClass('graphs')}>
                <LineChart size={20} />
                <span className="text-[9px] font-medium mt-1">Analyses</span>
                {user.is_pro === 0 && <div className="absolute top-1 right-2 text-yellow-500"><Crown size={10} fill="currentColor" /></div>}
            </button>

            {/* CALENDRIER + Couronne */}
            <button onClick={() => onNavClick('calendar')} className={btnClass('calendar')}>
                <CalendarIcon size={20} />
                <span className="text-[9px] font-medium mt-1">Calendrier</span>
                {user.is_pro === 0 && <div className="absolute top-1 right-2 text-yellow-500"><Crown size={10} fill="currentColor" /></div>}
            </button>

            <button onClick={() => onNavClick('calculator')} className={btnClass('calculator')}>
                <Calculator size={20} />
                <span className="text-[9px] font-medium mt-1">Calc</span>
            </button>

            <button onClick={() => onNavClick('updates')} className={btnClass('updates')}>
                <Megaphone size={20} />
                <span className="text-[9px] font-medium mt-1">News</span>
                {hasNewUpdates && <span className="absolute top-1 right-3 bg-red-500 w-2 h-2 rounded-full animate-pulse"></span>}
            </button>
        </div>
    );
};

export default MobileMenu;