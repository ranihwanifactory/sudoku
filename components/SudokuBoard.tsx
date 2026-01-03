
import React, { useState, useEffect, useCallback } from 'react';
import { ref, onValue, update, increment } from 'firebase/database';
import { db, auth } from '../firebase';
import { Difficulty, generateBoard, calculateProgress, checkSolution } from '../sudokuLogic';
import { audio } from '../audio';
import { GoogleGenAI } from "@google/genai";

interface Props {
  difficulty: Difficulty;
  mode: 'SOLO' | 'MULTI';
  roomId?: string;
  onExit: () => void;
}

const SudokuBoard: React.FC<Props> = ({ difficulty, mode, roomId, onExit }) => {
  const [board, setBoard] = useState<number[][]>([]);
  const [initialBoard, setInitialBoard] = useState<boolean[][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [completed, setCompleted] = useState(false);
  const [opponents, setOpponents] = useState<any[]>([]);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  const diffLabels: Record<Difficulty, string> = {
    'EASY': '쉬움 (새싹)',
    'MEDIUM': '보통 (스타)',
    'HARD': '어려움 (브레인)'
  };

  useEffect(() => {
    if (mode === 'SOLO') {
      const newBoard = generateBoard(difficulty);
      setBoard(newBoard);
      setInitialBoard(newBoard.map(row => row.map(cell => cell !== 0)));
      setLoading(false);
    } else if (mode === 'MULTI' && roomId) {
      const roomRef = ref(db, `rooms/${roomId}`);
      const unsub = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          if (data.board && board.length === 0) {
            setBoard(data.board);
            setInitialBoard(data.board.map((row: number[]) => row.map((cell: number) => cell !== 0)));
            setLoading(false);
          }
          
          const parts = data.participants || {};
          const otherPlayers = Object.entries(parts)
            .filter(([uid]) => uid !== auth.currentUser?.uid)
            .map(([uid, p]: [string, any]) => ({ uid, ...p }));
          setOpponents(otherPlayers);

          if (data.winnerName) {
            setWinner(data.winnerName);
            setCompleted(true);
          }
        }
      });
      return () => unsub();
    }
  }, [mode, roomId, difficulty, board.length]);

  const updateCell = useCallback((r: number, c: number, val: number) => {
    if (initialBoard[r][c] || completed) return;
    
    const newBoard = board.map((row, ri) => row.map((cell, ci) => ri === r && ci === c ? val : cell));
    setBoard(newBoard);
    audio.play('click');

    const progress = calculateProgress(newBoard);
    
    if (mode === 'MULTI' && roomId && auth.currentUser) {
      update(ref(db, `rooms/${roomId}/participants/${auth.currentUser.uid}`), { progress });
    }

    if (progress === 100) {
      if (checkSolution(newBoard)) {
        handleWin();
      } else {
        audio.play('error');
      }
    }
  }, [board, initialBoard, completed, mode, roomId]);

  const handleWin = async () => {
    setCompleted(true);
    audio.play('win');
    
    if (auth.currentUser) {
      update(ref(db, `users/${auth.currentUser.uid}`), {
        wins: increment(1),
        lastPlayed: Date.now()
      });

      if (mode === 'MULTI' && roomId) {
        update(ref(db, `rooms/${roomId}`), {
          status: 'FINISHED',
          winnerId: auth.currentUser.uid,
          winnerName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0]
        });
      }
    }
  };

  const getGeminiHint = async () => {
    setAiHint("스도쿠 박사님이 생각 중이에요... 🤔");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `당신은 초등학생을 위한 친절한 스도쿠 박사입니다. 현재 판: ${JSON.stringify(board)} (0은 빈칸). 난이도: ${difficulty}. 
      초등학생 어린이에게 반말로 아주 친근하게 힌트를 하나만 주세요. 예를 들어 '어떤 줄을 봐봐, 3이 들어가야 할 것 같아!' 같은 느낌으로 짧고 격려하며 한국어로 답변해주세요.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setAiHint(response.text || "잘 하고 있어! 가로줄을 한 번 살펴볼래?");
    } catch (err) {
      setAiHint("박사님이 지금 간식을 드시러 갔나 봐요. 조금만 더 스스로 힘내봐!");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-80">
      <div className="w-16 h-16 border-8 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-6 font-bold text-blue-600 text-xl font-kids">문제를 신나게 만들고 있어요!</p>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center animate-in fade-in duration-500 p-2">
      <div className="bg-white p-4 sm:p-8 rounded-[40px] shadow-2xl border-8 border-blue-100 flex-1 w-full max-w-[600px]">
        <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-3xl font-title text-blue-600">스도쿠 <span className="text-pink-500">{diffLabels[difficulty]}</span></h2>
          <button 
            onClick={getGeminiHint} 
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-6 py-2 rounded-2xl text-lg font-bold flex items-center gap-2 border-2 border-yellow-300 transition-all hover:scale-105 active:scale-95"
          >
            <i className="fa-solid fa-lightbulb text-yellow-500"></i>
            박사님 힌트
          </button>
        </div>

        {/* 보드 그리드 */}
        <div className="grid grid-cols-9 gap-[2px] sm:gap-1 bg-blue-300 p-1 sm:p-2 rounded-2xl shadow-inner mx-auto sudoku-grid border-4 border-blue-400">
          {board.map((row, r) => (
            row.map((val, c) => (
              <div 
                key={`${r}-${c}`}
                onClick={() => setSelected([r, c])}
                className={`
                  aspect-square flex items-center justify-center text-lg sm:text-2xl font-title cursor-pointer transition-all duration-200
                  ${initialBoard[r][c] ? 'bg-blue-50 text-blue-900' : 'bg-white text-blue-500 hover:bg-yellow-50'}
                  ${selected?.[0] === r && selected?.[1] === c ? 'ring-4 ring-yellow-400 z-10 scale-105 rounded-lg bg-yellow-100' : ''}
                  ${(r + 1) % 3 === 0 && r < 8 ? 'mb-1 sm:mb-2' : ''}
                  ${(c + 1) % 3 === 0 && c < 8 ? 'mr-1 sm:mr-2' : ''}
                  rounded-sm sm:rounded-md
                `}
              >
                {val !== 0 ? val : ''}
              </div>
            ))
          ))}
        </div>

        {/* 숫자 패드 */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mt-8">
          {[1,2,3,4,5,6,7,8,9].map(num => (
            <button 
              key={num}
              onClick={() => selected && updateCell(selected[0], selected[1], num)}
              className="aspect-square flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-xl sm:rounded-2xl shadow-lg font-title text-xl active:scale-90 transition-transform border-b-4 border-blue-700"
            >
              {num}
            </button>
          ))}
          <button 
            onClick={() => selected && updateCell(selected[0], selected[1], 0)}
            className="aspect-square flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-500 rounded-xl sm:rounded-2xl shadow-md font-bold border-2 border-red-300 transition-all"
          >
            <i className="fa-solid fa-eraser"></i>
          </button>
        </div>
      </div>

      {/* 사이드 정보창 */}
      <div className="w-full lg:w-72 space-y-6">
        {mode === 'MULTI' && (
          <div className="bg-white p-6 rounded-[35px] shadow-xl border-4 border-pink-100 animate-in slide-in-from-right duration-500">
            <h3 className="text-xl font-title text-pink-500 mb-6 flex items-center gap-2">
              <i className="fa-solid fa-trophy"></i>
              실시간 대결 현황
            </h3>
            <div className="space-y-6">
               <div className="group">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-gray-600">나 (도전자)</span>
                    <span className="font-bold text-blue-500">{calculateProgress(board)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden border-2 border-blue-50 shadow-inner">
                    <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-full transition-all duration-500" style={{ width: `${calculateProgress(board)}%` }}></div>
                  </div>
               </div>
               {opponents.map(opp => (
                 <div key={opp.uid}>
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-gray-600">{opp.name}님</span>
                      <span className="font-bold text-pink-500">{opp.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden border-2 border-pink-50 shadow-inner">
                      <div className="bg-gradient-to-r from-pink-400 to-pink-600 h-full transition-all duration-500" style={{ width: `${opp.progress}%` }}></div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {aiHint && (
          <div className="bg-yellow-50 p-6 rounded-[35px] shadow-lg border-4 border-yellow-200 animate-bounce-subtle">
             <div className="flex items-center gap-2 mb-3">
                <div className="bg-yellow-400 text-white w-8 h-8 rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-robot text-xs"></i>
                </div>
                <span className="font-title text-yellow-700">박사님의 조언</span>
             </div>
             <p className="text-md text-yellow-800 font-bold leading-relaxed font-kids text-lg">{aiHint}</p>
          </div>
        )}

        <button 
          onClick={onExit}
          className="w-full py-4 bg-gray-400 hover:bg-gray-500 text-white rounded-[25px] shadow-lg font-bold transition-all flex items-center justify-center gap-2 border-b-4 border-gray-600 active:scale-95"
        >
          <i className="fa-solid fa-door-open"></i>
          그만하기 / 나가기
        </button>
      </div>

      {/* 승리 팝업 */}
      {completed && (
        <div className="fixed inset-0 bg-blue-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-hidden">
           <div className="bg-white p-10 rounded-[50px] shadow-2xl text-center max-w-sm border-8 border-yellow-400 animate-in zoom-in duration-300 relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-7xl">🥳</div>
              <h2 className="text-4xl font-title text-blue-600 mb-4 mt-4">대단해요!</h2>
              {winner ? (
                <p className="text-gray-700 font-bold mb-8 text-xl">
                  <span className="text-pink-500 font-black">{winner}</span>님이 <br/>먼저 문제를 풀었어요!
                </p>
              ) : (
                <p className="text-gray-700 font-bold mb-8 text-xl">문제를 완벽하게 풀었어요!<br/>역시 스도쿠 천재!</p>
              )}
              <button 
                onClick={onExit}
                className="w-full py-5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-3xl shadow-xl font-title text-2xl border-b-4 border-blue-800 transition-all active:scale-95"
              >
                확인
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default SudokuBoard;
