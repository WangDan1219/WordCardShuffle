import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Activity, BookOpen, Clock } from 'lucide-react';
import { Button, Card } from '../common';
import { TrendChart } from './TrendChart';
import { WeakWordsTable } from './WeakWordsTable';
import { ApiService, type AdminUserDetails } from '../../services/ApiService';

interface UserDetailModalProps {
    user: { id: number; name: string };
    onClose: () => void;
}

export function UserDetailModal({ user, onClose }: UserDetailModalProps) {
    const [details, setDetails] = useState<AdminUserDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await ApiService.getAdminUserDetails(user.id);
                console.log('Fetched details:', data);
                setDetails(data);
            } catch (err) {
                console.error('Failed to load user details:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [user.id]);

    if (!user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{user.name}'s Progress</h2>
                        <p className="text-sm text-gray-500">Detailed learning report</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        </div>
                    ) : details ? (
                        <div className="space-y-6">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatusCard
                                    icon={BookOpen}
                                    label="Total Quizzes"
                                    value={details.quizHistory.length.toString()}
                                    color="text-blue-600"
                                    bg="bg-blue-50"
                                />
                                <StatusCard
                                    icon={Activity}
                                    label="Avg Score"
                                    value={`${Math.round(
                                        details.quizHistory.reduce((acc: number, curr: any) => acc + curr.score, 0) /
                                        (details.quizHistory.length || 1)
                                    )}%`}
                                    color="text-green-600"
                                    bg="bg-green-50"
                                />
                                <StatusCard
                                    icon={Clock}
                                    label="Study Sessions"
                                    value={details.studyHistory.length.toString()}
                                    color="text-orange-600"
                                    bg="bg-orange-50"
                                />
                                <StatusCard
                                    icon={Calendar}
                                    label="Words Reviewed"
                                    value={details.studyHistory.reduce((acc: number, curr: any) => acc + curr.words_reviewed, 0).toString()}
                                    color="text-purple-600"
                                    bg="bg-purple-50"
                                />
                            </div>

                            {/* Graphical Analysis */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card variant="default" padding="md">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Quiz Performance Trend</h3>
                                    <TrendChart
                                        data={details.quizHistory.slice().reverse()}
                                        dataKey="score"
                                        xAxisKey="completed_at"
                                        name="Score (%)"
                                        color="#8884d8"
                                    />
                                </Card>

                                <Card variant="default" padding="md">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Daily Study Effort</h3>
                                    <TrendChart
                                        data={details.studyHistory.slice().reverse()}
                                        dataKey="words_reviewed"
                                        xAxisKey="start_time"
                                        name="Words Reviewed"
                                        color="#82ca9d"
                                    />
                                </Card>
                            </div>

                            {/* Weak Words */}
                            <Card variant="default" padding="md">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Concepts Needing Practice</h3>
                                <WeakWordsTable words={details.weakWords} />
                            </Card>

                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">Failed to load data</div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
                    <Button variant="ghost" onClick={onClose}>Close Report</Button>
                </div>
            </motion.div>
        </div>
    );
}

function StatusCard({ icon: Icon, label, value, color, bg }: any) {
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${bg}`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
                <p className="text-xs text-gray-500 font-medium uppercase">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}
