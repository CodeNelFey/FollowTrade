import React from 'react';
import { LayoutDashboard, Megaphone, LineChart, Calendar as CalendarIcon, Calculator, Crown } from 'lucide-react';

const MobileMenu = ({ activeTab, onNavClick, user, hasNewUpdates, colors }) => {

    // Helper pour le style actif dynamique
    const getActiveStyle = (tab) => {
        if (activeTab === tab) {
            return {
                color: colors.balance,
                backgroundColor: `${colors.balance}20` // Transparence légère (20%)
            };
        }
        return {};
    };

    const btnClass = (tab) => `flex flex-col items-center justify-center py-2 rounded-xl relative transition-all duration-200 active:scale-95 ${activeTab === tab ? 'font-bold' : 'text-gray-500 dark:text-gray-400'}`;

    return (
        <div className="grid grid-cols-5 gap-1 w-full max-w-md mx-auto p-2">

            <button
                onClick={() => onNavClick('journal')}
                className={btnClass('journal')}
                style={getActiveStyle('journal')}
            >
                <LayoutDashboard size={22} />
                <span className="text-[10px] mt-1">Journal</span>
            </button>

            <button
                onClick={() => onNavClick('graphs')}
                className={btnClass('graphs')}
                style={getActiveStyle('graphs')}
            >
                <LineChart size={22} />
                <span className="text-[10px] mt-1">Analyses</span>
                {user.is_pro === 0 && <div className="absolute top-1 right-2 text-yellow-500"><Crown size={8} fill="currentColor" /></div>}
            </button>

            <button
                onClick={() => onNavClick('calendar')}
                className={btnClass('calendar')}
                style={getActiveStyle('calendar')}
            >
                <CalendarIcon size={22} />
                <span className="text-[10px] mt-1">Agenda</span>
                {user.is_pro === 0 && <div className="absolute top-1 right-2 text-yellow-500"><Crown size={8} fill="currentColor" /></div>}
            </button>

            <button
                onClick={() => onNavClick('calculator')}
                className={btnClass('calculator')}
                style={getActiveStyle('calculator')}
            >
                <Calculator size={22} />
                <span className="text-[10px] mt-1">Calc</span>
            </button>

            <button
                onClick={() => onNavClick('updates')}
                className={btnClass('updates')}
                style={getActiveStyle('updates')}
            >
                <Megaphone size={22} />
                <span className="text-[10px] mt-1">News</span>
                {hasNewUpdates && <span className="absolute top-2 right-4 bg-red-500 w-1.5 h-1.5 rounded-full animate-pulse"></span>}
            </button>
        </div>
    );
};

export default MobileMenu;