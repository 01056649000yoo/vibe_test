import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Button from './common/Button';

const StudentManager = ({ classId }) => {
    const [studentName, setStudentName] = useState('');
    const [students, setStudents] = useState([]);
    const [isAdding, setIsAdding] = useState(false);

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
                student_code: code
            });

        if (error) {
            alert('학생 등록 중 문제가 생겼어요: ' + error.message);
        } else {
            setStudentName('');
            fetchStudents();
        }
        setIsAdding(false);
    };

    return (
        <div style={{ marginTop: '24px', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🎒</span> 우리 반 학생 명단
            </h3>

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
                            <th style={{ padding: '14px' }}>번호</th>
                            <th style={{ padding: '14px' }}>이름</th>
                            <th style={{ padding: '14px' }}>로그인 코드</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((s, index) => (
                            <tr key={s.id} style={{ borderTop: '1px solid #FFFDE7', transition: 'background 0.2s' }}>
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
                                        fontSize: '1rem'
                                    }}>
                                        {s.student_code}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {students.length === 0 && (
                            <tr>
                                <td colSpan="3" style={{ padding: '40px', color: '#94a3b8', fontSize: '0.9rem' }}>
                                    아직 등록된 학생이 없어요.<br />친구의 이름을 한 명씩 추가해주세요! 🎒
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <p style={{ marginTop: '12px', fontSize: '0.85rem', color: '#999', textAlign: 'center' }}>
                💡 코드를 학생들에게 알려주면 바로 로그인할 수 있어요!
            </p>
        </div>
    );
};

export default StudentManager;
