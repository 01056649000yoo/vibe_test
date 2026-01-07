import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';

/**
 * 역할: 학생 메인 대시보드
 * props:
 *  - studentSession: 학생 세션 정보 (id, name, className 등)
 *  - onLogout: 로그아웃 처리 함수
 */
const StudentDashboard = ({ studentSession, onLogout }) => {
    return (
        <Card style={{ maxWidth: '600px', background: '#FFFDF7', border: '2px solid #FFE082' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div style={{
                    background: '#FFE082',
                    color: '#795548',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    🎒 {studentSession.className || '우리 반'} 친구
                </div>
                <Button variant="ghost" size="sm" onClick={onLogout}>
                    로그아웃 🚪
                </Button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🌟</div>
                <h1 style={{ fontSize: '2.4rem', color: '#5D4037', marginBottom: '0.5rem' }}>
                    안녕, <span style={{ color: '#FBC02D' }}>{studentSession.name}</span>!
                </h1>
                <p style={{ color: '#8D6E63', fontSize: '1.1rem' }}>어서와요, 오늘 어떤 이야기를 들려줄 건가요?</p>
            </div>

            {/* 주요 활동 메뉴 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div
                    style={{
                        background: 'white', padding: '24px', borderRadius: '24px', border: '2px solid #FFE082',
                        textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: '0 4px 6px rgba(255, 224, 130, 0.2)'
                    }}
                    onClick={() => alert('선생님이 내주신 주제를 보러 가요! 📝')}
                >
                    <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📝</div>
                    <h3 style={{ margin: 0, color: '#5D4037' }}>글쓰기 미션</h3>
                    <p style={{ fontSize: '0.85rem', color: '#9E9E9E', marginTop: '8px' }}>선생님의 주제 확인</p>
                </div>

                <div
                    style={{
                        background: 'white', padding: '24px', borderRadius: '24px', border: '2px solid #FFE082',
                        textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: '0 4px 6px rgba(255, 224, 130, 0.2)'
                    }}
                    onClick={() => alert('친구들의 글을 구경하러 가요! 👀')}
                >
                    <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>👀</div>
                    <h3 style={{ margin: 0, color: '#5D4037' }}>친구 아지트</h3>
                    <p style={{ fontSize: '0.85rem', color: '#9E9E9E', marginTop: '8px' }}>친구들의 글 읽기</p>
                </div>
            </div>

            <div style={{
                marginTop: '24px', padding: '20px', background: '#FDFCF0',
                borderRadius: '20px', textAlign: 'center', border: '1px dashed #FFE082'
            }}>
                <p style={{ margin: 0, color: '#9E9E9E', fontSize: '0.9rem' }}>
                    🚩 오늘의 목표: 멋진 글 한 편 완성하기!
                </p>
            </div>
        </Card>
    );
};

export default StudentDashboard;
