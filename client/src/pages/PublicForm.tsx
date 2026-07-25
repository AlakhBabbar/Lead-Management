import { useState } from 'react';
import api from '../api/axios';

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

export default function PublicForm() {
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      await api.post('/leads/public', formData);
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', company: '', message: '' });
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.response?.data?.detail || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-xl bg-white p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 transition-all">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-light tracking-tight text-gray-900">Get in touch</h2>
          <p className="mt-2 text-sm text-gray-500">
            Tell us about your needs and our team will get back to you shortly.
          </p>
        </div>
        
        {status === 'success' ? (
          <div className="p-6 mb-4 bg-green-50 rounded-xl border border-green-100 text-center transform transition-all duration-500 ease-out">
            <h3 className="text-lg font-medium text-green-900 mb-2">Inquiry Submitted</h3>
            <p className="text-sm text-green-700">
              Thank you for reaching out! We have received your message and will contact you soon.
            </p>
            <button 
              onClick={() => setStatus('idle')}
              className="mt-6 text-sm font-medium text-green-800 hover:text-green-900 underline underline-offset-2 transition-colors"
            >
              Submit another inquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {status === 'error' && (
              <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 transition-all">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  value={formData.name} 
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:bg-white focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-300 ease-out"
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  value={formData.email} 
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:bg-white focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-300 ease-out"
                  placeholder="jane@company.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:bg-white focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-300 ease-out"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input 
                  type="text" 
                  name="company" 
                  value={formData.company} 
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:bg-white focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-300 ease-out"
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">How can we help? *</label>
              <textarea 
                name="message" 
                required
                rows={4} 
                value={formData.message} 
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:bg-white focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-300 ease-out resize-none"
                placeholder="Tell us about your project or requirements..."
              />
            </div>

            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="w-full py-3 px-4 rounded-lg text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 active:scale-[0.98] mt-2"
            >
              {status === 'loading' ? 'Sending...' : 'Submit Inquiry'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}