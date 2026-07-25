import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ExternalLink } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface LeadSlideOverProps {
  lead: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

// Custom Smooth Dropdown Component
function SmoothDropdown({ value, options, onChange, disabled, label }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o: any) => o.value === value) || options[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all disabled:opacity-50 hover:bg-gray-50"
      >
        <span className="truncate">{selectedOption?.label || 'Select...'}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt: any) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${value === opt.value ? 'bg-gray-50 font-medium text-gray-900' : 'text-gray-600'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LeadSlideOver({ lead, isOpen, onClose, onUpdate }: LeadSlideOverProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && user?.role?.toUpperCase() === 'ADMIN') {
      api.get('/users/approved').then(res => setTeamMembers(res.data)).catch(console.error);
    }
  }, [isOpen, user]);

  if (!isOpen || !lead) return null;

  const activities = [...(lead.activities || [])].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
  // Logic for minimal trail: First + Last 4
  const showEllipsis = activities.length > 5;
  const displayActivities = showEllipsis 
    ? [activities[0], 'ELLIPSIS', ...activities.slice(-4)] 
    : activities;

  const handleStatusChange = async (val: string) => {
    setIsUpdating(true);
    try {
      await api.put(`/leads/${lead.id}`, { status: val });
      onUpdate();
    } catch (err) { console.error(err); } finally { setIsUpdating(false); }
  };

  const handleAssigneeChange = async (val: string) => {
    setIsUpdating(true);
    try {
      await api.put(`/leads/${lead.id}`, { assigned_to: val || null });
      onUpdate();
    } catch (err) { console.error(err); } finally { setIsUpdating(false); }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsSubmittingNote(true);
    try {
      await api.post(`/leads/${lead.id}/notes`, { 
        content: newNote,
        activity_log_id: selectedActivityId || null
      });
      setNewNote('');
      setSelectedActivityId('');
      onUpdate();
    } catch (err) { console.error(err); } finally { setIsSubmittingNote(false); }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-md w-full flex">
        <div className="w-full h-full bg-white shadow-2xl flex flex-col animate-slide-in-right border-l border-gray-100">
          
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
            <div>
              <h2 className="text-xl font-medium text-gray-900">{lead.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{lead.company || 'No company listed'}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SmoothDropdown 
                label="Status"
                value={lead.status}
                disabled={isUpdating}
                onChange={handleStatusChange}
                options={[
                  { value: 'new', label: 'New' },
                  { value: 'contacted', label: 'Contacted' },
                  { value: 'qualified', label: 'Qualified' },
                  { value: 'won', label: 'Won' },
                  { value: 'lost', label: 'Lost' }
                ]}
              />

              {user?.role?.toUpperCase() === 'ADMIN' && (
                <SmoothDropdown 
                  label="Assignee"
                  value={lead.assigned_to || ''}
                  disabled={isUpdating}
                  onChange={handleAssigneeChange}
                  options={[
                    { value: '', label: 'Unassigned' },
                    ...teamMembers.map(m => ({ value: m.id, label: m.first_name }))
                  ]}
                />
              )}
            </div>

            {/* Note Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Add Note</label>
              <form onSubmit={handleAddNote} className="space-y-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type note..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:border-gray-900 transition-all resize-none"
                  rows={2} required
                />
                <div className="flex justify-between items-center">
                  <select 
                    value={selectedActivityId}
                    onChange={(e) => setSelectedActivityId(e.target.value)}
                    className="text-xs bg-gray-50 border border-gray-200 rounded py-1 px-2 text-gray-600 focus:outline-none"
                  >
                    <option value="">(Optional) Link to activity</option>
                    {activities.map((act: any) => (
                      <option key={act.id} value={act.id}>{act.action} - {new Date(act.created_at).toLocaleDateString()}</option>
                    ))}
                  </select>
                  <button type="submit" disabled={isSubmittingNote} className="px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded hover:bg-gray-800 disabled:opacity-50">
                    {isSubmittingNote ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>

            {/* Minimal Activity Trail */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity Overview</label>
                <button 
                  onClick={() => navigate(`/dashboard/lead/${lead.id}`)}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Detailed View <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <ul className="relative border-l-2 border-gray-200 ml-2">
                {displayActivities.map((activity: any, _idx: number) => {
                  if (activity === 'ELLIPSIS') {
                    return (
                      <li key="ellipsis" className="relative pl-6 pb-6 text-xs text-gray-400 italic">
                        <span className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-gray-200" />
                        ... more activities ...
                      </li>
                    );
                  }
                  return (
                    <li key={activity.id} className="relative pl-6 pb-6 last:pb-0">
                      <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-blue-400 ring-4 ring-white" />
                      <p className="text-sm text-gray-800">{activity.details || activity.action}</p>
                      <span className="text-xs text-gray-400">{new Date(activity.created_at).toLocaleDateString()}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}