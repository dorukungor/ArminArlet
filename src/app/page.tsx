'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, set, get } from 'firebase/database';
import { useRouter } from 'next/navigation';

const generateLobbyId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState('');
  const [lobbyId, setLobbyId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f5e6d3] flex items-center justify-center">
        <div className="text-[#4a332f] text-xl">Yükleniyor...</div>
      </div>
    );
  }

  const createLobby = async () => {
    if (!username) {
      setErrorMessage('Lütfen bir kullanıcı adı girin');
      return;
    }

    try {
      const newLobbyId = generateLobbyId();
      const lobbyRef = ref(database, `lobbies/${newLobbyId}`);
      
      const snapshot = await get(lobbyRef);
      if (snapshot.exists()) {
        setErrorMessage('Lütfen tekrar deneyin');
        return;
      }
      
      await set(lobbyRef, {
        id: newLobbyId,
        owner: username,
        participants: {[username]: true},
        status: 'waiting',
        currentChocolate: 0,
      });

      router.push(`/lobby/${newLobbyId}?username=${username}`);
    } catch (err) {
      setErrorMessage('Lobi oluşturulurken bir hata oluştu');
    }
  };

  const handleLobbyIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    if (/^[A-Z0-9]*$/.test(value) && value.length <= 6) {
      setLobbyId(value);
    }
  };

  const joinLobby = async () => {
    if (!username) {
      setErrorMessage('Lütfen bir kullanıcı adı girin');
      return;
    }

    if (!lobbyId || lobbyId.length !== 6) {
      setErrorMessage('Lütfen 6 karakterli bir lobi ID&apos;si girin');
      return;
    }

    try {
      const lobbyRef = ref(database, `lobbies/${lobbyId}`);
      const snapshot = await get(lobbyRef);
      
      if (!snapshot.exists()) {
        setErrorMessage('Lobi bulunamadı');
        return;
      }

      const lobbyData = snapshot.val();
      
      if (lobbyData.participants[username]) {
        setErrorMessage('Bu kullanıcı adı zaten kullanılıyor');
        return;
      }

      await set(ref(database, `lobbies/${lobbyId}/participants/${username}`), true);
      router.push(`/lobby/${lobbyId}?username=${username}`);
    } catch (err) {
      setErrorMessage('Lobiye katılırken bir hata oluştu');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5e6d3] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        <h1 className="text-5xl font-bold text-center text-[#4a332f] mb-4">
          Çikolata Değerlendirme
        </h1>
        <p className="text-center text-gray-600 mb-8 text-lg">
          Abilerim Ablalarım Şimdiden Afiyet Olsun
        </p>
        
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 text-lg">
            {errorMessage}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-lg font-bold text-[#4a332f] mb-2">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-4 rounded-lg bg-white border-2 border-[#8b5e3c] focus:ring-2 focus:ring-[#8b5e3c] focus:border-transparent transition-colors text-lg font-medium text-[#4a332f] shadow-sm"
              placeholder="Kullanıcı adınızı girin"
            />
          </div>

          <button
            onClick={createLobby}
            className="w-full py-4 px-4 bg-[#8b5e3c] hover:bg-[#6d4a2f] text-white rounded-lg transition-colors font-medium text-lg shadow-md"
          >
            Yeni Lobi Oluştur
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-[#8b5e3c]" />
            </div>
            <div className="relative flex justify-center text-base">
              <span className="px-4 bg-white text-[#4a332f] font-medium">veya</span>
            </div>
          </div>

          <div>
            <label htmlFor="lobbyId" className="block text-lg font-bold text-[#4a332f] mb-2">
              Lobi ID&apos;si
            </label>
            <input
              type="text"
              id="lobbyId"
              value={lobbyId}
              onChange={handleLobbyIdChange}
              maxLength={6}
              className="w-full px-4 py-4 rounded-lg bg-white border-2 border-[#8b5e3c] focus:ring-2 focus:ring-[#8b5e3c] focus:border-transparent transition-colors text-lg font-medium text-[#4a332f] shadow-sm"
              placeholder="6 karakterli kod"
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <button
            onClick={joinLobby}
            className="w-full py-4 px-4 bg-[#e3c4a8] hover:bg-[#d4b094] text-[#4a332f] rounded-lg transition-colors font-medium text-lg"
          >
            Lobiye Katıl
          </button>
        </div>
      </div>
    </div>
  );
}
