import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Button from '../common/Button';
import Card from '../common/Card';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 역할: 선생님 - 학급 내 학생 명단 관리 (프리미엄 카드 리스트 버전)
 * 학생 개개인의 이름과 포인트가 돋보이도록 시원시원한 카드 레이아웃을 제공합니다. ✨
 */
const StudentManager = ({ classId }) => {
    const [studentName, setStudentName] = useState('');
    const [students, setStudents] = useState([]);
    const [isAdding, setIsAdding] = useState(false);

    // 선택 및 모달 상태
    const [selectedIds, setSelectedIds] = useState([]);
    const [isPointModalOpen, setIsPointModalOpen] = useState(false);
    const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // 포인트 통합 모달 데이터
    const [pointFormData, setPointFormData] = useState({
        type: 'give',
        amount: 10,
        reason: '참여도가 높아요! 🌟'
    });

    const [historyStudent, setHistoryStudent] = useState(null);
    const [historyLogs, setHistoryLogs] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // 데이터 호출
    useEffect(() => {
        if (classId) fetchStudents();
        return () => {
            setStudents([]);
            setSelectedIds([]);
        };
    }, [classId]);

    const fetchStudents = async () => {
        if (!classId) return;
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('class_id', classId)
            .order('name', { ascending: true });

        if (!error && data) setStudents(data);
    };

    // 포인트 일괄 처리
    const handleBulkProcessPoints = async () => {
        if (selectedIds.length === 0) return;
        if (!pointFormData.reason.trim()) return alert('활동 사유를 입력해주세요! ✍️');

        const { type, amount, reason } = pointFormData;
        const actualAmount = type === 'give' ? amount : -amount;
        const targets = students.filter(s => selectedIds.includes(s.id));
        const previousStudents = [...students];

        setStudents(prev => prev.map(s => {
            if (selectedIds.includes(s.id)) {
                return { ...s, total_points: (s.total_points || 0) + actualAmount };
            }
            return s;
        }));
        setIsPointModalOpen(false);

        try {
            const operations = targets.map(async (t) => {
                const newPoints = (t.total_points || 0) + actualAmount;
                const { error: upError } = await supabase.from('students').update({ total_points: newPoints }).eq('id', t.id);
                if (upError) throw upError;
                const { error: logError } = await supabase.from('point_logs').insert({ student_id: t.id, amount: actualAmount, reason: reason });
                if (logError) throw logError;
            });
            await Promise.all(operations);
            alert(`${targets.length}명의 포인트 처리가 완료되었습니다! ✨`);
            setSelectedIds([]);
        } catch (error) {
            setStudents(previousStudents);
            alert('오류 발생: ' + error.message);
        }
    };

    const handleDeleteStudent = async () => {
        if (!deleteTarget) return;
        try {
            const { error } = await supabase.from('students').delete().eq('id', deleteTarget.id);
            if (error) throw error;
            setStudents(prev => prev.filter(s => s.id !== deleteTarget.id));
            setSelectedIds(prev => prev.filter(id => id !== deleteTarget.id));
        } catch (error) {
            alert('삭제 실패: ' + error.message);
        } finally {
            setIsDeleteModalOpen(false);
            setDeleteTarget(null);
        }
    };

    const openHistoryModal = async (student) => {
        setHistoryStudent(student);
        setIsHistoryModalOpen(true);
        setLoadingHistory(true);
        const { data, error } = await supabase.from('point_logs').select('*').eq('student_id', student.id).order('created_at', { ascending: false });
        if (!error) setHistoryLogs(data || []);
        setLoadingHistory(false);
    };

    const handleAddStudent = async () => {
        if (!studentName.trim()) return;
        setIsAdding(true);
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        const { data, error } = await supabase.from('students').insert({ class_id: classId, name: studentName, student_code: code, total_points: 0 }).select();
        if (!error && data[0]) {
            setStudents(prev => [...prev, data[0]]);
            setStudentName('');
        }
        setIsAdding(false);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === students.length) setSelectedIds([]);
        else setSelectedIds(students.map(s => s.id));
    };

    return (
        <div style={{ marginTop: '8px', textAlign: 'left' }}>
            {/* [슬림 고정 상단바] */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                background: '#FDFEFE',
                padding: '10px 16px',
                borderRadius: '12px',
                marginBottom: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                border: '1px solid #E5E8E8'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#2C3E50', margin: 0, fontWeight: '900' }}>👦 학생 명단</h3>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#566573', cursor: 'pointer', background: '#F8F9F9', padding: '4px 10px', borderRadius: '8px', border: '1px solid #D5DBDB' }}>
                        <input type="checkbox" checked={students.length > 0 && selectedIds.length === students.length} onChange={toggleSelectAll} style={{ width: '15px', height: '15px' }} />
                        전체 선택
                    </label>
                </div>

                <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        placeholder="이름 입력 후 엔터"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddStudent()}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '2px solid #D5DBDB', outline: 'none', fontSize: '0.9rem' }}
                    />
                    <Button onClick={handleAddStudent} disabled={isAdding} size="sm" style={{ padding: '0 15px', height: '36px' }}>추가</Button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                        onClick={() => setIsPointModalOpen(true)}
                        size="sm"
                        disabled={selectedIds.length === 0}
                        style={{
                            background: selectedIds.length > 0 ? '#3498DB' : '#D5DBDB',
                            color: 'white',
                            height: '36px',
                            minWidth: '100px',
                            fontWeight: 'bold'
                        }}
                    >
                        ⚡ 포인트 처리 {selectedIds.length > 0 && `(${selectedIds.length})`}
                    </Button>
                    <button
                        onClick={() => setIsCodeModalOpen(true)}
                        style={{ border: 'none', background: '#F4D03F', color: '#7E5109', borderRadius: '8px', padding: '0 12px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', height: '36px' }}
                    >
                        🔑 코드 확인
                    </button>
                </div>
            </div>

            {/* [프리미엄 카드 리스트 그리드] */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
                paddingBottom: '40px'
            }}>
                {students.map((s, index) => (
                    <motion.div
                        key={s.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -4, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '20px',
                            background: selectedIds.includes(s.id) ? '#EBF5FB' : 'white',
                            border: `2px solid ${selectedIds.includes(s.id) ? '#3498DB' : '#F2F4F4'}`,
                            borderRadius: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: 'var(--shadow-subtle)',
                            position: 'relative'
                        }}
                        onClick={() => setSelectedIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                    >
                        {/* 상단: 번호 및 삭제 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ fontSize: '0.85rem', color: '#95A5A6', fontWeight: 'bold' }}>No. {String(index + 1).padStart(2, '0')}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); setIsDeleteModalOpen(true); }}
                                style={{ border: 'none', background: '#FDEDEC', color: '#E74C3C', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}
                            >
                                🗑️
                            </button>
                        </div>

                        {/* 이름 (가장 강조) */}
                        <div style={{
                            fontWeight: '900',
                            color: '#2C3E50',
                            fontSize: '1.4rem',
                            marginBottom: '16px',
                            textAlign: 'center'
                        }}>
                            {s.name}
                        </div>

                        {/* 하단: 점수 및 내역 */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#F8F9F9',
                            padding: '12px',
                            borderRadius: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '1rem' }}>✨</span>
                                <motion.span
                                    key={s.total_points}
                                    animate={{ scale: [1, 1.4, 1] }}
                                    style={{ fontWeight: '900', color: '#2980B9', fontSize: '1.2rem' }}
                                >
                                    {s.total_points || 0} P
                                </motion.span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); openHistoryModal(s); }}
                                style={{ border: '1px solid #D5DBDB', background: 'white', color: '#5D6D7E', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                📜 내역 보기
                            </button>
                        </div>

                        {/* 체크박스 커스텀 표시 */}
                        {selectedIds.includes(s.id) && (
                            <div style={{ position: 'absolute', top: '-10px', left: '-10px', background: '#3498DB', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                ✓
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* 모달 디자인 - 일관성 유지 */}
            <AnimatePresence>
                {isPointModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(44, 62, 80, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
                        <Card style={{ width: '400px', padding: '32px' }}>
                            <h2 style={{ fontSize: '1.3rem', color: '#2C3E50', marginBottom: '24px', textAlign: 'center' }}>⚡ {selectedIds.length}명 포인트 관리</h2>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                <button onClick={() => setPointFormData(p => ({ ...p, type: 'give' }))} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: pointFormData.type === 'give' ? '#3498DB' : '#F4F6F7', color: pointFormData.type === 'give' ? 'white' : '#95A5A6', fontWeight: 'bold' }}>(+) 주기</button>
                                <button onClick={() => setPointFormData(p => ({ ...p, type: 'take' }))} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: pointFormData.type === 'take' ? '#E74C3C' : '#F4F6F7', color: pointFormData.type === 'take' ? 'white' : '#95A5A6', fontWeight: 'bold' }}>(-) 빼기</button>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '0.85rem', color: '#5D6D7E', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>점수 설정</label>
                                <input type="number" value={pointFormData.amount} onChange={(e) => setPointFormData(p => ({ ...p, amount: parseInt(e.target.value) || 0 }))} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #D5DBDB', fontSize: '1rem' }} />
                            </div>
                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ fontSize: '0.85rem', color: '#5D6D7E', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>활동 사유 입력</label>
                                <input type="text" value={pointFormData.reason} onChange={(e) => setPointFormData(p => ({ ...p, reason: e.target.value }))} placeholder="이유를 입력해주세요" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #D5DBDB', fontSize: '1rem' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Button variant="ghost" style={{ flex: 1 }} onClick={() => setIsPointModalOpen(false)}>취소</Button>
                                <Button onClick={handleBulkProcessPoints} style={{ flex: 1.5, background: pointFormData.type === 'give' ? '#3498DB' : '#E74C3C', color: 'white' }}>완료</Button>
                            </div>
                        </Card>
                    </div>
                )}

                {/* 접속 코드 (인쇄용 기구축 기능 유지) */}
                {isCodeModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'white', zIndex: 2000, padding: '40px', overflowY: 'auto' }}>
                        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h2 style={{ fontSize: '1.5rem', color: '#2C3E50' }}>🔑 학생별 접속 코드 목록</h2>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Button onClick={() => window.print()} variant="primary">🖨️ 명단 인쇄</Button>
                                <Button onClick={() => setIsCodeModalOpen(false)} variant="ghost">닫기</Button>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
                            {students.map(s => (
                                <div key={s.id} style={{ border: '2px dashed #D5DBDB', borderRadius: '16px', padding: '24px', textAlign: 'center', background: '#FDFEFE' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#2C3E50', marginBottom: '10px' }}>{s.name}</div>
                                    <div style={{ fontSize: '1.8rem', color: '#FF8F00', fontWeight: '900', fontFamily: 'monospace' }}>{s.student_code}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 포인트 내역 */}
                {isHistoryModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
                        <Card style={{ width: '450px', maxHeight: '70vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>
                            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: '#2C3E50', borderBottom: '2px solid #F2F4F4', paddingBottom: '10px' }}>📜 {historyStudent?.name} 활동 기록</h3>
                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                {loadingHistory ? <p>로딩 중...</p> : historyLogs.map(l => (
                                    <div key={l.id} style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8F9F9' }}>
                                        <div>
                                            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#34495E' }}>{l.reason}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#ABB2B9' }}>{new Date(l.created_at).toLocaleString()}</div>
                                        </div>
                                        <div style={{ fontWeight: '900', color: l.amount > 0 ? '#27AE60' : '#E74C3C', fontSize: '1.1rem' }}>
                                            {l.amount > 0 ? `+${l.amount}` : l.amount}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button variant="ghost" onClick={() => setIsHistoryModalOpen(false)} style={{ marginTop: '15px' }}>닫기</Button>
                        </Card>
                    </div>
                )}

                {/* 삭제 모달 */}
                {isDeleteModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
                        <Card style={{ width: '350px', padding: '32px', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>⚠️</div>
                            <h2 style={{ fontSize: '1.3rem', marginBottom: '12px', color: '#2C3E50' }}>정말 삭제하시겠습니까?</h2>
                            <p style={{ color: '#7F8C8D', fontSize: '1rem', lineHeight: '1.5' }}>{deleteTarget?.name} 학생의 모든 데이터가 소멸됩니다.</p>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} style={{ flex: 1 }}>취소</Button>
                                <Button onClick={handleDeleteStudent} style={{ flex: 1, background: '#E74C3C', color: 'white' }}>삭제</Button>
                            </div>
                        </Card>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentManager;
