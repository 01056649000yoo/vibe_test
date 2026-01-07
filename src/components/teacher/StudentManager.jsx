import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Button from '../common/Button';
import Card from '../common/Card';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 역할: 선생님 - 학급 내 학생 명단 관리, 개별/일괄 포인트 지급 기능
 * props:
 *  - classId: 현재 학급 ID
 */
const StudentManager = ({ classId }) => {
    const [studentName, setStudentName] = useState('');
    const [students, setStudents] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);

    // 다중 선택 관련 상태
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkAmount, setBulkAmount] = useState('10');
    const [bulkReason, setBulkReason] = useState('수업 참여도 우수 ✨');

    useEffect(() => {
        if (classId) fetchStudents();
    }, [classId]);

    const fetchStudents = async () => {
        const { data } = await supabase
            .from('students')
            .select('*')
            .eq('class_id', classId)
            .order('created_at', { ascending: true });
        setStudents(data || []);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(students.map(s => s.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const handleAddStudent = async () => {
        if (!studentName.trim()) {
            alert('학생 이름을 입력해주세요! 😊');
            return;
        }

        setIsAdding(true);
        const code = generateCode();

        const { error } = await supabase
            .from('students')
            .insert({
                class_id: classId,
                name: studentName,
                student_code: code,
                total_points: 0
            });

        if (error) {
            alert('학생 등록 중 문제가 생겼어요: ' + error.message);
        } else {
            setStudentName('');
            fetchStudents();
        }
        setIsAdding(false);
    };

    // 개별 포인트 지급 로직 (낙관적 업데이트 적용)
    const handleGivePoints = async (student, amount, reason = '선생님 칭찬 포인트') => {
        const previousStudents = [...students];
        const newTotal = (student.total_points || 0) + amount;

        setStudents(prev => prev.map(s =>
            s.id === student.id ? { ...s, total_points: newTotal } : s
        ));

        setUpdatingId(student.id);

        try {
            const { error: updateError } = await supabase
                .from('students')
                .update({ total_points: newTotal })
                .eq('id', student.id);

            if (updateError) throw updateError;

            await supabase.from('point_logs').insert({
                student_id: student.id,
                amount: amount,
                reason: reason
            });
        } catch (error) {
            setStudents(previousStudents);
            alert('포인트 지급 중 오류가 발생했습니다: ' + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    // 일괄 포인트 지급 로직
    const handleBulkGivePoints = async () => {
        const amountNum = parseInt(bulkAmount);
        if (isNaN(amountNum) || amountNum <= 0) {
            alert('올바른 점수를 입력해주세요! 🔢');
            return;
        }

        const previousStudents = [...students];
        const selectedStudents = students.filter(s => selectedIds.includes(s.id));

        // 1. 낙관적 업데이트
        setStudents(prev => prev.map(s =>
            selectedIds.includes(s.id) ? { ...s, total_points: (s.total_points || 0) + amountNum } : s
        ));

        setIsBulkModalOpen(false);

        try {
            // 2. 병렬 처리 (supabase 인스턴스 제한 고려하여 Promise.all)
            const updates = selectedStudents.map(s =>
                supabase.from('students')
                    .update({ total_points: (s.total_points || 0) + amountNum })
                    .eq('id', s.id)
            );

            const logs = selectedStudents.map(s => ({
                student_id: s.id,
                amount: amountNum,
                reason: bulkReason
            }));

            // 트랜잭션을 지원하지 않는 경우를 대비해 각각 실행
            await Promise.all([
                ...updates,
                supabase.from('point_logs').insert(logs)
            ]);

            alert(`${selectedIds.length}명의 학생에게 포인트를 선물했어요! ✨`);
            setSelectedIds([]); // 선택 해제
        } catch (error) {
            setStudents(previousStudents);
            alert('일괄 지급 중 오류가 생겼어요: ' + error.message);
        }
    };

    return (
        <div style={{ marginTop: '24px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🎒</span> 우리 반 학생 명단
                </h3>

                {selectedIds.length > 0 && (
                    <Button
                        onClick={() => setIsBulkModalOpen(true)}
                        variant="primary"
                        size="sm"
                        style={{ background: '#FBC02D', animation: 'bounce 0.5s' }}
                    >
                        선택한 {selectedIds.length}명 포인트 주기 ✨
                    </Button>
                )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="이름을 적어주세요"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddStudent()}
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '2px solid #FFE082',
                        outline: 'none',
                        fontSize: '1rem'
                    }}
                />
                <Button onClick={handleAddStudent} disabled={isAdding} variant="primary">
                    명단에 추가 ✨
                </Button>
            </div>

            <div style={{
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #FFE082',
                boxShadow: '0 4px 12px rgba(255, 224, 130, 0.15)'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                    <thead>
                        <tr style={{ background: '#FFF9C4', color: '#795548', fontSize: '0.9rem', fontWeight: 'bold' }}>
                            <th style={{ padding: '14px' }}>
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={students.length > 0 && selectedIds.length === students.length}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                            </th>
                            <th style={{ padding: '14px' }}>번호</th>
                            <th style={{ padding: '14px' }}>이름</th>
                            <th style={{ padding: '14px' }}>로그인 코드</th>
                            <th style={{ padding: '14px' }}>현재 포인트</th>
                            <th style={{ padding: '14px' }}>포인트 주기</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((s, index) => (
                            <tr key={s.id} style={{
                                borderTop: '1px solid #FFFDE7',
                                transition: 'background 0.2s',
                                background: selectedIds.includes(s.id) ? '#FFFDE7' : 'transparent'
                            }}>
                                <td style={{ padding: '12px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(s.id)}
                                        onChange={() => handleSelectOne(s.id)}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                    />
                                </td>
                                <td style={{ padding: '12px', color: '#999' }}>{index + 1}</td>
                                <td style={{ padding: '12px', fontWeight: '600', color: '#555' }}>{s.name}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{
                                        background: '#FDFCF0',
                                        padding: '6px 10px',
                                        borderRadius: '8px',
                                        letterSpacing: '1px',
                                        color: '#D4A017',
                                        fontWeight: '800',
                                        border: '1px dashed #FFE082',
                                        fontFamily: 'monospace',
                                        fontSize: '0.9rem'
                                    }}>
                                        {s.student_code}
                                    </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <motion.span
                                        key={s.total_points}
                                        initial={{ y: 0 }}
                                        animate={{ y: [0, -10, 0], scale: [1, 1.2, 1] }}
                                        transition={{ duration: 0.3 }}
                                        style={{ fontWeight: 'bold', color: 'var(--primary-color)', display: 'inline-block' }}
                                    >
                                        ✨ {s.total_points || 0}
                                    </motion.span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            style={{ minWidth: '40px', padding: '4px 8px', fontSize: '0.8rem', background: '#FFF9C4', color: '#795548' }}
                                            onClick={() => handleGivePoints(s, 10)}
                                            disabled={updatingId === s.id}
                                        >
                                            +10
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 일괄 지급 모달 */}
            <AnimatePresence>
                {isBulkModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center',
                            alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                        >
                            <Card style={{ width: '90%', maxWidth: '400px', padding: '32px' }}>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: 'var(--text-primary)' }}>
                                    {selectedIds.length}명에게 포인트 선물 🎁
                                </h2>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', color: '#888', marginBottom: '8px' }}>부여할 점수</label>
                                    <input
                                        type="number"
                                        value={bulkAmount}
                                        onChange={(e) => setBulkAmount(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #FFE082', fontSize: '1.2rem', fontWeight: 'bold', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', color: '#888', marginBottom: '8px' }}>부여 근거</label>
                                    <input
                                        type="text"
                                        value={bulkReason}
                                        onChange={(e) => setBulkReason(e.target.value)}
                                        placeholder="예: 수업 참여도 우수"
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #FFE082', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <Button variant="ghost" style={{ flex: 1 }} onClick={() => setIsBulkModalOpen(false)}>취소</Button>
                                    <Button variant="primary" style={{ flex: 2 }} onClick={handleBulkGivePoints}>포인트 보내기 ✨</Button>
                                </div>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <p style={{ marginTop: '12px', fontSize: '0.85rem', color: '#999', textAlign: 'center' }}>
                💡 여러 명을 선택해서 한 번에 칭찬할 수 있어요! 🌟
            </p>
        </div>
    );
};

export default StudentManager;
