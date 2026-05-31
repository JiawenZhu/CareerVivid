import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Medal, Search, Trophy, X } from 'lucide-react';

interface Player {
    id: string;
    name: string;
    score: number;
    isCurrentUser?: boolean;
}

interface GetMoreReviewLeaderboardModalProps {
    isOpen: boolean;
    leaderboard: Player[];
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onClose: () => void;
}

const GetMoreReviewLeaderboardModal: React.FC<GetMoreReviewLeaderboardModalProps> = ({
    isOpen,
    leaderboard,
    searchQuery,
    onSearchChange,
    onClose,
}) => {
    const filteredPlayers = leaderboard.filter(player => player.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col"
                >
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                        <div className="flex items-center gap-3">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>

                    <div className="p-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search players..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full bg-white/10 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="space-y-3 max-w-2xl mx-auto">
                            {filteredPlayers.map((player, index) => (
                                <motion.div
                                    key={player.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`flex items-center justify-between p-4 rounded-2xl border ${player.isCurrentUser
                                        ? 'bg-gradient-to-r from-pink-500/20 to-indigo-500/20 border-pink-500/50'
                                        : 'bg-white/5 border-white/5 hover:bg-white/10'} transition-colors`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 text-center font-bold text-xl text-white/50">
                                            {index === 0 ? <Crown className="w-8 h-8 text-yellow-400 mx-auto" /> :
                                                index === 1 ? <Medal className="w-7 h-7 text-gray-300 mx-auto" /> :
                                                    index === 2 ? <Medal className="w-7 h-7 text-amber-700 mx-auto" /> :
                                                        <span className="text-lg">#{index + 1}</span>}
                                        </div>
                                        <div>
                                            <p className={`text-lg ${player.isCurrentUser ? 'font-bold text-white' : 'font-medium text-gray-200'}`}>
                                                {player.name} {player.isCurrentUser && '(You)'}
                                            </p>
                                            {player.isCurrentUser && (
                                                <p className="text-xs text-pink-400 font-medium">That's you!</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xl font-mono font-bold text-pink-400 bg-pink-500/10 px-4 py-2 rounded-lg border border-pink-500/20">
                                        {player.score} ❤️
                                    </div>
                                </motion.div>
                            ))}
                            {filteredPlayers.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    No players found matching "{searchQuery}"
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GetMoreReviewLeaderboardModal;
