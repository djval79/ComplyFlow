import React, { useState } from 'react';
import { X, Clock, MapPin, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CreateShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    defaultDate?: Date;
}

export const CreateShiftModal: React.FC<CreateShiftModalProps> = ({ isOpen, onClose, onSubmit, defaultDate }) => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form State
    const [date, setDate] = useState(defaultDate ? defaultDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('20:00');
    const [role, setRole] = useState('Care Assistant');
    const [clientName, setClientName] = useState('');
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Combine date and time
        const start = new Date(`${date}T${startTime}`);
        const end = new Date(`${date}T${endTime}`);

        // Handle overnight shifts (end time before start time)
        if (end < start) {
            end.setDate(end.getDate() + 1);
        }

        try {
            await onSubmit({
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                role_required: role,
                client_name: clientName,
                notes,
                organization_id: profile?.organization_id || 'demo' // fallback
            });
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to create shift');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-slate-50">
                    <h3 className="font-semibold text-slate-900">Create New Shift</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                        <input
                            type="date"
                            required
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>

                    {/* Time Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                <Clock size={14} /> Start Time
                            </label>
                            <input
                                type="time"
                                required
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                <Clock size={14} /> End Time
                            </label>
                            <input
                                type="time"
                                required
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Client Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                            <MapPin size={14} /> Client / Service User
                        </label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Mrs. Smith"
                            value={clientName}
                            onChange={e => setClientName(e.target.value)}
                        />
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                            <Briefcase size={14} /> Role Required
                        </label>
                        <select
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={role}
                            onChange={e => setRole(e.target.value)}
                        >
                            <option value="Care Assistant">Care Assistant</option>
                            <option value="Senior Care Assistant">Senior Care Assistant</option>
                            <option value="Nurse">Nurse</option>
                            <option value="Team Leader">Team Leader</option>
                            <option value="Kitchen Staff">Kitchen Staff</option>
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                        <textarea
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none text-sm"
                            placeholder="e.g. 1:1 Specialing requiring PMVA training..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    {/* Footer */}
                    <div className="pt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2"
                        >
                            {loading ? 'Creating...' : 'Create Shift'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};
