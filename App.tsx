
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { ref, set, push, update } from 'firebase/database';
import { auth, db } from './firebase';
import SudokuBoard from './components/SudokuBoard';
import AuthScreen from './components/AuthScreen';
import Lobby from './components/Lobby';
import Leaderboard from './components/Leaderboard';
import { Difficulty, generateBoard } from './sudokuLogic';
import { audio } from './audio';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'AUTH' | 'LOBBY' | 'SOLO' | 'MULTI' | 'LEADERBOARD'>('AUTH');
  const [gameId, setGameId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('EASY');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setView('LOBBY');
      } else {
        setUser(null);
        setView('AUTH');
      }
    });
    return unsub;
  }, []);

  const startSolo = (diff: Difficulty) => {
    setDifficulty(diff);
    setView('SOLO');
    audio.play('click');
  };

  const createRoom = async (diff: Difficulty) => {
    if (!user) return;
    const roomsRef = ref(db, 'rooms');
    const board = generateBoard(diff);
    const newRoomRef = push(roomsRef);
    const initialData = {
      id: newRoomRef.key,
      hostId: user.uid,
      hostName: user.displayName || user.email?.split('@')[0],
      difficulty: diff,
      board,
      status: 'WAITING',
      createdAt: Date.now(),
      participants: {
        [user.uid]: {
          name: user.displayName || user.email?.split('@')[0],
          progress: 0,
          ready: true
        }
      }
    };
    await set(newRoomRef, initialData);
    setGameId(newRoomRef.key);
    setDifficulty(diff);
    setView('MULTI');
    audio.play('click');
  };

  const joinRoom = async (id: string, diff: Difficulty) => {
    if (!user) return;
    await update(ref(db, `rooms/${id}/participants/${user.uid}`), {
      name: user.displayName || user.email?.split('@')[0],
      progress: 0,
      ready: true
    });
    setGameId(id);
    setDifficulty(diff);
    setView('MULTI');
    audio.play('click');
  };

  const handleLogout = () => {
    if(confirm("정말 로그아웃 할까요?")) {
      signOut(auth);
      audio.play('click');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* 상단 헤더 */}
      {user && (
        <div className="fixed top-4 left-4 right-4 flex justify-between items-center z-50">
          <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border-2 border-blue-200">
            <img 
              src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
              alt="avatar" 
              className="w-8 h-8 rounded-full border-2 border-white shadow-sm" 
            />
            <span className="font-bold text-blue-600 hidden sm:inline">{user.displayName || user.email?.split('@')[0]}님 반가워요!</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setView('LOBBY')} 
              className="bg-white hover:bg-blue-50 p-2 w-10 h-10 rounded-full shadow-md border-2 border-blue-400 text-blue-500 transition-all active:scale-95 flex items-center justify-center"
              title="홈으로"
            >
              <i className="fa-solid fa-house"></i>
            </button>
            <button 
              onClick={handleLogout} 
              className="bg-white hover:bg-red-50 p-2 w-10 h-10 rounded-full shadow-md border-2 border-red-400 text-red-500 transition-all active:scale-95 flex items-center justify-center"
              title="로그아웃"
            >
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      )}

      {/* 메인 화면 */}
      <main className="w-full max-w-4xl mt-12 mb-8">
        {view === 'AUTH' && <AuthScreen />}
        {view === 'LOBBY' && (
          <Lobby 
            onSolo={startSolo} 
            onCreateRoom={createRoom} 
            onJoinRoom={joinRoom}
            onViewLeaderboard={() => setView('LEADERBOARD')}
          />
        )}
        {view === 'SOLO' && (
          <SudokuBoard 
            difficulty={difficulty} 
            mode="SOLO" 
            onExit={() => setView('LOBBY')} 
          />
        )}
        {view === 'MULTI' && gameId && (
          <SudokuBoard 
            difficulty={difficulty} 
            mode="MULTI" 
            roomId={gameId} 
            onExit={() => {
              setGameId(null);
              setView('LOBBY');
            }} 
          />
        )}
        {view === 'LEADERBOARD' && (
          <Leaderboard onBack={() => setView('LOBBY')} />
        )}
      </main>

      {/* 배경 장식 */}
      <div className="fixed top-20 left-[10%] w-32 h-32 bg-yellow-200 rounded-full blur-3xl opacity-40 -z-10 animate-pulse"></div>
      <div className="fixed bottom-20 right-[10%] w-48 h-48 bg-blue-200 rounded-full blur-3xl opacity-40 -z-10 animate-pulse"></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-[0.03] -z-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
    </div>
  );
};

export default App;
