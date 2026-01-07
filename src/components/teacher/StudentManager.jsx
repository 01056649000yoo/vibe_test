import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Button from '../common/Button';
import Card from '../common/Card';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 역할: 선생님 - 학급 내 학생 명단 관리, 개별/일괄 포인트 관리, 접속 코드 확인 및 인쇄
 * 아이들에게 나눠줄 접속 코드를 크게 보여주고 인쇄합니다. 🔑🖨️
 * props:
 *  - classId: 현재 학급 ID
 */
const StudentManager = ({ classId }) => {
    const [studentName, setStudentName] = useState('');
    const [students, setStudents] = useState([]);
    const [isAdding, setIsAdding] = useState(false);

    // 개별 학생별 포인트 입력값 상태
    const [pointInputs, setPointInputs] = useState({});

    // 다중 선택 관련 상태
    const [selectedIds, setSelectedIds] = useState([]);

    // 각종 모달 상태
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isCodeModalOpen, setIsCodeModalOpen] = useState(false); // 접속코드 전체 확인 모달

    const [confirmData, setConfirmData] = useState({
        type: 'give', target: 'single', student: null, students: [], amount: 0, reason: ''
    });
    const [historyStudent, setHistoryStudent] = useState(null);
    const [historyLogs, setHistoryLogs] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // 페이지 진입 시 데이터 초기화 및 최신화
    useEffect(() => {
        if (classId) {
            fetchStudents();
        }
        return () => {
            setStudents([]);
            setSelectedIds([]);
        };
    }, [classId]);

    // 학생 명단 불러오기
    const fetchStudents = async () => {
        if (!classId) return;
        setStudents([]);
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('class_id', classId)
            .order('created_at', { ascending: true });

        if (!error && data) {
            setStudents(data);
            const initialInputs = {};
            data.forEach(s => {
                initialInputs[s.id] = 10;
            });
            setPointInputs(initialInputs);
        }
    };

    // 학생 삭제 로직
    const handleDeleteStudent = async () => {
        if (!deleteTarget) return;
        try {
            const { error } = await supabase.from('students').delete().eq('id', deleteTarget.id);
            if (error) {
                alert('학생 삭제에 실패했어요: ' + error.message);
                return;
            }
            setStudents(prev => prev.filter(s => s.id !== deleteTarget.id));
            setSelectedIds(prev => prev.filter(id => id !== deleteTarget.id));
            alert(`${deleteTarget.name} 학생의 소중한 명단을 안전하게 정리했습니다. 🧹`);
        } catch (error) {
            alert('삭제 과정 중 문제가 생겼어요: ' + error.message);
        } finally {
            setIsDeleteModalOpen(false);
            setDeleteTarget(null);
        }
    };

    // 포인트 처리 로직
    const handleProcessPoints = async () => {
        const { type, target, student, students: targetStudents, amount, reason } = confirmData;
        if (!reason.trim()) {
            alert('왜 이 포인트를 주는지 사유를 적어주세요! 📝');
            return;
        }

        const actualAmount = type === 'give' ? amount : -amount;
        const targets = target === 'single' ? [student] : targetStudents;
        const previousStudents = [...students];

        setStudents(prev => prev.map(s => {
            const isTarget = targets.find(t => t.id === s.id);
            return isTarget ? { ...s, total_points: (s.total_points || 0) + actualAmount } : s;
        }));

        setIsConfirmModalOpen(false);

        try {
            const operations = targets.map(async (t) => {
                const newPoints = (t.total_points || 0) + actualAmount;
                const { error: upError } = await supabase.from('students').update({ total_points: newPoints }).eq('id', t.id);
                if (upError) throw upError;
                const { error: logError } = await supabase.from('point_logs').insert({ student_id: t.id, amount: actualAmount, reason: reason });
                if (logError) throw logError;
            });
            await Promise.all(operations);
            alert(`${targets.length}명의 포인트 처리를 기록부에 안전하게 저장했습니다! ✨`);
        } catch (error) {
            setStudents(previousStudents);
            alert('데이터 저장 중 문제가 발생해 원래대로 복구했습니다: ' + error.message);
        }
    };

    // 내역 보기 모달
    const openHistoryModal = async (student) => {
        setHistoryStudent(student);
        setIsHistoryModalOpen(true);
        setLoadingHistory(true);
        const { data, error } = await supabase.from('point_logs').select('*').eq('student_id', student.id).order('created_at', { ascending: false });
        if (error) alert('내역을 불러오는 데 실패했어요: ' + error.message);
        else setHistoryLogs(data || []);
        setLoadingHistory(false);
    };

    // 체크박스 제어
    const handleSelectAll = (e) => {
        setSelectedIds(e.target.checked ? students.map(s => s.id) : []);
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const handleInputChange = (id, val) => {
        setPointInputs(prev => ({ ...prev, [id]: parseInt(val) || 0 }));
    };

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        return code;
    };

    // 학생 등록
    const handleAddStudent = async () => {
        if (!studentName.trim()) {
            alert('새로운 친구의 이름을 알려주세요! 😊');
            return;
        }
        setIsAdding(true);
        const code = generateCode();
        try {
            const { data, error } = await supabase.from('students').insert({ class_id: classId, name: studentName, student_code: code, total_points: 0 }).select();
            if (error) throw error;
            if (data && data[0]) {
                const newStudent = data[0];
                setStudents(prev => [...prev, newStudent]);
                setPointInputs(prev => ({ ...prev, [newStudent.id]: 10 }));
                setStudentName('');
            }
        } catch (error) {
            alert('학생 등록 중 문제가 생겼어요: ' + error.message);
        } finally {
            setIsAdding(false);
        }
    };

    // 인쇄 기능
    const handlePrint = () => {
        window.print();
    };

    return (
        <div style={{ marginTop: '24px', textAlign: 'left' }}>
            {/* 상단 액션 바 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🎒</span> 우리 반 학생 명단
                    </h3>
                    <Button
                        onClick={() => setIsCodeModalOpen(true)}
                        variant="ghost"
                        size="sm"
                        style={{ background: '#FFF9C4', border: '1px solid #FFE082', color: '#795548', fontWeight: 'bold' }}
                    >
                        🔑 접속코드 전체 확인
                    </Button>
                </div>

                {selectedIds.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button onClick={() => { setConfirmData({ type: 'give', target: 'bulk', students: students.filter(s => selectedIds.includes(s.id)), amount: 10, reason: '훌륭한 단체 활동! 🌟' }); setIsConfirmModalOpen(true); }} variant="primary" size="sm" style={{ background: '#4CAF50' }}>선택 {selectedIds.length}명 (+) 주기</Button>
                        <Button onClick={() => { setConfirmData({ type: 'take', target: 'bulk', students: students.filter(s => selectedIds.includes(s.id)), amount: 10, reason: '공동체 약속을 잊었어요 📝' }); setIsConfirmModalOpen(true); }} variant="primary" size="sm" style={{ background: '#F44336' }}>선택 {selectedIds.length}명 (-) 빼기</Button>
                    </div>
                )}
            </div>

            {/* 학생 추가 */}
            <div className="no-print" style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="새로운 친구의 이름을 적어주세요"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddStudent()}
                    style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '2px solid #FFE082', outline: 'none', fontSize: '1rem' }}
                />
                <Button onClick={handleAddStudent} disabled={isAdding} variant="primary">친구 합류하기 ✨</Button>
            </div>

            {/* 명단 테이블 */}
            <div className="no-print" style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #FFE082', boxShadow: '0 4px 12px rgba(255, 224, 130, 0.15)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                    <thead>
                        <tr style={{ background: '#FFF9C4', color: '#795548', fontSize: '0.85rem', fontWeight: 'bold' }}>
                            <th style={{ padding: '14px' }}>
                                <input type="checkbox" onChange={handleSelectAll} checked={students.length > 0 && selectedIds.length === students.length} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                            </th>
                            <th style={{ padding: '14px' }}>번호</th>
                            <th style={{ padding: '14px' }}>이름</th>
                            <th style={{ padding: '14px' }}>접속 코드</th>
                            <th style={{ padding: '14px' }}>현재 포인트</th>
                            <th style={{ padding: '14px' }}>포인트 관리</th>
                            <th style={{ padding: '14px' }}>기록</th>
                            <th style={{ padding: '14px' }}>설정</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((s, index) => (
                            <tr key={s.id} style={{ borderTop: '1px solid #FFFDE7', background: selectedIds.includes(s.id) ? '#FFFDE7' : 'transparent' }}>
                                <td style={{ padding: '12px' }}><input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => handleSelectOne(s.id)} /></td>
                                <td style={{ padding: '12px', color: '#999' }}>{index + 1}</td>
                                <td style={{ padding: '12px', fontWeight: '600', color: '#555' }}>{s.name}</td>
                                <td style={{ padding: '12px', fontSize: '0.9rem', color: '#795548', fontFamily: 'monospace' }}>{s.student_code}</td>
                                <td style={{ padding: '12px' }}><motion.span key={s.total_points} animate={{ y: [0, -8, 0] }} style={{ fontWeight: 'bold', color: 'var(--primary-color)', display: 'inline-block' }}>✨ {s.total_points || 0}</motion.span></td>
                                <td style={{ padding: '12px' }}>
                                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                        <input type="number" value={pointInputs[s.id] || 10} onChange={(e) => handleInputChange(s.id, e.target.value)} style={{ width: '50px', padding: '6px', borderRadius: '8px', border: '1px solid #FFE082', textAlign: 'center' }} />
                                        <Button size="sm" onClick={() => { setConfirmData({ type: 'give', target: 'single', student: s, amount: pointInputs[s.id] || 10, reason: '수업 태도 우수 ✨' }); setIsConfirmModalOpen(true); }} style={{ padding: '6px 10px', background: '#E8F5E9', color: '#2E7D32' }}>+</Button>
                                        <Button size="sm" onClick={() => { setConfirmData({ type: 'take', target: 'single', student: s, amount: pointInputs[s.id] || 10, reason: '약속을 지키지 못했어요 😢' }); setIsConfirmModalOpen(true); }} style={{ padding: '6px 10px', background: '#FFEBEE', color: '#C62828' }}>-</Button>
                                    </div>
                                </td>
                                <td style={{ padding: '12px' }}><Button variant="ghost" size="sm" onClick={() => openHistoryModal(s)}>📜 내역</Button></td>
                                <td style={{ padding: '12px' }}><button onClick={() => { setDeleteTarget(s); setIsDeleteModalOpen(true); }} style={{ border: 'none', background: '#FFF5F5', color: '#E03131', padding: '6px', borderRadius: '8px' }}>🗑️</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 🔑 접속코드 전체 확인 모달 (격자 카드 형태) */}
            <AnimatePresence>
                {isCodeModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'white', zIndex: 2000, overflowY: 'auto', padding: '40px'
                    }}>
                        <div className="no-print" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h2 style={{ fontSize: '1.8rem', color: '#795548', margin: 0 }}>우리 반 접속 코드 명단 🔑</h2>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Button onClick={handlePrint} variant="primary" style={{ background: '#4CAF50' }}>🖨️ 명단 인쇄하기</Button>
                                <Button onClick={() => setIsCodeModalOpen(false)} variant="ghost">닫기</Button>
                            </div>
                        </div>

                        <div className="print-area" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '20px',
                            maxWidth: '1000px',
                            margin: '0 auto'
                        }}>
                            {students.map((s) => (
                                <div key={s.id} style={{
                                    border: '2px dashed #FFE082',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    textAlign: 'center',
                                    background: '#FFFDE7',
                                    pageBreakInside: 'avoid'
                                }}>
                                    <div style={{ fontSize: '1.2rem', color: '#795548', marginBottom: '12px', fontWeight: 'bold' }}>{s.name}</div>
                                    <div style={{ fontSize: '2.2rem', fontFamily: 'monospace', fontWeight: '800', color: '#FF8F00', letterSpacing: '4px' }}>{s.student_code}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '12px' }}>VIBE 접속 코드</div>
                                </div>
                            ))}
                        </div>

                        {/* 인쇄 전용 스타일 */}
                        <style>{`
                            @media print {
                                body { margin: 0; padding: 0; }
                                .no-print { display: none !important; }
                                .print-area { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 10mm !important; }
                                .print-area > div { border: 1px solid #ccc !important; background: white !important; }
                            }
                        `}</style>
                    </div>
                )}
            </AnimatePresence>

            {/* 나머지 모달들은 생략(기존과 동일)하거나 부드럽게 유지 */}
            {/* ... 포인트 확인, 내역, 삭제 모달 (코드 가독성을 위해 생략 가능하나 기능은 유지됨) ... */}
            <AnimatePresence>
                {isConfirmModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                            <Card style={{ width: '90%', maxWidth: '400px', padding: '24px' }}>
                                <h2 style={{ fontSize: '1.4rem', marginBottom: '16px', textAlign: 'center' }}>{confirmData.type === 'give' ? '🎁 포인트 선물' : '🧤 포인트 회수'}</h2>
                                <div style={{ background: '#F8F9FA', padding: '16px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
                                    <strong>{confirmData.student?.name || `선택 ${confirmData.students.length}명`}</strong> 학생에게<br />
                                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: confirmData.type === 'give' ? '#2E7D32' : '#C62828' }}>{confirmData.type === 'give' ? '+' : '-'}{confirmData.amount} 포인트</span>
                                </div>
                                <input type="text" value={confirmData.reason} onChange={(e) => setConfirmData(prev => ({ ...prev, reason: e.target.value }))} placeholder="사유를 입력해주세요" autoFocus style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #FFE082', outline: 'none', marginBottom: '20px' }} />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <Button variant="ghost" style={{ flex: 1 }} onClick={() => setIsConfirmModalOpen(false)}>취소</Button>
                                    <Button variant="primary" style={{ flex: 2, background: confirmData.type === 'give' ? '#4CAF50' : '#F44336' }} disabled={!confirmData.reason.trim()} onClick={handleProcessPoints}>반영하기</Button>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                )}
                {isHistoryModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                        <Card style={{ width: '90%', maxWidth: '450px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h2 style={{ fontSize: '1.3rem', margin: 0 }}>📜 {historyStudent?.name}의 기록</h2>
                                <button onClick={() => setIsHistoryModalOpen(false)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
                                {loadingHistory ? <div style={{ textAlign: 'center' }}>조회 중...</div> : historyLogs.map(log => (
                                    <div key={log.id} style={{ padding: '12px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                                        <div><div style={{ fontWeight: 'bold' }}>{log.reason}</div><div style={{ fontSize: '0.8rem', color: '#999' }}>{new Date(log.created_at).toLocaleString()}</div></div>
                                        <div style={{ fontWeight: 'bold', color: log.amount > 0 ? '#4CAF50' : '#F44336' }}>{log.amount > 0 ? `+${log.amount}` : log.amount}</div>
                                    </div>
                                ))}
                            </div>
                            <Button variant="secondary" onClick={() => setIsHistoryModalOpen(false)}>닫기</Button>
                        </Card>
                    </div>
                )}
                {isDeleteModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
                        <Card style={{ width: '90%', maxWidth: '400px', padding: '32px', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem' }}>⚠️</div>
                            <h2>정말 삭제할까요?</h2>
                            <p>{deleteTarget?.name} 학생의 모든 데이터가 사라집니다.</p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Button variant="ghost" style={{ flex: 1 }} onClick={() => setIsDeleteModalOpen(false)}>취소</Button>
                                <Button variant="primary" style={{ flex: 1, background: '#E03131' }} onClick={handleDeleteStudent}>삭제하기</Button>
                            </div>
                        </Card>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentManager;
