import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 앱 실행 시 현재 로그인 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      setLoading(false)
    })

    // 로그인 상태 변화를 감지 (로그인/로그아웃 시 자동 실행)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // DB에서 사용자 프로필 정보 가져오기
  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  // 역할을 'TEACHER'로 저장하는 함수
  const handleTeacherStart = async () => {
    if (!session) return

    // upsert를 사용하여 데이터가 없으면 넣고, 있으면 업데이트합니다.
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        role: 'TEACHER',
        email: session.user.email,
        full_name: session.user.user_metadata.full_name
      })

    if (!error) fetchProfile(session.user.id)
    else alert('역할 저장 중 오류가 발생했습니다: ' + error.message)
  }

  if (loading) return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>
      <h2>로딩 중...</h2>
    </div>
  )

  return (
    <div className="container">
      {!session ? (
        /* [조건 1] 로그인이 안 된 경우: 로그인 화면 */
        <div className="card">
          <h1>✍️ 끄적끄적 아지트</h1>
          <p>학급 글쓰기 플랫폼에 오신 것을 환영합니다.</p>
          <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })} style={{ marginTop: '20px', background: '#db4437' }}>
            구글로 로그인하기
          </button>
        </div>
      ) : !profile ? (
        /* [조건 2] 로그인은 됐지만 프로필이 없는 경우: 역할 선택 */
        <div className="card">
          <h2>환영합니다! 처음 오셨군요.</h2>
          <p style={{ color: '#94a3b8' }}>{session.user.email} 계정으로 접속 중</p>
          <p style={{ marginTop: '10px' }}>어떤 역할로 시작하시겠어요?</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
            <button onClick={handleTeacherStart} style={{ background: '#2563eb', padding: '10px 20px' }}>
              선생님으로 시작하기
            </button>
            <button style={{ background: '#7c3aed', padding: '10px 20px', opacity: 0.7 }}>
              학생으로 시작하기 (준비 중)
            </button>
          </div>
          <button onClick={() => supabase.auth.signOut()} style={{ marginTop: '20px', background: 'transparent', color: '#94a3b8', fontSize: '0.9rem' }}>
            로그아웃
          </button>
        </div>
      ) : (
        /* [조건 3] 프로필까지 있는 경우: 대시보드 */
        <div className="card">
          <h1>👩‍🏫 {profile.role === 'TEACHER' ? '교사' : '학생'} 대시보드</h1>
          <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>안녕하세요, <strong>{profile.full_name || '사용자'}</strong>님!</p>
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '20px' }}>
            <p>오늘도 우리 학급의 즐거운 글쓰기 시간을 만들어보세요.</p>
          </div>
          <button onClick={() => supabase.auth.signOut()} style={{ background: '#475569' }}>
            로그아웃
          </button>
        </div>
      )}
    </div>
  )
}

export default App
