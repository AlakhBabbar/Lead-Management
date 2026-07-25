import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import LeadSlideOver from '../components/LeadSlideOver'; // <-- Import

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST' | 'WON';
  created_at: string;
  notes: any[];
  activities: any[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State to control the Slide-over
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await api.get('/leads/');
      setLeads(response.data);
      
      // If a lead is currently selected, update its data so notes/logs refresh instantly
      if (selectedLead) {
        const updatedLead = response.data.find((l: Lead) => l.id === selectedLead.id);
        if (updatedLead) setSelectedLead(updatedLead);
      }
    } catch (err) {
      setError('Failed to load leads. Please try refreshing.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      NEW: 'bg-blue-50 text-blue-700 border-blue-200',
      CONTACTED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      QUALIFIED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      WON: 'bg-green-50 text-green-700 border-green-200',
      LOST: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[status as keyof typeof colors] || colors.NEW;
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* ... (Keep your existing Header, Loading, and Empty States the same) ... */}
        
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-light tracking-tight text-gray-900">Lead Pipeline</h1>
            <p className="mt-1 text-sm text-gray-500">
              {user?.role?.toUpperCase() === 'ADMIN' ? 'Viewing all company leads.' : 'Viewing your assigned leads.'}
            </p>
          </div>
        </div>

        {error ? (
          <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">{error}</div>
        ) : isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-white border border-gray-100 rounded-xl"></div>)}
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
            <p className="text-gray-500 font-medium">No leads found.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
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
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {/* UPDATE: Trigger the slide-over */}
                        <button 
                          onClick={() => setSelectedLead(lead)}
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
          </div>
        )}
      </div>

      {/* Mount the Slide-Over outside the table flow */}
      <LeadSlideOver 
        lead={selectedLead} 
        isOpen={!!selectedLead} 
        onClose={() => setSelectedLead(null)} 
        onUpdate={fetchLeads} 
      />
    </>
  );
}