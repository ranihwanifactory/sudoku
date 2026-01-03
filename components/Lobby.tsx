
import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { Difficulty } from '../sudokuLogic';
import { audio } from '../audio';

interface Props {
  onSolo: (diff: Difficulty) => void;
  onCreateRoom: (diff: Difficulty) => void;
  onJoinRoom: (id: string, diff: Difficulty) => void;
  onViewLeaderboard: () => void;
}

const Lobby: React.FC<Props> = ({ onSolo, onCreateRoom, onJoinRoom, onViewLeaderboard }) => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'SOLO' | 'MULTI'>('SOLO');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // PWA 설치 프롬프트 캡처
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    const roomsRef = ref(db, 'rooms');
    const unsub = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const activeRooms = Object.values(data)
          .filter((r: any) => r.status === 'WAITING' && r.createdAt > Date.now() - 3600000)
          .sort((a: any, b: any) => b.createdAt - a.createdAt);
        setRooms(activeRooms);
      } else {
        setRooms([]);
      }
    });
    return () => unsub();
  }, []);

  const installApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
    audio.play('pop');
  };

  const Card = ({ title, desc, icon, color, onClick }: any) => (
    <button 
      onClick={() => { audio.play('click'); onClick(); }}
      className={`group relative flex flex-col items-center justify-center p-8 bg-white rounded-[45px] shadow-xl border-4 ${color} transition-all duration-300 hover:-translate-y-3 active:scale-95`}
    >
      <div className={`text-6xl mb-6 group-hover:scale-125 transition-transform duration-300`}>{icon}</div>
      <h3 className="text-2xl font-title text-gray-800 mb-3">{title}</h3>
      <p className="text-gray-500 text-md font-bold font-kids">{desc}</p>
    </button>
  );

  return (
    <div className="flex flex-col items-center gap-8 animate-in fade-in duration-700 py-4">
      
      {/* PWA 설치 안내 버튼 (가능할 때만 표시) */}
      {deferredPrompt && (
        <button 
          onClick={installApp}
          className="shine-btn text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-3 transition-transform hover:scale-105 active:scale-95"
        >
          <i className="fa-solid fa-download"></i>
          폰에 앱 설치하기!
        </button>
      )}

      {/* 탭 전환기 */}
      <div className="flex bg-white/60 p-2 rounded-[30px] backdrop-blur-md shadow-lg border-2 border-white">
        <button 
          onClick={() => { setActiveTab('SOLO'); audio.play('pop'); }}
          className={`px-10 py-4 rounded-[25px] font-title text-xl transition-all ${activeTab === 'SOLO' ? 'bg-blue-500 text-white shadow-xl scale-105' : 'text-blue-500 hover:bg-blue-50'}`}
        >
          혼자 연습
        </button>
        <button 
          onClick={() => { setActiveTab('MULTI'); audio.play('pop'); }}
          className={`px-10 py-4 rounded-[25px] font-title text-xl transition-all ${activeTab === 'MULTI' ? 'bg-pink-500 text-white shadow-xl scale-105' : 'text-pink-500 hover:bg-pink-50'}`}
        >
          모두와 배틀
        </button>
      </div>

      {activeTab === 'SOLO' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-4xl px-4">
          <Card 
            title="쉬움 (새싹)" 
            desc="스도쿠가 처음이라면!" 
            icon="🌱" 
            color="border-green-100 hover:border-green-400" 
            onClick={() => onSolo('EASY')}
          />
          <Card 
            title="보통 (스타)" 
            desc="이제 조금 익숙해졌어!" 
            icon="🌟" 
            color="border-yellow-100 hover:border-yellow-400" 
            onClick={() => onSolo('MEDIUM')}
          />
          <Card 
            title="어려움 (브레인)" 
            desc="난 스도쿠 천재니까!" 
            icon="🧠" 
            color="border-red-100 hover:border-red-400" 
            onClick={() => onSolo('HARD')}
          />
        </div>
      ) : (
        <div className="w-full flex flex-col gap-8 max-w-4xl px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <button 
               onClick={() => onCreateRoom('EASY')}
               className="bg-gradient-to-br from-pink-400 to-pink-600 p-8 rounded-[45px] text-white shadow-2xl hover:shadow-pink-200 transition-all hover:-translate-y-2 active:scale-95 flex items-center justify-between group"
             >
               <div className="text-left">
                  <h3 className="text-3xl font-title mb-1">대결 방 만들기</h3>
                  <p className="font-bold opacity-90 text-lg font-kids">친구들을 초대해보세요!</p>
               </div>
               <div className="text-6xl group-hover:rotate-12 transition-transform">🎮</div>
             </button>
             <button 
               onClick={() => { audio.play('click'); onViewLeaderboard(); }}
               className="bg-gradient-to-br from-blue-400 to-blue-600 p-8 rounded-[45px] text-white shadow-2xl hover:shadow-blue-200 transition-all hover:-translate-y-2 active:scale-95 flex items-center justify-between group"
             >
               <div className="text-left">
                  <h3 className="text-3xl font-title mb-1">명예의 전당</h3>
                  <p className="font-bold opacity-90 text-lg font-kids">최고의 천재는 누구?</p>
               </div>
               <div className="text-6xl group-hover:scale-110 transition-transform">🏆</div>
             </button>
          </div>

          <div className="bg-white p-8 sm:p-12 rounded-[50px] shadow-2xl border-8 border-pink-50 min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-title text-gray-700 flex items-center gap-3">
                <span className="w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></span>
                실시간 대결 대기실
              </h3>
              <span className="bg-pink-100 text-pink-600 px-4 py-1 rounded-full text-sm font-bold">진행중: {rooms.length}</span>
            </div>
            {rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="text-7xl mb-6 opacity-30">😴</div>
                <p className="font-bold text-xl font-kids">지금은 조용하네요. 방을 먼저 만들어볼까요?</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rooms.map(room => (
                  <div key={room.id} className="p-6 bg-gray-50 rounded-[30px] border-4 border-gray-100 flex items-center justify-between hover:border-pink-300 hover:bg-white transition-all group">
                    <div>
                      <h4 className="font-bold text-gray-700 text-lg">{room.hostName}님의 방</h4>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md font-bold uppercase">{room.difficulty}</span>
                        <span className="text-xs text-gray-400 font-bold">방금 전</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => onJoinRoom(room.id, room.difficulty)}
                      className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-2xl font-title text-lg shadow-lg transition-all active:scale-90 group-hover:scale-105"
                    >
                      입장!
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Lobby;
