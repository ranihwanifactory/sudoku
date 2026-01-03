
import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { ref, set, get } from 'firebase/database';
import { audio } from '../audio';

const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      const userRef = ref(db, `users/${user.uid}`);
      const snap = await get(userRef);
      if (!snap.exists()) {
        await set(userRef, {
          wins: 0,
          name: user.displayName || user.email?.split('@')[0],
          photo: user.photoURL,
          joinedAt: Date.now()
        });
      }
      audio.play('success');
    } catch (err: any) {
      setError("구글 로그인에 실패했어요. 다시 시도해주세요!");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await set(ref(db, `users/${res.user.uid}`), {
          wins: 0,
          name: email.split('@')[0],
          joinedAt: Date.now()
        });
      }
      audio.play('success');
    } catch (err: any) {
      setError(isLogin ? "이메일이나 비밀번호가 틀린 것 같아요!" : "이미 가입된 이메일이거나 형식이 맞지 않아요.");
      audio.play('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-in slide-in-from-bottom duration-700">
      <div className="bg-white p-8 md:p-12 rounded-[60px] shadow-2xl w-full max-w-md border-8 border-blue-100 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-yellow-300 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-pink-300 rounded-full opacity-30 animate-pulse"></div>

        <div className="text-center mb-10 relative">
          <div className="text-5xl mb-4 animate-bounce inline-block">🎲</div>
          <h1 className="text-5xl font-title text-blue-600 mb-3 tracking-tighter">바운시 스도쿠</h1>
          <p className="text-gray-500 font-bold text-lg font-kids italic">"가장 신나는 두뇌 놀이터!"</p>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full py-4 px-6 bg-white border-4 border-gray-100 hover:border-blue-400 rounded-[25px] shadow-md transition-all flex items-center justify-center gap-3 font-bold text-gray-700 mb-8 active:scale-95 group"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="google" className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          구글로 로그인하기
        </button>

        <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t-2 border-gray-100"></div>
            <span className="flex-shrink mx-4 text-gray-400 font-bold uppercase text-xs">또는 이메일</span>
            <div className="flex-grow border-t-2 border-gray-100"></div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <input 
            type="email" 
            placeholder="어린이 이메일 주소" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-400 outline-none transition-all font-bold placeholder:text-gray-300"
            required
          />
          <input 
            type="password" 
            placeholder="비밀번호" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-400 outline-none transition-all font-bold placeholder:text-gray-300"
            required
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-3xl shadow-xl font-title text-2xl border-b-4 border-blue-800 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? '입장 중...' : isLogin ? '게임 시작!' : '친구 되기!'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-500 font-bold hover:underline text-lg font-kids"
          >
            {isLogin ? "처음 왔나요? 회원가입하기" : "이미 회원이면? 로그인하기"}
          </button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-500 rounded-2xl text-sm font-bold border-2 border-red-100 text-center animate-shake">
            <i className="fa-solid fa-circle-exclamation mr-2"></i> {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
