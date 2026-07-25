import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import LeadSlideOver from '../components/LeadSlideOver';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'lost' | 'won';
  created_at: string;
  assigned_to: string | null;
  notes: any[];
  activities: any[];
}

export default function Dashboard() {
  const { user } = useAuth();
  
  // Data States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // URL Params mapping
  const [searchParams, setSearchParams] = useSearchParams();
  
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const limitParam = parseInt(searchParams.get('limit') || '25', 10);
  const searchQuery = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || 'ALL';
  const sortBy = searchParams.get('sort') || 'NEWEST';
  const leadIdParam = searchParams.get('lead');

  // Local state for debounced search input
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Smart URL updater: if you change a filter, it automatically resets you to page 1
  const updateParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    
    let isFilterChange = false;

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'page' && key !== 'lead') isFilterChange = true;
      if (!value || value === 'ALL') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });

    if (isFilterChange) newParams.set('page', '1');
    
    setSearchParams(newParams);
  };

  // Search Debouncer: waits 300ms after you stop typing before updating the URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        updateParams({ search: searchInput || null });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, searchQuery]);

  // Main Backend Fetch triggered anytime URL params change
  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/leads/', {
        params: {
          page: pageParam,
          limit: limitParam,
          search: searchQuery || undefined,
          status: statusFilter !== 'ALL' ? statusFilter.toLowerCase() : undefined,
          sort: sortBy
        }
      });
      // Backend now returns { data: [...], total, page, ... }
      setLeads(response.data.data);
      setPagination({
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        totalPages: response.data.total_pages
      });
    } catch (err: any) {
      if (err.response?.status !== 401) {
        setError('Failed to load leads. Please try refreshing.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [pageParam, limitParam, searchQuery, statusFilter, sortBy]);

  const selectedLead = useMemo(() => {
    if (!leadIdParam) return null;
    return leads.find(l => l.id === leadIdParam) || null;
  }, [leadIdParam, leads]);

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

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-light tracking-tight text-gray-900">Lead Pipeline</h1>
            <p className="mt-1 text-sm text-gray-500">
              {user?.role?.toUpperCase() === 'ADMIN' ? 'Viewing all company leads.' : 'Viewing your assigned leads.'}
            </p>
          </div>
        </div>

        {/* --- Toolbar: Search, Filter, Sort --- */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] mb-6 flex flex-col md:flex-row gap-4 justify-between items-center transition-all">
          
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search leads or companies..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => updateParams({ status: e.target.value })}
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:bg-white focus:outline-none focus:border-gray-900 transition-all appearance-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
            </div>

            <div className="relative w-full md:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ArrowUpDown className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={sortBy}
                onChange={(e) => updateParams({ sort: e.target.value })}
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:bg-white focus:outline-none focus:border-gray-900 transition-all appearance-none cursor-pointer"
              >
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="AZ">A - Z</option>
                <option value="ZA">Z - A</option>
              </select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">{error}</div>
        ) : isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-white border border-gray-100 rounded-xl"></div>)}
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex-grow flex flex-col items-center justify-center">
            <p className="text-gray-500 font-medium">No leads match your criteria.</p>
            <button 
              onClick={() => { setSearchInput(''); updateParams({ search: null, status: null }); }}
              className="mt-2 text-sm text-gray-900 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col flex-grow overflow-hidden">
            <div className="overflow-x-auto flex-grow">
              <table className="min-w-full divide-y divide-gray-100 h-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Received</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                        <div className="text-sm text-gray-500">{lead.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{lead.company || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => updateParams({ lead: lead.id })}
                          className="text-gray-600 hover:text-gray-900 font-medium underline underline-offset-2 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* --- SERVER-SIDE PAGINATION CONTROLS --- */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/80 gap-4 sm:gap-0 mt-auto">
              
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 font-medium">Rows per page:</span>
                <select 
                  value={pagination.limit} 
                  onChange={(e) => updateParams({ limit: e.target.value })}
                  className="bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-lg py-1.5 px-3 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 shadow-sm cursor-pointer"
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              
              <div className="flex items-center gap-6">
                <span className="text-sm text-gray-500 font-medium">
                  Page <span className="text-gray-900">{pagination.page}</span> of <span className="text-gray-900">{pagination.totalPages || 1}</span> 
                  <span className="ml-1 text-gray-400">({pagination.total} total)</span>
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button 
                    disabled={pagination.page <= 1}
                    onClick={() => updateParams({ page: (pagination.page - 1).toString() })}
                    className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button 
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => updateParams({ page: (pagination.page + 1).toString() })}
                    className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      <LeadSlideOver 
        lead={selectedLead} 
        isOpen={!!selectedLead} 
        onClose={() => updateParams({ lead: null })} 
        onUpdate={fetchLeads} 
      />
    </>
  );
}