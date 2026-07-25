import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('MEMBER'); // Default to member
  
  // Real-time validation states
  const [passwordError, setPasswordError] = useState('');
  const [apiError, setApiError] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Real-time password validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    
    if (val.length === 0) {
      setPasswordError('');
    } else if (val.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
    } else if (!/(?=.*[A-Z])/.test(val)) {
      setPasswordError('Password must contain at least one uppercase letter.');
    } else if (!/(?=.*[0-9])/.test(val)) {
      setPasswordError('Password must contain at least one number.');
    } else {
      setPasswordError('');
    }
  };

  const isFormValid = firstName.trim() !== '' && email.trim() !== '' && password.length >= 8 && passwordError === '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setApiError('');

    try {
      await api.post('/auth/signup', { 
        first_name: firstName.trim(), 
        email: email.trim().toLowerCase(), 
        password,
        role // Include the selected role in the request
      });
      setIsSuccess(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      
      if (Array.isArray(detail)) {
        const messages = detail.map((errObj: any) => errObj.msg).join(' | ');
        setApiError(`Validation Error: ${messages}`);
      } else if (typeof detail === 'string') {
        setApiError(detail);
      } else {
        setApiError('Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 transition-all">
        
        {isSuccess ? (
          <div className="text-center transform transition-all duration-500 ease-out">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-light tracking-tight text-gray-900 mb-2">Request Submitted</h2>
            <p className="text-sm text-gray-500 mb-6">
              Your account has been created, but it requires administrator approval before you can access the workspace.
            </p>
            <Link 
              to="/login"
              className="text-sm font-medium text-gray-900 hover:text-gray-700 underline underline-offset-4 transition-colors"
            >
              Return to login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-3xl font-light tracking-tight text-gray-900">Join the team</h2>
              <p className="mt-2 text-sm text-gray-500">Create an account to access the workspace</p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
              {apiError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 transition-all">
                  {apiError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:bg-white focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-300 ease-out"
                    placeholder="Alex"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:bg-white focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-300 ease-out"
                    placeholder="alex@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={handlePasswordChange}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-lg text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-1 transition-all duration-300 ease-out ${
                      passwordError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-gray-900 focus:ring-gray-900'
                    }`}
                    placeholder="••••••••"
                  />
                  {passwordError && (
                    <p className="mt-1.5 text-xs text-red-500 transition-all duration-300">
                      {passwordError}
                    </p>
                  )}
                </div>

                {/* NEW: Role Selection Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:bg-white focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-300 ease-out"
                  >
                    <option value="member">Team Member</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className="w-full py-3 px-4 rounded-lg text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 active:scale-[0.98]"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-gray-900 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}