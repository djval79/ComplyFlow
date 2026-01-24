import React, { useState, useEffect } from 'react';
import { X, Save, User, FileText, Calendar, DollarSign, Briefcase, MapPin } from 'lucide-react';
import { type SponsoredWorker } from '../services/sponsorService';

interface WorkerEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<SponsoredWorker>) => Promise<void>;
    worker?: SponsoredWorker | null;
}

export const WorkerEditModal: React.FC<WorkerEditModalProps> = ({ isOpen, onClose, onSave, worker }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<SponsoredWorker>>({
        full_name: '',
        employee_id: '',
        email: '',
        visa_type: 'Health & Care (SWV)',
        visa_expiry: '',
        cos_number: '',
        cos_assigned_date: '',
        start_date: '',
        salary: 0,
        ni_number: '',
        passport_number: '',
        job_title: '',
        work_location: '',
        notes: ''
    });

    useEffect(() => {
        if (worker) {
            setFormData({
                ...worker,
                visa_expiry: worker.visa_expiry ? new Date(worker.visa_expiry).toISOString().split('T')[0] : '',
                cos_assigned_date: worker.cos_assigned_date ? new Date(worker.cos_assigned_date).toISOString().split('T')[0] : '',
                start_date: worker.start_date ? new Date(worker.start_date).toISOString().split('T')[0] : '',
            });
        } else {
            setFormData({
                full_name: '',
                visa_type: 'Health & Care (SWV)',
                visa_expiry: '',
                salary: 0
            });
        }
    }, [worker, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error saving worker details');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-slate-50">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        {worker ? <FileText size={18} /> : <User size={18} />}
                        {worker ? 'Edit Worker Details' : 'Add New Sponsored Worker'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Basic Info Section */}
                        <div className="md:col-span-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Basic Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                                    <input
                                        type="text" required className="w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                    <input
                                        type="email" className="w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.email || ''}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
                                    <input
                                        type="text" className="w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.employee_id || ''}
                                        onChange={e => setFormData({ ...formData, employee_id: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                                    <input
                                        type="text" className="w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.job_title || ''}
                                        onChange={e => setFormData({ ...formData, job_title: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Visa & CoS Section */}
                        <div className="md:col-span-2 pt-4 border-t">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sponsorship & Visa</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                        <Briefcase size={14} /> Visa Type *
                                    </label>
                                    <select
                                        required className="w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        value={formData.visa_type}
                                        onChange={e => setFormData({ ...formData, visa_type: e.target.value })}
                                    >
                                        <option value="Health & Care (SWV)">Health & Care (SWV)</option>
                                        <option value="Skilled Worker">Skilled Worker</option>
                                        <option value="Student (20h max)">Student (20h max)</option>
                                        <option value="Graduate Visa">Graduate Visa</option>
                                        <option value="Family Visa">Family Visa</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                        <Calendar size={14} /> Visa Expiry Date *
                                    </label>
                                    <input
                                        type="date" required className="w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.visa_expiry}
                                        onChange={e => setFormData({ ...formData, visa_expiry: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">CoS Number</label>
                                    <input
                                        type="text" className="w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. C2X12345"
                                        value={formData.cos_number || ''}
                                        onChange={e => setFormData({ ...formData, cos_number: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Salary Component (£)</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><DollarSign size={14} /></div>
                                        <input
                                            type="number" className="w-full p-2 pl-8 border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.salary || 0}
                                            onChange={e => setFormData({ ...formData, salary: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RTW & Compliance */}
                        <div className="md:col-span-2 pt-4 border-t">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Identification & RTW</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">NI Number</label>
                                    <input
                                        type="text" className="w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.ni_number || ''}
                                        onChange={e => setFormData({ ...formData, ni_number: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Passport Number</label>
                                    <input
                                        type="text" className="w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.passport_number || ''}
                                        onChange={e => setFormData({ ...formData, passport_number: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                        <MapPin size={14} /> Work Location
                                    </label>
                                    <input
                                        type="text" className="w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.work_location || ''}
                                        onChange={e => setFormData({ ...formData, work_location: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Last RTW Check</label>
                                    <input
                                        type="date" className="w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.last_rtw_check || ''}
                                        onChange={e => setFormData({ ...formData, last_rtw_check: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Internal Notes</label>
                            <textarea
                                className="w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none text-sm"
                                placeholder="..."
                                value={formData.notes || ''}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex justify-end gap-3 sticky bottom-0 bg-white pt-4 border-t">
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
                            <Save size={16} />
                            {loading ? 'Saving...' : 'Save Worker Details'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
