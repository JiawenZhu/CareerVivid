import React from 'react';
import { Shield, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AdminChoicePageProps {
  onSelectRoute: (choice: 'admin' | 'user') => void;
}

const AdminChoicePage: React.FC<AdminChoicePageProps> = ({ onSelectRoute }) => {
  const { currentUser, logOut } = useAuth();
  
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4">
        <div className="text-center">
            <Shield className="w-16 h-16 mx-auto text-primary-500" />
            <h1 className="text-3xl font-bold mt-4">Admin Access Detected</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2 mb-8">Welcome, {currentUser?.email}. Where would you like to go?</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-6">
            <button 
                onClick={() => onSelectRoute('admin')} 
                className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl hover:border-primary-500 border-2 border-transparent transition-all w-64 h-48"
            >
                <Shield className="w-12 h-12 text-primary-500 mb-3" />
                <span className="text-xl font-semibold">Admin Dashboard</span>
            </button>
            <button 
                onClick={() => onSelectRoute('user')} 
                className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl hover:border-indigo-500 border-2 border-transparent transition-all w-64 h-48"
            >
                <Users className="w-12 h-12 text-indigo-500 mb-3" />
                <span className="text-xl font-semibold">User Application</span>
            </button>
        </div>
        <button onClick={logOut} className="mt-12 text-sm text-gray-500 dark:text-gray-400 hover:underline">
            Sign out
        </button>
    </div>
  );
};

export default AdminChoicePage;
