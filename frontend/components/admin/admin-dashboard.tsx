'use client';

import { useState } from 'react';
import { LayoutDashboard, ClipboardList, Package, Users, Calendar } from 'lucide-react';
import { AdminOverview } from './admin-overview';
import { AdminReservas } from './admin-reservas';
import { AdminExperiencias } from './admin-experiencias';
import { AdminUsuarios } from './admin-usuarios';
import { AdminFechas } from './admin-fechas';

const tabs = [
  { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
  { id: 'reservas', label: 'Reservas', icon: ClipboardList },
  { id: 'experiencias', label: 'Experiencias', icon: Package },
  { id: 'fechas', label: 'Horarios', icon: Calendar },
  { id: 'usuarios', label: 'Usuarios', icon: Users },
];

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-5rem)]">
      {/* Sidebar */}
      <aside className="w-full lg:w-60 bg-card border-b lg:border-b-0 lg:border-r shrink-0">
        <div className="p-4 border-b">
          <h2 className="font-display font-bold text-lg">Admin Panel</h2>
          <p className="text-xs text-muted-foreground">A-TENCIÓN</p>
        </div>
        <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible p-2 gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        {activeTab === 'overview' && <AdminOverview />}
        {activeTab === 'reservas' && <AdminReservas />}
        {activeTab === 'experiencias' && <AdminExperiencias />}
        {activeTab === 'fechas' && <AdminFechas />}
        {activeTab === 'usuarios' && <AdminUsuarios />}
      </div>
    </div>
  );
}
