import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Award, Trophy, User } from 'lucide-react';
import { getLeaderboard } from '../../services/socialService';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaders = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard();
      setLeaders(data);
    } catch (err) {
      toast.error('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaders();
  }, []);

  const topThree = leaders.slice(0, 3);
  const remaining = leaders.slice(3);

  const getPodiumColor = (index) => {
    switch (index) {
      case 0: return '#F7A84F'; // Gold/Amber
      case 1: return '#7B8DB0'; // Silver/Muted
      case 2: return '#B07B5B'; // Bronze
      default: return '#1A2540';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 30 }}>
        <h1 className="page-title">Leaderboard</h1>
        <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>Recognizing top sustainability champions in the organization</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>Loading Leaderboard...</div>
      ) : (
        <>
          {/* Podium */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 20, marginBottom: 40, padding: '0 20px' }}>
            {/* 2nd Place */}
            {topThree[1] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-card)', border: `3px solid ${getPodiumColor(1)}`, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                  <User size={30} style={{ color: 'var(--text-secondary)' }} />
                  <div style={{ position: 'absolute', bottom: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: getPodiumColor(1), display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#000' }}>2</div>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center' }}>{topThree[1].name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--emerald)', fontWeight: 600 }}>{topThree[1].xp} XP</div>
              </div>
            )}

            {/* 1st Place */}
            {topThree[0] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateY(-15px)' }}>
                <div style={{ position: 'relative', width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-card)', border: `4px solid ${getPodiumColor(0)}`, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                  <Trophy size={40} style={{ color: getPodiumColor(0) }} />
                  <div style={{ position: 'absolute', bottom: -6, right: -6, width: 24, height: 24, borderRadius: '50%', background: getPodiumColor(0), display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.85rem', fontWeight: 'bold', color: '#000' }}>1</div>
                </div>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.1rem', textAlign: 'center' }}>{topThree[0].name}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--emerald)', fontWeight: 700 }}>{topThree[0].xp} XP</div>
              </div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-card)', border: `3px solid ${getPodiumColor(2)}`, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                  <User size={30} style={{ color: 'var(--text-secondary)' }} />
                  <div style={{ position: 'absolute', bottom: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: getPodiumColor(2), display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#000' }}>3</div>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center' }}>{topThree[2].name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--emerald)', fontWeight: 600 }}>{topThree[2].xp} XP</div>
              </div>
            )}
          </div>

          {/* Ranking Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Rank</th>
                  <th>Employee Name</th>
                  <th>Department ID</th>
                  <th>Sustainability XP</th>
                  <th>Points Balance</th>
                </tr>
              </thead>
              <tbody>
                {remaining.map((user) => (
                  <tr key={user._id || user.id}>
                    <td style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>#{user.rank}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</td>
                    <td>{user.department_id || '—'}</td>
                    <td style={{ color: 'var(--emerald)', fontWeight: 600 }}>{user.xp} XP</td>
                    <td style={{ color: 'var(--blue)', fontWeight: 600 }}>{user.points} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;