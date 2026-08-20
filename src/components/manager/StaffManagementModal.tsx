import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { TenantStaffMember, StaffRole } from '../../types';
import { Users, Plus, Trash2, Shield, KeyRound, Check, X, UserCheck } from 'lucide-react';

export const StaffManagementModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { tenant } = useTenant();
  const { staffList, addStaffMember, removeStaffMember, currentStaff, loginAsStaff } = useAuth();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('waiter');
  const [pinCode, setPinCode] = useState('');
  const [assignedSection, setAssignedSection] = useState('');

  if (!isOpen) return null;

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || pinCode.length !== 4) return;

    addStaffMember({
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@${tenant.slug}.mw`,
      role,
      pinCode,
      assignedSections: assignedSection ? [assignedSection] : [],
      active: true,
    });

    setName('');
    setEmail('');
    setPinCode('');
    setAssignedSection('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#1E1B18] border border-[#3A332C] rounded-3xl p-6 text-stone-100 shadow-2xl relative max-h-[90vh] flex flex-col">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C9532F]/20 border border-[#C9532F]/40 flex items-center justify-center text-[#E07A5F]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-100">
                Staff &amp; PIN Management
              </h3>
              <p className="text-xs text-stone-400">
                {tenant.name} · Role-based access and 4-digit shift keys
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-white bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Active Staff Roster ({staffList.length})
            </span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-xl bg-[#C9532F] hover:bg-[#B34524] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Staff Member</span>
            </button>
          </div>

          {/* Add Staff Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddStaff}
              className="p-4 bg-stone-900/90 border border-stone-700 rounded-2xl space-y-3"
            >
              <div className="text-xs font-bold text-stone-200">New Staff Profile</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-stone-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kondwani Tembo"
                    className="w-full bg-[#141210] border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-[#C9532F]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 block mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as StaffRole)}
                    className="w-full bg-[#141210] border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-[#C9532F]"
                  >
                    <option value="waiter">Waiter / Floor Server</option>
                    <option value="kitchen">Kitchen Chef</option>
                    <option value="bartender">Bartender</option>
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 block mb-1">4-Digit PIN Code</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    pattern="[0-9]{4}"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="4 digits (e.g. 5678)"
                    className="w-full bg-[#141210] border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-200 font-mono tracking-widest focus:outline-none focus:border-[#C9532F]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 block mb-1">Assigned Section (Optional)</label>
                  <input
                    type="text"
                    value={assignedSection}
                    onChange={(e) => setAssignedSection(e.target.value)}
                    placeholder="e.g. Lake Patio"
                    className="w-full bg-[#141210] border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-[#C9532F]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-xl text-stone-400 hover:text-stone-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#C9532F] text-white text-xs font-bold"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          )}

          {/* Staff Roster Cards */}
          <div className="space-y-2">
            {staffList.map((staff) => (
              <div
                key={staff.id}
                className="p-3.5 bg-stone-900/60 border border-stone-800 rounded-2xl flex items-center justify-between gap-3 hover:border-stone-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#2A2420] border border-stone-700 flex items-center justify-center font-bold text-stone-200 text-xs">
                    {staff.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-200 text-sm">{staff.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-stone-800 text-[#E07A5F] border border-[#C9532F]/20">
                        {staff.role}
                      </span>
                      {currentStaff?.id === staff.id && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Active Session
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                      <span>{staff.email}</span>
                      {staff.assignedSections && staff.assignedSections.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{staff.assignedSections.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loginAsStaff(staff)}
                    className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-[#C9532F] text-stone-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1"
                    title="Switch shift to this staff member"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Switch</span>
                  </button>

                  <button
                    onClick={() => removeStaffMember(staff.id)}
                    className="p-2 text-stone-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-stone-800"
                    title="Remove staff member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-800 flex justify-between items-center text-xs text-stone-400">
          <span>All PINs are encrypted per tenant boundary</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
