import React from 'react';
import { ChevronLeft, Eye, ExternalLink, Loader2, Save } from 'lucide-react';
import { navigate } from '../../utils/navigation';

interface WhiteboardTopBarProps {
    title: string;
    isSaving: boolean;
    derivedReadOnly: boolean;
    onTitleChange: (title: string) => void;
    onTitleBlur: () => void;
}

const WhiteboardTopBar: React.FC<WhiteboardTopBarProps> = ({
    title,
    isSaving,
    derivedReadOnly,
    onTitleChange,
    onTitleBlur
}) => {
    return (
        <header style={{
            height: '56px', minHeight: '56px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '0 16px',
            borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff', zIndex: 50,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                    onClick={() => navigate(derivedReadOnly ? '/community' : '/dashboard')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '4px', padding: '8px',
                        borderRadius: '8px', border: 'none', backgroundColor: 'transparent',
                        cursor: 'pointer', color: '#6b7280', fontSize: '14px', fontWeight: 500,
                    }}
                >
                    <ChevronLeft size={20} />
                    <span>{derivedReadOnly ? 'Back' : 'Dashboard'}</span>
                </button>
                <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb' }} />

                {derivedReadOnly ? (
                    <span style={{ fontWeight: 700, fontSize: '18px', color: '#111827' }}>
                        {title || 'Untitled Whiteboard'}
                    </span>
                ) : (
                    <input
                        type="text"
                        value={title}
                        onChange={(event) => onTitleChange(event.target.value)}
                        onBlur={onTitleBlur}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                (event.target as HTMLInputElement).blur();
                            }
                        }}
                        style={{
                            fontWeight: 700, fontSize: '18px', backgroundColor: 'transparent',
                            border: 'none', outline: 'none', color: '#111827', width: '300px',
                        }}
                        placeholder="Untitled Whiteboard"
                    />
                )}

                {derivedReadOnly && (
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '4px 10px', borderRadius: '9999px',
                        backgroundColor: '#f3f4f6', color: '#6b7280',
                        fontSize: '12px', fontWeight: 600,
                    }}>
                        <Eye size={14} />
                        View Only
                    </span>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {derivedReadOnly ? (
                    <a
                        href="/whiteboard"
                        onClick={(event) => { event.preventDefault(); navigate('/whiteboard'); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '6px 14px', borderRadius: '8px',
                            backgroundColor: '#4f46e5', color: '#ffffff',
                            fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                        }}
                    >
                        Create your own on CareerVivid
                        <ExternalLink size={14} />
                    </a>
                ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#9ca3af', fontSize: '13px' }}>
                        {isSaving
                            ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                            : <><Save size={14} /> Saved</>
                        }
                    </span>
                )}
            </div>
        </header>
    );
};

export default WhiteboardTopBar;
