import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PublicForm from './pages/PublicForm';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TeamManagement from './pages/TeamManagement';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoutes'; // <-- Import the bouncer

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col font-sans bg-gray-50 text-gray-900">
          
          <Navbar />
          
          <main className="flex-grow flex flex-col">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PublicForm />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Protected Routes Wrapper */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/team" element={<TeamManagement />} />
              </Route>
            </Routes>
          </main>

          <footer className="bg-white border-t border-gray-100 text-gray-500 text-center py-6 text-sm mt-auto transition-colors">
            Built for <a href="https://digitalheroesco.com" className="text-gray-900 font-medium hover:underline transition-all">Digital Heroes Training Task</a>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;