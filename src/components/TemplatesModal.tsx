import React, { useState, useEffect } from 'react';
import { X, Save, Download, Trash2, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRotaTemplates, createRotaTemplate, applyRotaTemplate, type RotaTemplate, type Shift } from '../services/rotaService';

interface TemplatesModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentShifts: Shift[];
    weekStart: Date;
    onTemplateApplied: () => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
    isOpen,
    onClose,
    currentShifts,
    weekStart,
    onTemplateApplied
}) => {
    const { profile } = useAuth();
    const [mode, setMode] = useState<'list' | 'save'>('list');
    const [templates, setTemplates] = useState<RotaTemplate[]>([]);
    const [loading, setLoading] = useState(false);

    // Save Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadTemplates();
            setMode('list');
        }
    }, [isOpen]);

    const loadTemplates = async () => {
        if (!profile?.organization_id) return;
        setLoading(true);
        const data = await getRotaTemplates(profile.organization_id);
        setTemplates(data);
        setLoading(false);
    };

    const handleSaveTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.organization_id) return;

        setLoading(true);
        try {
            await createRotaTemplate(
                profile.organization_id,
                name,
                description,
                currentShifts,
                weekStart
            );
            await loadTemplates();
            setMode('list');
            setName('');
            setDescription('');
        } catch (error) {
            console.error(error);
            alert('Failed to save template');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyTemplate = async (templateId: string) => {
        if (!profile?.organization_id) return;
        if (!confirm('This will add shifts from the template to the current week. Continue?')) return;

        setLoading(true);
        try {
            await applyRotaTemplate(
                profile.organization_id,
                templateId,
                weekStart
            );
            onTemplateApplied();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to apply template');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-slate-50">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        {mode === 'list' ? (
                            <>
                                <Calendar size={18} /> Rota Templates
                            </>
                        ) : (
                            <>
                                <Save size={18} /> Save Current Week as Template
                            </>
                        )}
                    </h3>
                    <div className="flex items-center gap-2">
                        {mode === 'list' && (
                            <button
                                onClick={() => setMode('save')}
                                className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-medium hover:bg-blue-100"
                            >
                                + Save Current Week
                            </button>
                        )}
                        {mode === 'save' && (
                            <button
                                onClick={() => setMode('list')}
                                className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium hover:bg-slate-200"
                            >
                                Back to List
                            </button>
                        )}
                        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors ml-2">
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading && (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        </div>
                    )}

                    {!loading && mode === 'list' && (
                        <div className="space-y-3">
                            {templates.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <div className="mb-2">No templates found.</div>
                                    <div className="text-sm">Set up a week of shifts and click "Save Current Week" to create a template.</div>
                                </div>
                            ) : (
                                templates.map(template => (
                                    <div key={template.id} className="border rounded-lg p-4 hover:border-blue-300 transition-colors group relative">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-medium text-slate-900">{template.name}</h4>
                                                {template.description && (
                                                    <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                                                )}
                                                <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
                                                    <span>{template.schedule_data.length} shifts</span>
                                                    <span>•</span>
                                                    <span>Created {new Date(template.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleApplyTemplate(template.id)}
                                                className="btn btn-secondary text-xs flex items-center gap-1"
                                            >
                                                <Download size={14} /> Apply to Current Week
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {!loading && mode === 'save' && (
                        <form onSubmit={handleSaveTemplate} className="space-y-4 max-w-lg mx-auto py-4">
                            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 mb-4">
                                This will save the <strong>{currentShifts.length} shifts</strong> currently visible on the week view as a reusable template.
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Standard Week A"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                                <textarea
                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none text-sm"
                                    placeholder="e.g. 4 Nurses, 2 Seniors, 6 Carers..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMode('list')}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2"
                                >
                                    <Save size={16} /> Save Template
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
