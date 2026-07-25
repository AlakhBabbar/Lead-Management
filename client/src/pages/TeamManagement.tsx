import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface PendingUser {
  id: string;
  first_name: string;
  email: string;
  role: string;
  is_verified: boolean;
}

export default function TeamManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); 
  const [sortBy, setSortBy] = useState('NEWEST'); 

  useEffect(() => {
    if (user?.role?.toUpperCase() !== 'ADMIN') {
      navigate('/dashboard', { replace: true });
      return; 
    }
    fetchPendingUsers();
  }, [user, navigate]);

  const fetchPendingUsers = async () => {
    try {
      const response = await api.get('/users/pending');
      setPendingUsers(response.data);
    } catch (err) {
      setError('Failed to load pending users.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      await api.put(`/users/${userId}/approve`);
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert('Failed to approve user. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // NEW: Handle deleting/rejecting a pending user request
  const handleReject = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to remove the request for ${userName}? This will delete the account permanently.`)) {
      return;
    }

    setProcessingId(userId);
    try {
      // Assuming your backend route to delete a user is DELETE /api/users/{id}
      await api.delete(`/users/${userId}`);
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert('Failed to remove user request. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    return pendingUsers
      .filter((u) => {
        const matchesSearch = 
          u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          u.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || u.role.toUpperCase() === roleFilter;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        if (sortBy === 'AZ') return a.first_name.localeCompare(b.first_name);
        if (sortBy === 'ZA') return b.first_name.localeCompare(a.first_name);
        return -1;
      });
  }, [pendingUsers, searchQuery, roleFilter, sortBy]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-light tracking-tight text-gray-900">Team Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and approve new team members requesting workspace access.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:bg-white focus:outline-none focus:border-gray-900 transition-all"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin Only</option>
            <option value="MEMBER">Member Only</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:bg-white focus:outline-none focus:border-gray-900 transition-all"
          >
            <option value="NEWEST">Sort: Newest First</option>
            <option value="OLDEST">Sort: Oldest First</option>
            <option value="AZ">Sort: A - Z</option>
            <option value="ZA">Sort: Z - A</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">{error}</div>
      ) : isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-white border border-gray-100 rounded-xl"></div>)}
        </div>
      ) : filteredAndSortedUsers.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <p className="text-gray-500 font-medium">No matching pending users found.</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter settings.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden divide-y divide-gray-100">
          {filteredAndSortedUsers.map((pendingUser) => (
            <div key={pendingUser.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-gray-900">{pendingUser.first_name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    pendingUser.role.toUpperCase() === 'ADMIN' 
                      ? 'bg-purple-50 text-purple-700 border-purple-200' 
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    {pendingUser.role} requested
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{pendingUser.email}</p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                    Awaiting Approval
                  </span>
                </div>
              </div>

              {/* Action Buttons Group */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleReject(pendingUser.id, pendingUser.first_name)}
                  disabled={processingId === pendingUser.id}
                  className="px-3 py-2 bg-white border border-gray-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 hover:border-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
                >
                  {processingId === pendingUser.id ? 'Processing...' : 'Remove'}
                </button>

                <button
                  onClick={() => handleApprove(pendingUser.id)}
                  disabled={processingId === pendingUser.id}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
                >
                  {processingId === pendingUser.id ? 'Processing...' : 'Approve Access'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}