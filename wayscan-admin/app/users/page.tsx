'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, UserPlus, Shield, MapPin, Search, 
  MoreVertical, LayoutGrid, ChevronRight, Mail
} from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';

const users = [
  { id: 1, name: 'Anjali Sharma', role: 'admin', zone: 'Jabalpur HQ', email: 'anjali@wayscan.gov.in', status: 'active' },
  { id: 2, name: 'Vikram Singh', role: 'field_officer', zone: 'Mumbai West', email: 'vikram@wayscan.gov.in', status: 'active' },
  { id: 3, name: 'Rahul Verma', role: 'field_officer', zone: 'Delhi Central', email: 'rahul@wayscan.gov.in', status: 'offline' },
  { id: 4, name: 'Priya Das', role: 'viewer', zone: 'National Council', email: 'priya@wayscan.gov.in', status: 'active' },
];

export default function UsersPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 text-xs font-black uppercase tracking-widest mb-1.5">
            <LayoutGrid className="w-3 h-3" /> {t('nav.dashboard')}
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
            <span className="text-slate-400 dark:text-slate-500">{t('nav.user_management')}</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{t('users.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{t('users.subtitle')}</p>
        </motion.div>

        <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl dark:shadow-blue-900/20 hover:bg-slate-800 dark:hover:bg-blue-700 transition-all">
          <UserPlus className="w-4 h-4" /> {t('users.add_member')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
           <div className="relative flex-1 max-w-sm">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
             <input type="text" placeholder={t('users.search_placeholder')} className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 dark:placeholder-slate-500 flex-1" />
           </div>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
           {users.map((user, i) => (
             <motion.div 
               key={user.id}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.1 }}
               className="bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-3xl p-6 relative group hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
             >
                <div className="absolute top-4 right-4">
                   <button className="text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400"><MoreVertical className="w-5 h-5" /></button>
                </div>
                
                <div className="relative mb-6">
                   <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-xl font-black text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 shadow-sm relative z-10">
                      {t(`data.users.${user.name}`).split(' ').map(n => n[0]).join('')}
                   </div>
                   <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 ${user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'} z-20`} />
                </div>

                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1">{t(`data.users.${user.name}`)}</h3>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-4 uppercase tracking-widest">
                   <Shield className="w-3 h-3 text-blue-500" /> {t(`users.roles.${user.role}`)}
                </p>

                <div className="space-y-2.5">
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" /> {t(`data.cities.${user.zone}`)}
                   </div>
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" /> {user.email}
                   </div>
                </div>

                <button className="w-full mt-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all tracking-widest">
                   {t('users.manage_permissions')}
                </button>
             </motion.div>
           ))}
        </div>
      </div>
    </div>
  );
}
