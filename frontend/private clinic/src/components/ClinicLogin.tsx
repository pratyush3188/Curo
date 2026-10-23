import React, { useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { Hospital, Lock, ShieldCheck, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export const ClinicLogin: React.FC = () => {
  const { loginClinic } = useClinic();
  const [clinicId, setClinicId] = useState('curo-care');
  const [password, setPassword] = useState('curo2026');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const success = loginClinic(clinicId, password);
      if (!success) {
        setError('Invalid Clinic Unique ID or Passcode. Please check your credentials.');
      }
      setLoading(false);
    }, 400);
  };

  const handleFillDemo = (id: string, pass: string) => {
    setClinicId(id);
    setPassword(pass);
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 50%, #f8fafc 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'var(--font-family)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 131, 143, 0.1), 0 8px 10px -6px rgba(0, 131, 143, 0.05)',
          border: '1px solid #ccfbf1',
          overflow: 'hidden'
        }}
      >
        {/* Brand header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #00838f 0%, #00acc1 100%)',
            padding: '28px 24px',
            color: '#ffffff',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}
          >
            <Hospital size={28} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            CURO CLINIC PORTAL
          </h1>
          <p style={{ fontSize: '13px', color: '#e0f7fa', marginTop: '6px', opacity: 0.9 }}>
            Private Clinic Access & Clinical Management System
          </p>
        </div>

        {/* Form Body */}
        <div style={{ padding: '28px 24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
              Clinic Staff Sign-in
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Sign in using the unique clinic access ID and security key.
            </p>
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#b91c1c',
                fontSize: '12px',
                marginBottom: '16px'
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                  display: 'block',
                  marginBottom: '6px'
                }}
              >
                Clinic Unique ID
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8'
                  }}
                >
                  <Hospital size={16} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. curo-care"
                  value={clinicId}
                  onChange={(e) => setClinicId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                  display: 'block',
                  marginBottom: '6px'
                }}
              >
                Security Passcode
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8'
                  }}
                >
                  <KeyRound size={16} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Enter clinic password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '11px',
                background: '#00838f',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '6px',
                boxShadow: '0 4px 6px -1px rgba(0, 131, 143, 0.25)',
                transition: 'background 0.15s ease'
              }}
            >
              {loading ? 'Authenticating...' : 'Enter Clinic Dashboard'} <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Credentials helper */}
          <div
            style={{
              marginTop: '22px',
              padding: '14px',
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f766e', fontSize: '12px', fontWeight: 700 }}>
              <ShieldCheck size={16} /> Demo Clinic Credentials
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px', lineHeight: 1.5 }}>
              Click to quickly fill authorized clinic credentials:
            </div>
            <button
              type="button"
              onClick={() => handleFillDemo('curo-care', 'curo2026')}
              style={{
                marginTop: '8px',
                width: '100%',
                textAlign: 'left',
                background: '#ffffff',
                border: '1px solid #99f6e4',
                padding: '8px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: 600, color: '#0f766e' }}>Curo Multispeciality Clinic</div>
              <div style={{ color: '#64748b' }}>ID: <strong>curo-care</strong> | Pass: <strong>curo2026</strong></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
