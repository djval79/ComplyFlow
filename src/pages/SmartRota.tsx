import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CreateShiftModal } from '../components/CreateShiftModal';
import { TemplatesModal } from '../components/TemplatesModal';
import { useCompliance } from '../context/ComplianceContext';
import { getShifts, createShift, assignStaffToShift, type Shift, deleteShift } from '../services/rotaService';
import { getCompetencyMatrix, type StaffCompetency } from '../services/competencyService';
import { Loader2, Calendar, User, Plus, MoveRight, AlertTriangle, CheckCircle, Clock, Sparkles } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

// Simple drag & drop implementation using HTML5 API for zero-dep simplicity in this demo context
// Ideally would use dnd-kit for production

export const SmartRota = () => {
    const { profile, isDemo } = useAuth();
    const [loading, setLoading] = useState(true);
    const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [staff, setStaff] = useState<StaffCompetency[]>([]);
    const [draggedUser, setDraggedUser] = useState<string | null>(null);
    const [dropError, setDropError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
    const [isAutoFilling, setIsAutoFilling] = useState(false);

    useEffect(() => {
        loadData();
    }, [weekStart, profile?.organization_id]);

    const loadData = async () => {
        if (!profile?.organization_id && !isDemo) return;
        setLoading(true);

        // Load shifts
        const weekEnd = addDays(weekStart, 6);
        const shiftsData = await getShifts(profile?.organization_id || 'demo', weekStart, weekEnd);
        setShifts(shiftsData); // In a real app we'd merge demo data if needed

        // Load staff for sidebar
        const complianceData = await getCompetencyMatrix(profile?.organization_id || 'demo');
        setStaff(complianceData.staff);

        setLoading(false);
    };

    const handleDragStart = (e: React.DragEvent, userId: string) => {
        setDraggedUser(userId);
        // Fix for DnD: Set dataTransfer for browser compatibility
        e.dataTransfer.setData('text/plain', userId);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDrop = async (e: React.DragEvent, shiftId: string) => {
        e.preventDefault();
        if (!draggedUser) return;

        // Optimistic check
        const targetShift = shifts.find(s => s.id === shiftId);
        if (targetShift?.assignments?.some(a => a.user_id === draggedUser)) {
            setDropError('Staff member already assigned to this shift');
            setTimeout(() => setDropError(null), 3000);
            return;
        }

        // Call service
        const result = await assignStaffToShift(
            shiftId,
            draggedUser,
            profile?.id || 'system',
            profile?.organization_id || 'demo'
        );

        if (result.success) {
            loadData(); // Reload to show assignment
        } else {
            setDropError(result.error || 'Failed to assign staff');
            // Show compliance issues if any
            if (result.complianceIssues) {
                alert(`Cannot assign staff:\n${result.complianceIssues.join('\n')}`);
            } else {
                alert(result.error);
            }
        }
        setDraggedUser(null);
    };

    const handleAutoFill = async () => {
        if (!profile?.organization_id) return;
        setIsAutoFilling(true);

        // Simulation of AI thinking
        await new Promise(resolve => setTimeout(resolve, 1500));

        const emptyShifts = shifts.filter(s => !s.assignments || s.assignments.length === 0);
        let solved = 0;

        for (const shift of emptyShifts) {
            // Find first compliant staff member for this role
            const eligibleStaff = staff.find(s =>
                s.job_title === shift.role_required &&
                !Object.values(s.status).includes('expired') &&
                !shifts.some(sh => sh.assignments?.some(a => a.user_id === s.user_id && isSameDay(new Date(sh.start_time), new Date(shift.start_time))))
            );

            if (eligibleStaff) {
                await assignStaffToShift(shift.id, eligibleStaff.user_id, profile.id, profile.organization_id);
                solved++;
            }
        }

        setIsAutoFilling(false);
        if (solved > 0) {
            loadData();
            alert(`AI Suggestion Applied: Assigned staff to ${solved} shifts.`);
        } else {
            alert("AI could not find suitable compliant staff for the remaining empty shifts.");
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

    // Helper to check overall compliance status of a user
    const getUserStatus = (user: StaffCompetency) => {
        const hasExpired = Object.values(user.status).includes('expired');
        const hasExpiring = Object.values(user.status).includes('expiring');
        if (hasExpired) return 'expired';
        if (hasExpiring) return 'expiring';
        return 'valid';
    };

    return (
        <div className="container animate-enter" style={{ padding: '2rem 1rem', maxWidth: '1600px' }}>
            <div className="flex justify-between items-start mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="badge badge-pro flex items-center gap-1">
                            <Clock size={10} fill="currentColor" /> Enterprise
                        </span>
                        <span className="text-sm text-slate-500 font-medium">Smart Scheduling</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Smart Rota</h1>
                    <p className="text-slate-500">Drag and drop staff to assignments. Compliance is checked automatically.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="btn btn-secondary" onClick={() => setWeekStart(addDays(weekStart, -7))}>Prev Week</button>
                    <span className="font-semibold text-slate-700 min-w-[150px] text-center">
                        {format(weekStart, 'd MMM')} - {format(addDays(weekStart, 6), 'd MMM yyyy')}
                    </span>
                    <button className="btn btn-secondary" onClick={() => setWeekStart(addDays(weekStart, 7))}>Next Week</button>
                    <button
                        className="btn btn-primary ml-4 flex items-center gap-2"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        <Plus size={16} /> New Shift
                    </button>
                    <button
                        className="btn btn-secondary flex items-center gap-2 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                        onClick={handleAutoFill}
                        disabled={isAutoFilling}
                    >
                        {isAutoFilling ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Sparkles size={16} />
                        )}
                        {isAutoFilling ? 'AI Thinking...' : 'AI Auto-Fill'}
                    </button>
                </div>
            </div>

            <CreateShiftModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={async (data) => {
                    await createShift(data);
                    loadData();
                }}
            />

            <TemplatesModal
                isOpen={isTemplatesModalOpen}
                onClose={() => setIsTemplatesModalOpen(false)}
                currentShifts={shifts}
                weekStart={weekStart}
                onTemplateApplied={() => loadData()}
            />

            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

                {/* Sidebar: Staff List */}
                <div className="card h-[calc(100vh-250px)] overflow-y-auto">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <User size={18} /> Available Staff
                    </h3>
                    <div className="space-y-3">
                        {staff.map(person => {
                            const status = getUserStatus(person);
                            return (
                                <div
                                    key={person.user_id}
                                    className={`
                                        p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all hover:shadow-md
                                        ${status === 'expired' ? 'bg-red-50 border-red-100 opacity-75' : 'bg-white border-slate-200'}
                                    `}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, person.user_id)}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="font-medium text-slate-900">{person.user_name}</div>
                                        {status === 'valid' && <CheckCircle size={14} className="text-emerald-500" />}
                                        {status === 'expiring' && <Clock size={14} className="text-amber-500" />}
                                        {status === 'expired' && <AlertTriangle size={14} className="text-red-500" />}
                                    </div>
                                    <div className="text-xs text-slate-500">{person.job_title}</div>
                                    {status === 'expired' && (
                                        <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                            <AlertTriangle size={10} /> Training Expired
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Main: Calendar Grid */}
                <div className="card overflow-x-auto min-h-[600px] bg-slate-50/50">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="animate-spin text-blue-600" size={32} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 gap-2 min-w-[1000px] h-full">
                            {weekDays.map(day => {
                                const dayShifts = shifts.filter(s => isSameDay(new Date(s.start_time), day));
                                const isToday = isSameDay(day, new Date());

                                return (
                                    <div key={day.toISOString()} className={`flex flex-col h-full rounded-lg ${isToday ? 'bg-blue-50/50 ring-1 ring-blue-100' : ''}`}>
                                        <div className={`p-2 text-center text-sm border-b ${isToday ? 'font-bold text-blue-700' : 'text-slate-600'}`}>
                                            {format(day, 'EEE d')}
                                        </div>
                                        <div className="flex-1 p-2 space-y-2">
                                            {/* Empty slot placeholder (could add functionality to click-to-add) */}
                                            {dayShifts.length === 0 && (
                                                <div className="h-full flex items-center justify-center text-slate-300 text-xs italic">
                                                    No shifts
                                                </div>
                                            )}

                                            {dayShifts.map(shift => (
                                                <div
                                                    key={shift.id}
                                                    className="bg-white p-2 rounded border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                                                    onDragOver={handleDragOver}
                                                    onDrop={(e) => handleDrop(e, shift.id)}
                                                >
                                                    <div className="text-xs font-semibold text-slate-800 mb-1">
                                                        {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                                                    </div>
                                                    <div className="text-xs text-blue-600 font-medium mb-2 bg-blue-50 inline-block px-1.5 py-0.5 rounded">
                                                        {shift.role_required}
                                                    </div>

                                                    {shift.client_name && (
                                                        <div className="text-[10px] text-slate-500 mb-2 flex items-center gap-1">
                                                            <User size={10} /> {shift.client_name}
                                                        </div>
                                                    )}

                                                    {/* Assignments */}

                                                    {/* Assignments */}
                                                    <div className="space-y-1">
                                                        {shift.assignments?.map(assignment => (
                                                            <div key={assignment.id} className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 p-1 rounded">
                                                                <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold">
                                                                    {assignment.user?.full_name?.charAt(0) || 'U'}
                                                                </div>
                                                                <span className="truncate max-w-[80px]">{assignment.user?.full_name}</span>
                                                            </div>
                                                        ))}
                                                        {(!shift.assignments || shift.assignments.length === 0) && (
                                                            <div className="text-[10px] text-slate-400 border border-dashed border-slate-300 rounded p-1 text-center">
                                                                Drop staff here
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {dropError && (
                <div className="fixed bottom-8 right-8 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
                    <AlertTriangle size={20} />
                    <span className="font-medium">{dropError}</span>
                </div>
            )}
        </div>
    );
};
