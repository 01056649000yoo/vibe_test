import React from 'react';
import Button from '../common/Button';

/**
 * 역할: 선생님 대시보드 - 홈 탭 내용
 * props: 없음
 */
const TeacherHome = () => {
    return (
        <>
            <div style={{
                padding: '28px',
                background: 'var(--bg-primary)',
                borderRadius: '20px',
                marginBottom: '2.5rem',
                border: '2px dashed var(--primary-color)',
                textAlign: 'center'
            }}>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: 'var(--text-secondary)', margin: 0 }}>
                    오늘도 우리 반 친구들과 함께<br />
                    <strong>반짝이는 글쓰기 시간</strong>을 만들어봐요! 📚✨
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Button variant="secondary" style={{ height: '100px', flexDirection: 'column', width: '100%' }}>
                    <span style={{ fontSize: '1.5rem' }}>📝</span>
                    글쓰기 주제
                </Button>
                <Button variant="ghost" style={{ height: '100px', flexDirection: 'column', width: '100%' }} disabled>
                    <span style={{ fontSize: '1.5rem' }}>🏆</span>
                    우리 반 랭킹
                </Button>
            </div>
        </>
    );
};

export default TeacherHome;
