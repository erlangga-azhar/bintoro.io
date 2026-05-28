import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, limit, getDocs } from 'firebase/firestore';

interface UserData {
  userId: string;
  name: string;
  avatar: string;
  completedNpcs: string[];
  inventory: string[];
  playTimeSeconds: number;
}

interface LeaderboardModalProps {
  onClose: () => void;
}

export default function LeaderboardModal({ onClose }: LeaderboardModalProps) {
  const [data, setData] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, "users"), limit(50));
        const querySnapshot = await getDocs(q);
        const users: UserData[] = [];
        querySnapshot.forEach((doc) => {
          users.push(doc.data() as UserData);
        });
        
        // Sort: completedNpcs descending, then inventory descending, then playTimeSeconds ascending
        users.sort((a, b) => {
            const aNpcs = a.completedNpcs?.length || 0;
            const bNpcs = b.completedNpcs?.length || 0;
            if (aNpcs !== bNpcs) return bNpcs - aNpcs;
            
            const aInv = a.inventory?.length || 0;
            const bInv = b.inventory?.length || 0;
            if (aInv !== bInv) return bInv - aInv;
            
            const aTime = a.playTimeSeconds || 0;
            const bTime = b.playTimeSeconds || 0;
            return aTime - bTime;
        });
        
        setData(users);
      } catch (err) {
        console.error("Error fetching leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatTime = (seconds: number) => {
    if (!seconds) return "--:--:--";
    return new Date(seconds * 1000).toISOString().substr(11, 8);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer transition-opacity" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/50 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700/50 bg-slate-800/80 backdrop-blur-xl">
          <h2 className="text-xl sm:text-2xl font-bold text-[#ffb77d] uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-500">trophy</span>
            Klasemen Pembangunan
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-b from-slate-900 to-[#0f172a]">
          {loading ? (
             <div className="flex justify-center py-10">
                <span className="material-symbols-outlined animate-spin text-orange-500 text-4xl">sync</span>
             </div>
          ) : (
             <div className="space-y-4">
                 {data.map((user, idx) => (
                    <div key={user.userId || idx} className="bg-slate-800/60 p-4 border border-slate-700 rounded-xl flex items-center gap-4">
                        <div className="text-2xl font-black w-8 text-center text-slate-500">
                           {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                        </div>
                        {user.avatar ? (
                           <img src={user.avatar} className="w-12 h-12 rounded object-cover border border-slate-600 shadow-md" alt={user.name} />
                        ) : (
                           <div className="w-12 h-12 bg-slate-700 rounded flex items-center justify-center font-bold text-slate-400">?</div>
                        )}
                        <div className="flex-1">
                            <h3 className="font-bold text-white tracking-wider flex items-center gap-2">
                               {user.name}
                               {user.inventory?.includes("Surya Majapahit") && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 rounded border border-amber-500/50">SELESAI</span>}
                            </h3>
                            <div className="flex gap-4 text-[10px] sm:text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono">
                                <span title="Jumlah Bantuan">🤝 {user.completedNpcs?.length || 0}/9</span>
                                <span title="Pusaka">🎒 {user.inventory?.length || 0}</span>
                                <span title="Waktu Main">⏱ {formatTime(user.playTimeSeconds)}</span>
                            </div>
                        </div>
                    </div>
                 ))}
                 {data.length === 0 && (
                     <div className="text-center py-10 text-slate-500 font-mono">Belum ada pengembara yang terdaftar.</div>
                 )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
