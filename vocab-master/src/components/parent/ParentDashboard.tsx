import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '../common';
import { UserList } from './UserList';
import { UserDetailModal } from './UserDetailModal';
import { ApiService, type AdminUserStats } from '../../services/ApiService';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';

export function ParentDashboard() {
    const { setMode } = useApp();
    const { logout } = useAuth();
    const [users, setUsers] = useState<AdminUserStats[]>([]);
    const [selectedUser, setSelectedUser] = useState<AdminUserStats | null>(null);
    const [loading, setLoading] = useState(false);

    // Load users on mount
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await ApiService.getAdminUsers();
            setUsers(data);
        } catch (err) {
            console.error('Failed to load users', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        // AuthContext will handle redirect/state clearing
    };

    const handleBack = () => {
        setMode('dashboard');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <LayoutDashboard className="w-6 h-6 text-purple-600" />
                        <h1 className="text-xl font-bold text-gray-900">Parent Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={handleLogout} className="text-sm">
                            <LogOut className="w-4 h-4" />
                            Log Out
                        </Button>
                        <Button variant="outline" onClick={handleBack}>
                            Exit to App
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Student Overview</h2>
                        <p className="text-gray-500">Select a student to view detailed progress reports.</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        </div>
                    ) : (
                        <UserList
                            users={users}
                            onSelectUser={setSelectedUser}
                        />
                    )}
                </motion.div>
            </main>

            {/* Details Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <UserDetailModal
                        user={{ id: selectedUser.id, name: selectedUser.display_name || selectedUser.username }}
                        onClose={() => setSelectedUser(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
