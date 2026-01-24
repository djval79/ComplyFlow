import { useState, useEffect } from 'react';
import { Cookie, Shield, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

// ============ TYPES ============
interface CookiePreferences {
    essential: true; // Always true, required for site operation
    analytics: boolean;
    marketing: boolean;
    consentedAt: string; // ISO timestamp
}

const STORAGE_KEY = 'complyflow_cookie_consent';

// ============ COMPONENT ============
export const CookieConsent = () => {
    const [visible, setVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [preferences, setPreferences] = useState<CookiePreferences>({
        essential: true,
        analytics: true,
        marketing: false,
        consentedAt: ''
    });

    useEffect(() => {
        // Check if user has already consented
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            // Small delay for smooth appearance after page load
            const timer = setTimeout(() => setVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const saveConsent = (prefs: CookiePreferences) => {
        const withTimestamp = { ...prefs, consentedAt: new Date().toISOString() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(withTimestamp));
        setVisible(false);

        // Dispatch event for analytics to pick up
        window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: withTimestamp }));
    };

    const handleAcceptAll = () => {
        saveConsent({
            essential: true,
            analytics: true,
            marketing: true,
            consentedAt: ''
        });
    };

    const handleRejectNonEssential = () => {
        saveConsent({
            essential: true,
            analytics: false,
            marketing: false,
            consentedAt: ''
        });
    };

    const handleSavePreferences = () => {
        saveConsent(preferences);
    };

    if (!visible) return null;

    return (
        <div className="cookie-consent-overlay">
            <div className="cookie-consent-banner">
                {/* Header */}
                <div className="cookie-consent-header">
                    <div className="cookie-consent-title">
                        <Cookie size={24} />
                        <span>Cookie Preferences</span>
                    </div>
                    <button
                        className="cookie-consent-close"
                        onClick={handleRejectNonEssential}
                        aria-label="Close and reject non-essential cookies"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="cookie-consent-content">
                    <p>
                        We use cookies to enhance your experience, analyse site traffic, and for marketing purposes.
                        By clicking "Accept All", you consent to our use of cookies.
                        Read our <Link to="/privacy" className="cookie-consent-link">Privacy Policy</Link> for more information.
                    </p>

                    {/* Expandable Details */}
                    <button
                        className="cookie-consent-toggle"
                        onClick={() => setShowDetails(!showDetails)}
                    >
                        {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        <span>Manage Preferences</span>
                    </button>

                    {showDetails && (
                        <div className="cookie-consent-details">
                            {/* Essential */}
                            <div className="cookie-category">
                                <div className="cookie-category-header">
                                    <div className="cookie-category-info">
                                        <Shield size={18} />
                                        <strong>Essential Cookies</strong>
                                    </div>
                                    <span className="cookie-required-badge">Always Active</span>
                                </div>
                                <p className="cookie-category-desc">
                                    Required for the website to function. Cannot be disabled.
                                </p>
                            </div>

                            {/* Analytics */}
                            <div className="cookie-category">
                                <div className="cookie-category-header">
                                    <div className="cookie-category-info">
                                        <strong>Analytics Cookies</strong>
                                    </div>
                                    <label className="cookie-toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={preferences.analytics}
                                            onChange={(e) => setPreferences(p => ({ ...p, analytics: e.target.checked }))}
                                        />
                                        <span className="cookie-toggle-slider"></span>
                                    </label>
                                </div>
                                <p className="cookie-category-desc">
                                    Help us understand how visitors interact with our website.
                                </p>
                            </div>

                            {/* Marketing */}
                            <div className="cookie-category">
                                <div className="cookie-category-header">
                                    <div className="cookie-category-info">
                                        <strong>Marketing Cookies</strong>
                                    </div>
                                    <label className="cookie-toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={preferences.marketing}
                                            onChange={(e) => setPreferences(p => ({ ...p, marketing: e.target.checked }))}
                                        />
                                        <span className="cookie-toggle-slider"></span>
                                    </label>
                                </div>
                                <p className="cookie-category-desc">
                                    Used to deliver relevant advertisements and track campaign performance.
                                </p>
                            </div>

                            <button
                                className="btn btn-secondary cookie-save-btn"
                                onClick={handleSavePreferences}
                            >
                                Save Preferences
                            </button>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="cookie-consent-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={handleRejectNonEssential}
                    >
                        Reject Non-Essential
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleAcceptAll}
                    >
                        Accept All
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============ UTILITY FUNCTION ============
/**
 * Check if user has consented to a specific cookie category
 */
export const hasConsentFor = (category: 'analytics' | 'marketing'): boolean => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return false;
        const prefs: CookiePreferences = JSON.parse(stored);
        return prefs[category] === true;
    } catch {
        return false;
    }
};

/**
 * Get all cookie preferences
 */
export const getCookiePreferences = (): CookiePreferences | null => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;
        return JSON.parse(stored);
    } catch {
        return null;
    }
};
