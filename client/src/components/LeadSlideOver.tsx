import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface LeadSlideOverProps {
  lead: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface TeamMember {
  id: string;
  first_name: string;
  email: string;
}

export default function LeadSlideOver({ lead, isOpen, onClose, onUpdate }: LeadSlideOverProps) {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch verified team members when the drawer opens (Admin only feature)
  useEffect(() => {
    if (isOpen && user?.role?.toUpperCase() === 'ADMIN') {
      fetchTeamMembers();
    }
  }, [isOpen, user]);

  const fetchTeamMembers = async () => {
    try {
      // Assuming you have an endpoint to list verified team members, e.g. GET /api/users/verified
      const res = await api.get('/users/approved');
      setTeamMembers(res.data);
    } catch (err) {
      console.error('Failed to load team members for assignment', err);
    }
  };

  if (!isOpen || !lead) return null;

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsUpdating(true);
    try {
      await api.put(`/leads/${lead.id}`, { status: e.target.value });
      onUpdate();
    } catch (error) {
      console.error('Failed to update status', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssigneeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsUpdating(true);
    try {
      // Assuming your backend update route accepts assigned_to_id
      await api.put(`/leads/${lead.id}`, { assigned_to_id: e.target.value || null });
      onUpdate();
    } catch (error) {
      console.error('Failed to update assignee', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    setIsSubmittingNote(true);
    try {
      await api.post(`/leads/${lead.id}/notes`, { content: newNote });
      setNewNote('');
      onUpdate();
    } catch (error) {
      console.error('Failed to add note', error);
    } finally {
      setIsSubmittingNote(false);
    }
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
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Quick Controls: Status & Assignment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Status
                </label>
                <select
                  value={lead.status}
                  onChange={handleStatusChange}
                  disabled={isUpdating}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all disabled:opacity-50"
                >
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="LOST">Lost</option>
                  <option value="WON">Won</option>
                </select>
              </div>

              {/* Admin-only Assignment Control */}
              {user?.role?.toUpperCase() === 'ADMIN' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Assignee
                  </label>
                  <select
                    value={lead.assigned_to_id || ''}
                    onChange={handleAssigneeChange}
                    disabled={isUpdating}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all disabled:opacity-50"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.first_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Contact Details */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Contact Details
              </label>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                <div>
                  <span className="text-xs text-gray-500 block mb-0.5">Email</span>
                  <a href={`mailto:${lead.email}`} className="text-sm text-blue-600 hover:underline">{lead.email}</a>
                </div>
                {lead.phone && (
                  <div>
                    <span className="text-xs text-gray-500 block mb-0.5">Phone</span>
                    <span className="text-sm text-gray-900">{lead.phone}</span>
                  </div>
                )}
                {lead.message && (
                  <div>
                    <span className="text-xs text-gray-500 block mb-0.5">Initial Message</span>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.message}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Internal Notes
              </label>
              <form onSubmit={handleAddNote} className="mb-4">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 resize-none transition-all"
                  rows={2}
                  required
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingNote}
                    className="px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmittingNote ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {lead.notes?.map((note: any) => (
                  <div key={note.id} className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <p className="text-sm text-gray-800">{note.content}</p>
                    <span className="text-xs text-gray-400 mt-2 block">{new Date(note.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}