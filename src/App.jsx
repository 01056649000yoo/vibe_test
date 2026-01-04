import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log("인증 정보 확인 중...");

        if (!supabase) {
          throw new Error(".env 파일에 Supabase 설정이 비어있거나 잘못되었습니다.");
        }

        // 세션 정보 가져오기 시도
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError) throw authError;

        setSession(session);
        if (session) {
          console.log("로그인 세션 발견:", session.user.email);
          await fetchProfile(session.user.id);
        }
      } catch (e) {
        console.error("인증 과정에서 에러 발생:", e.message);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    if (!supabase) return;

    // 로그인 상태가 바뀌면(로그인/로그아웃) 자동으로 감지하여 세션을 업데이트합니다.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("인증 상태 변경 감지:", _event, session?.user?.email);
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 사용자의 프로필(role)을 가져오는 함수
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.log('프로필이 아직 없습니다. 새로 생성해야 합니다.');
      } else {
        setProfile(data)
      }
    } catch (e) {
      console.error("프로필 로드 에러:", e.message);
    }
  }

  const handleRoleSelect = async (selectedRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: session.user.id,
          email: session.user.email,
          role: selectedRole,
          full_name: session.user.user_metadata.full_name || '사용자'
        })

      if (error) throw error
      fetchProfile(session.user.id)
    } catch (error) {
      alert('역할 저장 중 오류가 발생했습니다: ' + error.message)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })
      if (error) throw error
    } catch (e) {
      alert("로그인 창을 여는 중 에러가 발생했습니다: " + e.message)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>
      <h2>데이터를 불러오는 중입니다...</h2>
    </div>
  )

  if (error) return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'red', textAlign: 'center' }}>
      <h2>에러가 발생했습니다 😢</h2>
      <p>{error}</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: '20px' }}>다시 시도</button>
    </div>
  )

  return (
    <div className="container">
      {!session ? (
        <div className="card">
          <h1>✍️ 끄적끄적 아지트</h1>
          <p>학급 글쓰기 플랫폼에 오신 것을 환영합니다.</p>
          <button onClick={handleGoogleLogin} style={{ marginTop: '20px', background: '#db4437' }}>
            구글로 로그인하기
          </button>
        </div>
      ) : (
        <div className="card">
          <h2>환영합니다!</h2>
          <p style={{ color: '#94a3b8' }}>{session.user.email} 계정으로 접속 중</p>

          <div style={{ margin: '20px 0', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
            {profile ? (
              <p>현재 역할: <strong>{profile.role === 'TEACHER' ? '👩‍🏫 선생님' : '🧑‍🎓 학생'}</strong></p>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p>👋 첫 방문을 환영합니다!</p>
                <p style={{ fontSize: '0.9rem', marginBottom: '15px' }}>본인의 역할을 선택해주세요.</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={() => handleRoleSelect('TEACHER')} style={{ background: '#2563eb', padding: '10px 20px' }}>👩‍🏫 선생님</button>
                  <button onClick={() => handleRoleSelect('STUDENT')} style={{ background: '#7c3aed', padding: '10px 20px' }}>🧑‍🎓 학생</button>
                </div>
              </div>
            )}
          </div>

          <button onClick={handleLogout} style={{ background: '#475569' }}>로그아웃</button>
        </div>
      )}
    </div>
  )
}

export default App
