import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { supabase } from '../../lib/supabaseClient';

/**
 * 역할: 로그인 전 초기 랜딩 페이지
 * props: 
 *  - onStudentLoginClick: 학생 로그인 모드로 전환하는 함수
 */
const LandingPage = ({ onStudentLoginClick }) => {
    return (
        <Card style={{ textAlign: 'center' }}>
            <h1 style={{
                fontSize: '2.8rem',
                marginBottom: '1rem',
                color: 'var(--primary-color)',
                fontWeight: '800'
            }}>
                ✍️ 끄적끄적 아지트
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                우리의 소중한 생각들이 무럭무럭 자라나는<br />
                <strong>따뜻한 글쓰기 공간</strong>에 오신 걸 환영해요!
            </p>
            <Button
                onClick={() => supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: window.location.origin }
                })}
                style={{ width: '100%', background: '#FFFFFF', color: '#757575', border: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{ width: '18px', marginRight: '10px' }} />
                선생님 구글 로그인
            </Button>

            <div style={{ margin: '20px 0', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <Button
                    variant="secondary"
                    size="lg"
                    style={{ width: '100%', background: '#FBC02D' }}
                    onClick={onStudentLoginClick}
                >
                    🎒 학생 로그인 (코드 입력)
                </Button>
            </div>

            <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#aaa' }}>
                나만의 글쓰기 아지트로 입장해요 🏠
            </p>
        </Card>
    );
};

export default LandingPage;
