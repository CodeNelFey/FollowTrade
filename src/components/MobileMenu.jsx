import React from 'react';
import { LayoutDashboard, Megaphone, LineChart, Calendar as CalendarIcon, Calculator, Crown } from 'lucide-react';

const MobileMenu = ({ activeTab, onNavClick, user, hasNewUpdates, colors }) => { // Ajout de la prop 'colors'

    // Helper pour le style actif dynamique
    const getActiveStyle = (tab) => {
        if (activeTab === tab) {
            return {
                color: colors.balance,
                backgroundColor: `${colors.balance}25` // Ajoute de la transparence (~15%) à la couleur de balance
            };
        }
        return {};
    };

    const btnClass = (tab) => `flex flex-col items-center justify-center p-2 rounded-xl relative transition-all ${activeTab === tab ? 'font-bold' : 'text-gray-400'}`;

    return (
        <div className="md:hidden bg-white dark:bg-[#262626] border-t border-gray-200 dark:border-neutral-800 p-2 grid grid-cols-5 gap-1">

            <button
                onClick={() => onNavClick('journal')}
                className={btnClass('journal')}
                style={getActiveStyle('journal')}
            >
                <LayoutDashboard size={20} />
                <span className="text-[9px] mt-1">Journal</span>
            </button>

            {/* ANALYSES + Couronne */}
            <button
                onClick={() => onNavClick('graphs')}
                className={btnClass('graphs')}
                style={getActiveStyle('graphs')}
            >
                <LineChart size={20} />
                <span className="text-[9px] mt-1">Analyses</span>
                {user.is_pro === 0 && <div className="absolute top-1 right-2 text-yellow-500"><Crown size={10} fill="currentColor" /></div>}
            </button>

            {/* CALENDRIER + Couronne */}
            <button
                onClick={() => onNavClick('calendar')}
                className={btnClass('calendar')}
                style={getActiveStyle('calendar')}
            >
                <CalendarIcon size={20} />
                <span className="text-[9px] mt-1">Calendrier</span>
                {user.is_pro === 0 && <div className="absolute top-1 right-2 text-yellow-500"><Crown size={10} fill="currentColor" /></div>}
            </button>

            <button
                onClick={() => onNavClick('calculator')}
                className={btnClass('calculator')}
                style={getActiveStyle('calculator')}
            >
                <Calculator size={20} />
                <span className="text-[9px] mt-1">Calc</span>
            </button>

            <button
                onClick={() => onNavClick('updates')}
                className={btnClass('updates')}
                style={getActiveStyle('updates')}
            >
                <Megaphone size={20} />
                <span className="text-[9px] mt-1">News</span>
                {hasNewUpdates && <span className="absolute top-1 right-3 bg-red-500 w-2 h-2 rounded-full animate-pulse"></span>}
            </button>
        </div>
    );
};

export default MobileMenu;