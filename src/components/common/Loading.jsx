import React from 'react';

/**
 * 역할: 전역 로딩 화면 컴포넌트
 * props: 없음
 */
const Loading = () => {
    return (
        <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', animation: 'float 2s infinite ease-in-out' }}>🎈</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: '500' }}>
                아지트 문을 열고 있어요. 잠시만요!
            </p>
        </div>
    );
};

export default Loading;
