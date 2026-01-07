import React, { useState, Suspense, lazy } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import TeacherHome from './TeacherHome';
import { supabase } from '../../lib/supabaseClient';

// 지연 로딩 적용
const ClassManager = lazy(() => import('./ClassManager'));
const StudentManager = lazy(() => import('./StudentManager'));

/**
 * 역할: 선생님 메인 대시보드 (탭 네비게이션 포함)
 * props:
 *  - profile: 선생님 프로필 정보
 *  - session: Supabase 세션 정보
 *  - currentClassId: 현재 선택된 학급 ID
 *  - setCurrentClassId: 학급 ID 변경 함수
 */
const TeacherDashboard = ({ profile, session, currentClassId, setCurrentClassId }) => {
    const [currentTab, setCurrentTab] = useState('home'); // 'home', 'class', 'student'

    return (
        <Card style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--primary-color)',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <span>🍎 선생님 모드</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
                    로그아웃
                </Button>
            </div>

            <h1 style={{ fontSize: '2.2rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                안녕, <span style={{ color: 'var(--primary-color)' }}>{profile.full_name || '친구'}</span>님!
            </h1>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px' }}>
                {['home', 'class'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setCurrentTab(tab)}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: currentTab === tab ? 'white' : 'transparent',
                            color: currentTab === tab ? 'var(--primary-color)' : 'var(--text-secondary)',
                            fontWeight: 'bold', transition: 'all 0.2s'
                        }}
                    >
                        {tab === 'home' ? '🏠 홈' : '🏫 클래스'}
                    </button>
                ))}
            </div>

            <Suspense fallback={<div style={{ textAlign: 'center', padding: '20px' }}>불러오는 중...</div>}>
                {currentTab === 'home' && <TeacherHome />}

                {currentTab === 'class' && (
                    <div style={{ marginBottom: '24px' }}>
                        <ClassManager userId={session.user.id} onClassFound={(id) => setCurrentClassId(id)} />
                    </div>
                )}
            </Suspense>
        </Card>
    );
};

export default TeacherDashboard;
