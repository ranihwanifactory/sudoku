
import React, { useState, useEffect } from 'react';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from '../firebase';

interface Props {
  onBack: () => void;
}

const Leaderboard: React.FC<Props> = ({ onBack }) => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = query(ref(db, 'users'), orderByChild('wins'), limitToLast(10));
    const unsub = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const sorted = Object.entries(data)
          .map(([id, val]: [string, any]) => ({ id, ...val }))
          .sort((a, b) => b.wins - a.wins);
        setLeaders(sorted);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto animate-in zoom-in duration-500 p-2">
      <div className="bg-white p-8 md:p-14 rounded-[60px] shadow-2xl border-8 border-yellow-100 relative overflow-hidden">
        <button 
          onClick={onBack}
          className="absolute top-10 left-10 text-gray-400 hover:text-blue-500 transition-all hover:scale-110 active:scale-90"
        >
          <i className="fa-solid fa-circle-arrow-left text-4xl"></i>
        </button>

        <div className="text-center mb-12">
          <div className="inline-block p-6 bg-yellow-100 rounded-[35px] mb-6 animate-bounce">
             <i className="fa-solid fa-crown text-6xl text-yellow-500 drop-shadow-md"></i>
          </div>
          <h2 className="text-5xl font-title text-blue-600 mb-3 tracking-tighter">최고의 천재 어린이</h2>
          <p className="text-gray-500 font-bold text-xl font-kids">우리 동네 스도쿠 대장은 누구일까요?</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-14 h-14 border-8 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-5">
            {leaders.length === 0 ? (
               <p className="text-center py-10 text-gray-400 font-bold">아직 랭킹이 없어요. 첫 번째 주인공이 되어보세요!</p>
            ) : (
              leaders.map((player, index) => (
                <div 
                  key={player.id}
                  className={`flex items-center gap-6 p-5 rounded-[30px] transition-all ${index === 0 ? 'bg-yellow-50 border-4 border-yellow-200 scale-105 shadow-xl' : 'bg-gray-50'}`}
                >
                  <div className={`w-12 h-12 flex items-center justify-center font-title text-3xl ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-400' : 'text-gray-300'}`}>
                    {index + 1}
                  </div>
                  <img 
                    src={player.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.id}`} 
                    alt="avatar" 
                    className="w-16 h-16 rounded-full border-4 border-white shadow-md"
                  />
                  <div className="flex-grow">
                    <h4 className="font-bold text-gray-800 text-xl">{player.name}</h4>
                    <p className="text-sm text-gray-400 font-bold font-kids text-lg">기록: {player.wins}승 무패!</p>
                  </div>
                  <div className="text-3xl font-title text-blue-500">
                    {player.wins} <span className="text-sm">승</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <button 
          onClick={onBack}
          className="w-full mt-14 py-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-[30px] shadow-2xl font-title text-2xl border-b-4 border-blue-800 transition-all active:scale-95"
        >
          로비로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default Leaderboard;
