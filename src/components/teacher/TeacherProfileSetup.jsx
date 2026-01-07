import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { supabase } from '../../lib/supabaseClient';

/**
 * 역할: 로그인 후 역할(선생님) 설정 페이지
 * props:
 *  - email: 사용자 이메일
 *  - onTeacherStart: 선생님으로 시작하기 버튼 클릭 시 실행될 함수
 */
const TeacherProfileSetup = ({ email, onTeacherStart }) => {
    return (
        <Card style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>반가워요! 처음 만났네요.</h2>
            <p style={{ color: 'var(--primary-color)', fontWeight: '600', marginBottom: '1.5rem' }}>
                {email}
            </p>
            <p style={{ marginBottom: '2.5rem', fontSize: '1.1rem' }}>아지트에서 어떤 보람찬 일을 해볼까요?</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '2.5rem' }}>
                <Button onClick={onTeacherStart} size="lg" variant="primary">
                    🎓 멋진 선생님으로 시작하기
                </Button>
                <Button variant="secondary" size="lg" disabled>
                    🎒 씩씩한 학생으로 시작하기 (준비 중)
                </Button>
            </div>

            <Button variant="ghost" onClick={() => supabase.auth.signOut()} size="sm">
                혹시 다른 계정으로 로그인할까요? 🚪
            </Button>
        </Card>
    );
};

export default TeacherProfileSetup;
