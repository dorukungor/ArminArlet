'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref, onValue, set, get } from 'firebase/database';

interface Participant {
  [key: string]: boolean;
}

interface Vote {
  [key: string]: number;
}

interface Lobby {
  id: string;
  owner: string;
  participants: Participant;
  status: 'waiting' | 'voting' | 'finished';
  currentChocolate: number;
  votes?: {
    [chocolateIndex: number]: Vote;
  };
}

export default function LobbyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const lobbyId = params.id as string;
  const username = searchParams.get('username');

  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [vote, setVote] = useState<number>(1);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!username) {
      router.push('/');
      return;
    }

    const lobbyRef = ref(database, `lobbies/${lobbyId}`);
    const unsubscribe = onValue(lobbyRef, (snapshot) => {
      if (snapshot.exists()) {
        setLobby(snapshot.val());
      } else {
        setError('Lobi bulunamadı');
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [lobbyId, username, router]);

  const startVoting = async () => {
    if (lobby?.owner !== username) {
      setError('Sadece lobi sahibi oylama başlatabilir');
      return;
    }

    try {
      await set(ref(database, `lobbies/${lobbyId}/status`), 'voting');
    } catch (error) {
      setError('Oylama başlatılırken bir hata oluştu');
    }
  };

  const submitVote = async () => {
    if (!lobby || lobby.status !== 'voting') return;

    try {
      await set(
        ref(database, `lobbies/${lobbyId}/votes/${lobby.currentChocolate}/${username}`),
        vote
      );

      const lobbyRef = ref(database, `lobbies/${lobbyId}`);
      const snapshot = await get(lobbyRef);
      const currentLobby = snapshot.val() as Lobby;

      // Tüm oylar verildi mi kontrol et
      const currentVotes = currentLobby.votes?.[currentLobby.currentChocolate] || {};
      const allVoted = Object.keys(currentLobby.participants).every(
        (participant) => currentVotes[participant]
      );

      if (allVoted) {
        // Sonraki çikolataya geç veya oylamayı bitir
        if (currentLobby.currentChocolate >= 8) {
          await set(ref(database, `lobbies/${lobbyId}/status`), 'finished');
        } else {
          await set(
            ref(database, `lobbies/${lobbyId}/currentChocolate`),
            currentLobby.currentChocolate + 1
          );
        }
      }
    } catch (error) {
      setError('Oy verilirken bir hata oluştu');
    }
  };

  const hasVoted = () => {
    if (!lobby?.votes?.[lobby.currentChocolate]) return false;
    return !!lobby.votes[lobby.currentChocolate][username!];
  };

  const getResults = () => {
    if (!lobby?.votes) return [];

    const results = [];
    for (let i = 0; i <= lobby.currentChocolate; i++) {
      const votes = lobby.votes[i] || {};
      const total = Object.values(votes).reduce((sum, vote) => sum + vote, 0);
      const average = total / Object.keys(votes).length;
      const voterDetails = Object.entries(votes).map(([voter, vote]) => ({
        voter,
        vote: vote as number
      }));
      results.push({ 
        index: i + 1, 
        average,
        voterDetails: voterDetails.sort((a, b) => b.vote - a.vote)
      });
    }

    return results.sort((a, b) => b.average - a.average);
  };

  if (!lobby) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-medium text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5e6d3] flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl p-8">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-center text-[#4a332f] mb-4">
            Çikolata Değerlendirme Lobisi
          </h1>
          <p className="text-center text-[#4a332f] text-xl font-medium mt-2">Lobi ID: {lobbyId}</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 text-lg font-medium">
            {error}
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#4a332f] mb-4">Katılımcılar</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Object.keys(lobby.participants).map((participant) => (
              <li
                key={participant}
                className="bg-[#8b5e3c] text-white p-4 rounded-lg text-center text-lg font-medium shadow-md"
              >
                {participant} {participant === lobby.owner && '(Lobi Sahibi)'}
              </li>
            ))}
          </ul>
        </div>

        {lobby.status === 'waiting' && lobby.owner === username && (
          <button
            onClick={startVoting}
            className="w-full py-4 px-4 bg-[#8b5e3c] hover:bg-[#6d4a2f] text-white rounded-lg transition-colors font-medium text-xl shadow-md"
          >
            Oylamayı Başlat
          </button>
        )}

        {lobby.status === 'voting' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#4a332f] mb-4">
                Çikolata #{lobby.currentChocolate + 1}
              </h2>
              {!hasVoted() ? (
                <div className="mt-6">
                  <label className="block text-xl font-bold text-[#4a332f] mb-4">
                    Puanınız (1-5)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={vote}
                    onChange={(e) => setVote(Number(e.target.value))}
                    className="w-full h-4 mb-4"
                  />
                  <div className="text-4xl font-bold mt-4 text-[#4a332f]">{vote}</div>
                  <button
                    onClick={submitVote}
                    className="mt-6 py-4 px-6 bg-[#8b5e3c] hover:bg-[#6d4a2f] text-white rounded-lg transition-colors font-medium text-xl shadow-md"
                  >
                    Oyu Gönder
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-green-600 text-xl font-bold">Oyunuzu verdiniz!</p>
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#4a332f] mb-4">Bekleyen Oylar</h3>
              <ul className="space-y-3">
                {Object.keys(lobby.participants).map((participant) => {
                  const hasVoted = lobby.votes?.[lobby.currentChocolate]?.[participant];
                  return (
                    <li
                      key={participant}
                      className={`text-lg font-medium p-3 rounded-lg ${
                        hasVoted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {participant}: {hasVoted ? 'Oy verdi' : 'Bekliyor'}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {lobby.status === 'finished' && (
          <div>
            <h2 className="text-3xl font-bold text-[#4a332f] mb-6">Sonuçlar</h2>
            <div className="space-y-8">
              {getResults().map((result) => (
                <div key={result.index} className="bg-[#8b5e3c] text-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold">Çikolata #{result.index}</span>
                    <span className="text-3xl font-bold bg-white text-[#4a332f] px-4 py-2 rounded-lg">
                      {result.average.toFixed(1)} / 5
                    </span>
                  </div>
                  <div className="border-t border-white/20 pt-4">
                    <h3 className="text-lg font-bold mb-3">Verilen Oylar:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.voterDetails.map((detail) => (
                        <div 
                          key={detail.voter}
                          className="flex justify-between items-center bg-white/10 p-4 rounded-lg text-lg font-medium"
                        >
                          <span>{detail.voter}</span>
                          <span className="font-bold bg-white text-[#4a332f] px-3 py-1 rounded-lg">
                            {detail.vote} ★
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 