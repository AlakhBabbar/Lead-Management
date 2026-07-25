import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, CheckCircle2, ChevronDown, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

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
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-900 transition-all disabled:opacity-50 hover:bg-gray-100 shadow-sm"
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

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [lead, setLead] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [activePopover, setActivePopover] = useState<string | null>(null);
  
  // Management States
  const [newNote, setNewNote] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLead = () => {
    api.get('/leads/').then(res => {
      const found = res.data.find((l: any) => l.id === id);
      setLead(found);
    }).catch(console.error);
  };

  useEffect(() => {
    fetchLead();
    if (user?.role?.toUpperCase() === 'ADMIN') {
      api.get('/users/approved').then(res => setTeamMembers(res.data)).catch(console.error);
    }
  }, [id, user]);

  // NEW: Global click listener to close the popover when clicking anywhere else
  useEffect(() => {
    const handleGlobalClick = () => setActivePopover(null);
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  if (!lead) return <div className="p-10 text-center animate-pulse text-gray-500">Loading detailed view...</div>;

  const activities = [...(lead.activities || [])].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const unattachedNotes = lead.notes?.filter((n: any) => !n.activity_log_id) || [];

  const chunks = [];
  for (let i = 0; i < activities.length; i += 4) {
    chunks.push(activities.slice(i, i + 4));
  }

  const getStatusColor = (status: string) => {
    const colors = {
      NEW: 'bg-blue-50 text-blue-700 border-blue-200',
      CONTACTED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      QUALIFIED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      WON: 'bg-green-50 text-green-700 border-green-200',
      LOST: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[status.toUpperCase() as keyof typeof colors] || colors.NEW;
  };

  const handleStatusChange = async (val: string) => {
    setIsUpdating(true);
    try {
      await api.put(`/leads/${lead.id}`, { status: val });
      fetchLead();
    } catch (err) { console.error(err); } finally { setIsUpdating(false); }
  };

  const handleAssigneeChange = async (val: string) => {
    setIsUpdating(true);
    try {
      await api.put(`/leads/${lead.id}`, { assigned_to: val || null });
      fetchLead();
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
      fetchLead();
    } catch (err) { console.error(err); } finally { setIsSubmittingNote(false); }
  };

  const handleDeleteLead = async () => {
    if (!window.confirm(`Delete the lead for "${lead.name}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await api.delete(`/leads/${lead.id}`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to delete lead', error);
      alert('Failed to delete lead. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full pb-20">
      
      {/* HEADER ACTIONS */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {user?.role?.toUpperCase() === 'ADMIN' && (
          <button 
            onClick={handleDeleteLead}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isDeleting ? 'Deleting...' : 'Delete Lead'}
          </button>
        )}
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-light tracking-tight text-gray-900">{lead.name}'s Journey</h1>
        <div className="flex items-center gap-3 mt-2">
          <p className="text-gray-500">{lead.company || 'No Company provided'}</p>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(lead.status)}`}>
            {lead.status}
          </span>
        </div>
      </div>

      {/* --- SERPENTINE TRACK --- */}
      <div className="bg-white px-8 pt-8 pb-16 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-12 text-center">Activity Timeline</h3>
        
        <div className="flex flex-col items-center relative">
          {chunks.map((chunk, rowIdx) => {
            const isReverse = rowIdx % 2 === 1;
            const isLastRow = rowIdx === chunks.length - 1;

            return (
              <div key={rowIdx} className={`relative flex w-full max-w-4xl justify-around h-32 items-center ${isReverse ? 'flex-row-reverse' : 'flex-row'} ${chunk.some(a => a.id === activePopover) ? 'z-50' : 'z-10'}`}>
                
                <div className="absolute top-1/2 left-[12.5%] right-[12.5%] h-2 bg-gray-200 -z-0 transform -translate-y-1/2 rounded-full" />

                {!isLastRow && (
                  <div className={`absolute top-1/2 w-2 bg-gray-200 -z-0 h-32 rounded-full ${isReverse ? 'left-[12.5%] transform -translate-x-1/2' : 'right-[12.5%] transform translate-x-1/2'}`} />
                )}

                {chunk.map((act: any) => {
                  const hasNotes = act.notes && act.notes.length > 0;
                  const recentNote = hasNotes ? act.notes[act.notes.length - 1] : null;
                  const isCreation = act.action === 'LEAD_CREATED';

                  return (
                    <div 
                      key={act.id} 
                      className={`relative group flex flex-col items-center w-0 ${activePopover === act.id ? 'z-[100]' : 'z-10'}`} 
                      // NEW: Stop propagation here so clicking the node doesn't immediately trigger the document click listener
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePopover(activePopover === act.id ? null : act.id);
                      }}
                    >
                      <div className={`w-14 h-14 rounded-full border-[4px] border-white shadow-md flex items-center justify-center transition-transform cursor-pointer group-hover:scale-110 ${
                        hasNotes ? 'bg-purple-100 border-purple-500' : 
                        isCreation ? 'bg-green-100 border-green-500' : 'bg-blue-100 border-blue-500'
                      }`}>
                        {hasNotes ? <MessageSquare className="w-5 h-5 text-purple-600" /> : isCreation ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <div className="w-3 h-3 bg-blue-500 rounded-full" />}
                      </div>

                      <div className="absolute top-16 w-32 text-center pointer-events-none">
                        <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide truncate">
                          {act.action.replace(/_/g, ' ')}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(act.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {!activePopover && (
                        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity w-64 bg-gray-900 text-white text-xs rounded-xl p-3 -top-3 left-1/2 transform -translate-x-1/2 -translate-y-full pointer-events-none z-20 shadow-xl">
                          <p className="font-semibold text-gray-300 mb-1.5 border-b border-gray-700/50 pb-1.5">
                            {act.action.replace(/_/g, ' ')}
                          </p>
                          {act.details && (
                            <p className="text-gray-400 mb-2 leading-relaxed">
                              {act.details}
                            </p>
                          )}
                          {recentNote && (
                            <div className="bg-gray-800/50 rounded-lg p-2 mt-2">
                              <div className="flex items-center gap-1.5 mb-1">
                                <MessageSquare className="w-3 h-3 text-purple-400" />
                                <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider">Latest Note</span>
                              </div>
                              <p className="italic text-gray-300 mb-1">"{recentNote.content}"</p>
                              <p className="text-gray-500 text-[10px]">— {recentNote.author?.first_name || 'User'}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* NEW: Stop propagation on the popover itself so interacting with it doesn't close it */}
                      {activePopover === act.id && hasNotes && (
                        <div 
                          className="absolute z-[100] w-72 bg-white border border-gray-200 rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.15)] p-5 top-16 left-1/2 transform -translate-x-1/2 cursor-default" 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-gray-200 rotate-45" />
                          
                          <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Notes Thread</h4>
                            <button onClick={() => setActivePopover(null)} className="text-gray-400 hover:text-gray-700 text-xs font-medium">Close</button>
                          </div>
                          
                          <div className="space-y-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                            {act.notes.map((n: any) => {
                              const isAdmin = n.author?.role?.toUpperCase() === 'ADMIN';
                              return (
                                <div key={n.id} className={`p-3 rounded-xl text-sm ${isAdmin ? 'bg-purple-50 border border-purple-100 text-purple-900 ml-4 rounded-tr-none' : 'bg-blue-50 border border-blue-100 text-blue-900 mr-4 rounded-tl-none'}`}>
                                  <p className="leading-relaxed">{n.content}</p>
                                  <div className="flex justify-between items-center mt-2">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isAdmin ? 'text-purple-600' : 'text-blue-600'}`}>
                                      {n.author?.first_name || 'User'} ({isAdmin ? 'Admin' : 'Member'})
                                    </span>
                                    <span className="text-[9px] text-gray-400 font-medium">
                                      {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* --- TWO COLUMN LAYOUT: MANAGE & NOTES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Management & Lead Details */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Quick Actions Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 pb-3">Manage Lead</h3>
            <div className="space-y-4">
              <SmoothDropdown 
                label="Lead Status"
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
          </div>

          {/* Lead Information Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 pb-3">Lead Details</h3>
            <div className="space-y-4">
              <div><span className="text-xs text-gray-400 block font-medium mb-1">Email</span><a href={`mailto:${lead.email}`} className="text-sm text-blue-600 hover:underline">{lead.email}</a></div>
              <div><span className="text-xs text-gray-400 block font-medium mb-1">Phone</span><span className="text-sm text-gray-900">{lead.phone || '-'}</span></div>
              <div>
                <span className="text-xs text-gray-400 block font-medium mb-1">Initial Message</span>
                <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl mt-1 leading-relaxed border border-gray-100">{lead.message || 'No message provided.'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Note Input & General Notes */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] h-fit">
          
          {/* Note Composer */}
          <div className="mb-8 p-5 bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              Add a Note
            </h4>
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Type your note here..."
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:border-gray-900 transition-all resize-none shadow-sm"
                rows={3} required
              />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <select 
                  value={selectedActivityId}
                  onChange={(e) => setSelectedActivityId(e.target.value)}
                  className="w-full sm:w-auto text-xs bg-white border border-gray-200 rounded-lg py-2 px-3 text-gray-600 focus:outline-none focus:border-gray-900 shadow-sm transition-colors cursor-pointer"
                >
                  <option value="">(Optional) Link to activity node...</option>
                  {activities.map((act: any) => (
                    <option key={act.id} value={act.id}>{act.action.replace(/_/g, ' ')} - {new Date(act.created_at).toLocaleDateString()}</option>
                  ))}
                </select>
                <button 
                  type="submit" 
                  disabled={isSubmittingNote} 
                  className="w-full sm:w-auto px-5 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap"
                >
                  {isSubmittingNote ? 'Saving...' : 'Post Note'}
                </button>
              </div>
            </form>
          </div>

          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 pb-3">General Notes</h3>
          {unattachedNotes.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
              <p className="text-sm text-gray-400 font-medium">No general notes exist for this lead.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {unattachedNotes.map((note: any) => {
                const isAdmin = note.author?.role?.toUpperCase() === 'ADMIN';

                return (
                  <div key={note.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md flex flex-col">
                    <p className="text-sm text-gray-800 leading-relaxed">{note.content}</p>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                        isAdmin ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {note.author?.first_name || 'User'} ({isAdmin ? 'Admin' : 'Member'})
                      </span>
                      <span className="text-xs text-gray-400 font-medium">{new Date(note.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}