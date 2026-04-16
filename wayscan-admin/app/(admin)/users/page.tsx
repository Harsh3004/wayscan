'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Shield, MapPin, Search,
  MoreVertical, LayoutGrid, ChevronRight, Mail,
  X, Save, ToggleLeft, ToggleRight, Clock, Activity
} from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { mockUsers, mockActivityLog, ZONES, FIELD_TEAMS } from '@/lib/mock-data';
import { AppUser } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

const ROLE_OPTIONS = ['admin', 'field_officer', 'viewer'] as const;

export default function UsersPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<AppUser[]>(mockUsers);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'field_officer' as AppUser['role'], assignedZone: '' });

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = (id: number) => {
    setUsers(prev => prev.map(u =>
      u.id === id
        ? { ...u, status: u.status === 'inactive' ? 'active' : 'inactive' as AppUser['status'] }
        : u
    ));
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) return;
    setUsers(prev => [...prev, {
      id: Date.now(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      zone: newUser.assignedZone || 'Unassigned',
      status: 'active',
      assignedZone: newUser.assignedZone,
      lastActive: new Date().toISOString(),
    }]);
    setNewUser({ name: '', email: '', role: 'field_officer', assignedZone: '' });
    setModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowActivityLog(v => !v)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border transition-all",
              showActivityLog
                ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <Activity className="w-4 h-4" /> {t('users.activity_log_btn')}
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-xl hover:bg-slate-800 dark:hover:bg-blue-700 transition-all"
          >
            <UserPlus className="w-4 h-4" /> {t('users.add_member')}
          </button>
        </div>
      </div>

      {/* Activity Log */}
      <AnimatePresence>
        {showActivityLog && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
              <h3 className="font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" /> {t('users.activity_log')}
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {mockActivityLog.map(log => (
                  <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Activity className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{log.action}</p>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{log.user} · {formatDate(log.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('users.search_placeholder')}
              className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </div>
          <span className="text-xs font-bold text-slate-400 ml-auto">{filtered.length} members</span>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {filtered.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "border rounded-3xl p-5 relative group transition-all duration-300",
                user.status === 'inactive'
                  ? "bg-slate-50/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700/50 opacity-60"
                  : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:-translate-y-1"
              )}
            >
              {/* Status Dot */}
              <div className="flex items-center justify-between mb-5">
                <div className="relative">
                  <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-lg font-black text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 shadow-sm">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-white dark:border-slate-900",
                    user.status === 'active' ? 'bg-emerald-500' :
                    user.status === 'offline' ? 'bg-slate-300 dark:bg-slate-600' :
                    'bg-red-400'
                  )} />
                </div>
                {/* Deactivate Toggle */}
                <button
                  onClick={() => toggleStatus(user.id)}
                  title={user.status === 'inactive' ? 'Reactivate' : 'Deactivate'}
                  className="text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                  {user.status === 'inactive'
                    ? <ToggleLeft className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                    : <ToggleRight className="w-6 h-6 text-emerald-500" />
                  }
                </button>
              </div>

              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mb-0.5">{user.name}</h3>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-4 uppercase tracking-wider">
                <Shield className="w-3 h-3 text-blue-500" /> {t(`users.roles.${user.role}`)}
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" /> {user.assignedZone || user.zone}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" /> {user.email}
                </div>
                {user.lastActive && (
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" /> Last active {formatDate(user.lastActive)}
                  </div>
                )}
              </div>

              <button className="w-full mt-5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all tracking-widest">
                {t('users.manage_permissions')}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md p-8"
            >
              <button onClick={() => setModalOpen(false)} className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">Add New Member</h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">Fill in details to create a new user account.</p>

              <div className="space-y-4">
                {[
                  { label: 'Full Name', field: 'name', placeholder: 'e.g. Rahul Sharma', type: 'text' },
                  { label: 'Email Address', field: 'email', placeholder: 'user@wayscan.gov.in', type: 'email' },
                ].map(item => (
                  <div key={item.field} className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</label>
                    <input
                      type={item.type}
                      value={(newUser as any)[item.field]}
                      onChange={e => setNewUser(prev => ({ ...prev, [item.field]: e.target.value }))}
                      placeholder={item.placeholder}
                      className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                ))}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value as AppUser['role'] }))}
                    className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign Zone</label>
                  <select
                    value={newUser.assignedZone}
                    onChange={e => setNewUser(prev => ({ ...prev, assignedZone: e.target.value }))}
                    className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    <option value="">Select zone…</option>
                    {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setModalOpen(false)} className="flex-1 h-12 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={!newUser.name || !newUser.email}
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Create User
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
