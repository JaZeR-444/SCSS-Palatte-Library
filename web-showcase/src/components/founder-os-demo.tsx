"use client";

import React from "react";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  Bell, 
  Search,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export function FounderOsDemo() {
  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl overflow-hidden border border-surface-border-strong bg-surface-app-bg text-surface-text-primary shadow-2xl flex flex-col md:flex-row h-[700px] font-sans mt-8">
      
      {/* Sidebar */}
      <aside className="w-64 bg-surface-panel-bg border-r border-surface-border-subtle flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-surface-border-subtle">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold tracking-tighter">FOS</span>
          </div>
          <span className="font-bold tracking-tight text-lg text-white">Founder OS</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <a href="#" className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-primary-500/10 text-primary-400 font-medium">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
          </a>
          <a href="#" className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-neutral-800 text-surface-text-secondary transition-colors">
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              <span>Customers</span>
            </div>
            <span className="flex items-center justify-center px-2 py-0.5 rounded-full bg-badge-new-bg text-badge-new-text text-[10px] font-bold">
              New
            </span>
          </a>
          <a href="#" className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-neutral-800 text-surface-text-secondary transition-colors">
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4" />
              <span>Billing</span>
            </div>
          </a>
          <a href="#" className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-neutral-800 text-surface-text-secondary transition-colors">
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </div>
          </a>
        </nav>
        
        <div className="p-4 border-t border-surface-border-subtle">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 cursor-pointer transition-colors">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-neutral-200 border-2 border-surface-panel-bg shadow-sm overflow-hidden flex items-center justify-center">
                <span className="font-bold text-neutral-800">JD</span>
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-status-success-bg border-2 border-surface-panel-bg"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">John Doe</p>
              <p className="text-xs text-surface-text-muted truncate">john@founder.os</p>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background glow just for aesthetic flair */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        {/* Header */}
        <header className="h-16 bg-surface-panel-bg border-b border-surface-border-subtle flex items-center justify-between px-6 shrink-0 shadow-sm z-10 relative">
          <div className="relative w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-text-muted" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="w-full pl-9 pr-4 py-2 bg-surface-app-bg border border-surface-border-subtle rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all placeholder:text-surface-text-muted text-white"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-surface-text-secondary hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-badge-unread-bg ring-2 ring-surface-panel-bg"></span>
            </button>
            <button className="px-4 py-2 bg-btn-primary-bg hover:bg-btn-primary-hover text-btn-primary-text text-sm font-bold rounded-lg shadow-sm transition-colors border border-transparent">
              Create Project
            </button>
          </div>
        </header>
        
        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-8 no-scrollbar relative z-10">
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">Overview</h1>
              <p className="text-surface-text-secondary mt-1">Here is what's happening with your projects today.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-status-info-bg text-status-info-text border border-status-info-border rounded-full text-xs font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-status-info-text animate-pulse"></span>
                System Healthy
              </span>
            </div>
          </div>
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-surface-card-bg border border-surface-border-subtle p-6 rounded-xl shadow-sm">
              <p className="text-xs font-bold text-surface-text-muted mb-4 uppercase tracking-widest flex items-center justify-between">
                Total Revenue
                <span className="px-2 py-0.5 bg-tag-revenue-bg text-tag-revenue-text rounded text-[9px]">MRR</span>
              </p>
              <div className="flex items-end justify-between">
                <h2 className="text-3xl font-black tracking-tight text-white">$124,500</h2>
                <div className="flex items-center gap-1 text-status-success-text bg-status-success-bg px-2 py-1 rounded-md text-xs font-bold">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>14.2%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-surface-card-bg border border-surface-border-subtle p-6 rounded-xl shadow-sm">
              <p className="text-xs font-bold text-surface-text-muted mb-4 uppercase tracking-widest flex items-center justify-between">
                Active Users
                <span className="px-2 py-0.5 bg-tag-growth-bg text-tag-growth-text rounded text-[9px]">DAU</span>
              </p>
              <div className="flex items-end justify-between">
                <h2 className="text-3xl font-black tracking-tight text-white">8,234</h2>
                <div className="flex items-center gap-1 text-status-danger-text bg-status-danger-bg px-2 py-1 rounded-md text-xs font-bold">
                  <ArrowDownRight className="w-3 h-3" />
                  <span>2.1%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-surface-card-bg border border-surface-border-subtle p-6 rounded-xl shadow-sm relative overflow-hidden">
              <p className="text-xs font-bold text-surface-text-muted mb-4 uppercase tracking-widest flex items-center justify-between relative z-10">
                Conversion Rate
                <span className="px-2 py-0.5 bg-tag-product-bg text-tag-product-text rounded text-[9px]">FUNNEL</span>
              </p>
              <div className="flex items-end justify-between relative z-10">
                <h2 className="text-3xl font-black tracking-tight text-white">4.6%</h2>
                <div className="flex items-center gap-1 text-status-warning-text bg-status-warning-bg px-2 py-1 rounded-md text-xs font-bold">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>0.8%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity List */}
            <div className="lg:col-span-2 bg-surface-card-bg border border-surface-border-subtle rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-surface-border-subtle flex justify-between items-center bg-surface-panel-bg">
                <h3 className="font-bold text-sm text-white">Recent Activity</h3>
                <button className="text-xs font-bold text-primary-400 hover:text-primary-300 transition-colors">View all</button>
              </div>
              <div className="divide-y divide-surface-border-subtle flex-1 overflow-auto">
                
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 px-5 flex items-center justify-between hover:bg-neutral-800/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-neutral-800 border border-surface-border-subtle flex items-center justify-center flex-shrink-0">
                        {i % 2 === 0 ? <CheckCircle2 className="w-4 h-4 text-status-success-text" /> : <AlertCircle className="w-4 h-4 text-status-warning-text" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {i % 2 === 0 ? 'Deployment Successful' : 'API Rate Limit Reached'}
                        </p>
                        <p className="text-xs text-surface-text-muted mt-0.5">
                          {i % 2 === 0 ? 'Production build finished in 42s' : 'Warning: Endpoint /api/v1/users is throttling'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-surface-text-muted font-medium">Just now</span>
                      <button className="text-surface-text-muted hover:text-white"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                
              </div>
            </div>
            
            {/* Pricing / Plan Card to show tier tokens */}
            <div className="bg-tier-pro-bg border border-tier-pro-border rounded-xl shadow-sm p-6 flex flex-col text-tier-pro-text relative overflow-hidden group hover:border-primary-500 transition-colors">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary-500/30 transition-colors"></div>
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <span className="px-2 py-0.5 bg-primary-500/20 text-primary-300 text-[10px] font-black uppercase tracking-widest rounded-full border border-primary-500/30">
                    Pro Plan
                  </span>
                  <h3 className="text-xl font-black text-white mt-3 tracking-tight">Founder OS</h3>
                </div>
              </div>
              
              <p className="text-sm text-primary-200/70 mb-6 relative z-10 leading-relaxed">
                You are currently using 80% of your monthly API limits. Upgrade to Enterprise for unlimited usage.
              </p>
              
              <div className="mt-auto relative z-10 space-y-4">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>8,000 / 10,000 req</span>
                  <span className="text-white">80%</span>
                </div>
                <div className="w-full bg-primary-900 rounded-full h-1.5 overflow-hidden border border-primary-800">
                  <div className="bg-gradient-to-r from-primary-500 to-primary-300 h-1.5 rounded-full" style={{ width: '80%' }}></div>
                </div>
                <button className="w-full mt-2 py-2.5 bg-white text-primary-900 hover:bg-primary-50 text-xs font-bold rounded-lg transition-colors shadow-sm">
                  Upgrade to Enterprise
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </main>
      
    </div>
  );
}
