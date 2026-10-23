import React, { useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { ClinicService } from '../services/clinicService';
import type { ClinicCommunicationMessage } from '../types';
import {
  MessageSquare,
  Send,
  Mail,
  Smartphone,
  Bell,
  Clock,
  CheckCheck,
  AlertCircle,
  Info
} from 'lucide-react';

export const CommunicationSection: React.FC = () => {
  const { currentClinic, currentUser, reloadClinicData } = useClinic();
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [channel, setChannel] = useState<'Email' | 'SMS' | 'Portal Notice'>('Email');
  const [messageType, setMessageType] = useState<ClinicCommunicationMessage['type']>(
    'Appointment Confirmation'
  );
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isSentNotice, setIsSentNotice] = useState(false);

  if (!currentClinic) return null;

  const communications = ClinicService.getCommunications(currentClinic.id);
  const patients = ClinicService.getPatients(currentClinic.id);
  const appointments = ClinicService.getAppointments(currentClinic.id);

  const handleTemplateSelect = (type: ClinicCommunicationMessage['type']) => {
    setMessageType(type);
    const pat = patients.find((p) => p.id === selectedPatientId) || patients[0];
    const patName = pat ? pat.fullName : 'Patient';

    switch (type) {
      case 'Appointment Confirmation':
        setSubject(`Confirmed Consultation: ${currentClinic.name}`);
        setMessageBody(
          `Dear ${patName},\n\nYour upcoming consultation at ${currentClinic.name} has been verified and confirmed. Please arrive 10 minutes prior to complete initial check-in.\n\nWarm regards,\nClinic Operations`
        );
        break;
      case 'Alternative Slot Proposal':
        setSubject(`Schedule Modification Options for your visit`);
        setMessageBody(
          `Hi ${patName},\n\nDue to clinical scheduling constraints, we propose an alternative time for your appointment. Please reply or check your patient portal to accept.\n\nBest,\nPatient Scheduling Team`
        );
        break;
      case 'Follow-up Reminder':
        setSubject(`Care Plan & Follow-Up Reminder`);
        setMessageBody(
          `Hello ${patName},\n\nThis is a clinical reminder from your physician to review your progress and schedule your recommended follow-up assessment.\n\nSincerely,\n${currentClinic.name}`
        );
        break;
      case 'Consultation Instructions':
        setSubject(`Pre-Consultation Instructions & Laboratory Fasting`);
        setMessageBody(
          `Dear ${patName},\n\nFor your scheduled consultation tomorrow, please remain fasting for 8 hours prior if lipid profiling is planned. Ensure your current medications list is at hand.\n\nThank you,\nClinical Team`
        );
        break;
      case 'Cancellation Notice':
        setSubject(`Notice of Appointment Cancellation`);
        setMessageBody(
          `Dear ${patName},\n\nYour appointment has been cancelled as requested. If you need to rebook at a future date, our portal remains available.\n\nRegards,\nClinic Desk`
        );
        break;
      case 'Rescheduling Notice':
        setSubject(`Appointment Rescheduled`);
        setMessageBody(
          `Hi ${patName},\n\nYour consultation time has been successfully updated in our clinic calendar.\n\nThank you,\n${currentClinic.name}`
        );
        break;
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find((p) => p.id === selectedPatientId) || patients[0];
    if (!pat) return;

    ClinicService.sendMockMessage(currentClinic.id, {
      patientId: pat.id,
      patientName: pat.fullName,
      channel,
      type: messageType,
      subject: subject || `${messageType} from ${currentClinic.name}`,
      body: messageBody,
      sentBy: currentUser.fullName
    });

    reloadClinicData();
    setIsSentNotice(true);
    setMessageBody('');
    setSubject('');
    setTimeout(() => setIsSentNotice(false), 3000);
  };

  const getChannelIcon = (c: 'Email' | 'SMS' | 'Portal Notice') => {
    switch (c) {
      case 'Email':
        return <Mail size={14} style={{ color: '#38bdf8' }} />;
      case 'SMS':
        return <Smartphone size={14} style={{ color: '#34d399' }} />;
      case 'Portal Notice':
        return <Bell size={14} style={{ color: '#a855f7' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Disclaimer Alert */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          background: 'rgba(2, 132, 199, 0.08)',
          border: '1px solid rgba(2, 132, 199, 0.25)',
          borderRadius: 'var(--radius-md)',
          fontSize: '12px',
          color: '#93c5fd'
        }}
      >
        <Info size={18} style={{ flexShrink: 0 }} />
        <div>
          <strong>Mock Dispatch Pipeline:</strong> This demo interface simulates communication drafting and transmission. Messages are recorded in the clinic audit log with mock status tags. Real SMS/Email gateway integrations will be attached via the shared backend.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left: Message Composer */}
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">
              <MessageSquare size={16} style={{ color: '#38bdf8' }} /> Patient Communication Composer
            </h4>
            {isSentNotice && (
              <span className="badge badge-emerald">Dispatched to Mock Queue</span>
            )}
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Recipient Patient</label>
              <select
                className="form-select"
                value={selectedPatientId}
                onChange={(e) => {
                  setSelectedPatientId(e.target.value);
                  handleTemplateSelect(messageType);
                }}
              >
                <option value="">Select a clinic patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.phone} • {p.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Dispatch Channel</label>
                <select
                  className="form-select"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as any)}
                >
                  <option value="Email">Email Communication</option>
                  <option value="SMS">SMS Text Notification</option>
                  <option value="Portal Notice">In-Portal Patient Alert</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Message Intent Template</label>
                <select
                  className="form-select"
                  value={messageType}
                  onChange={(e) => handleTemplateSelect(e.target.value as any)}
                >
                  <option value="Appointment Confirmation">Appointment Confirmation</option>
                  <option value="Alternative Slot Proposal">Alternative Slot Proposal</option>
                  <option value="Rescheduling Notice">Rescheduling Notice</option>
                  <option value="Cancellation Notice">Cancellation Notice</option>
                  <option value="Follow-up Reminder">Follow-up Reminder</option>
                  <option value="Consultation Instructions">Consultation Instructions</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Subject / Header</label>
              <input
                type="text"
                required
                className="form-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Message Subject..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Message Content</label>
              <textarea
                required
                rows={5}
                className="form-textarea"
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Compose clear instructions or confirmation for the patient..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button type="submit" disabled={!selectedPatientId} className="btn-primary">
                <Send size={14} /> Send Patient Notice (Mock)
              </button>
            </div>
          </form>
        </div>

        {/* Right: Message History Panel */}
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">
              <Clock size={16} style={{ color: '#34d399' }} /> Sent Communication Audit Trail
            </h4>
            <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
              {communications.length} log items
            </span>
          </div>

          {communications.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', fontSize: '13px' }}>
              No outgoing communication logged for {currentClinic.name}.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
              {communications.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    padding: '12px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getChannelIcon(msg.channel)}
                      <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{msg.patientName}</strong>
                      <span className="tag-pill">{msg.type}</span>
                    </div>
                    <span className="badge badge-emerald" style={{ fontSize: '9px' }}>
                      {msg.mockDeliveryStatus}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8' }}>{msg.subject}</div>

                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'pre-line' }}>
                    {msg.body}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-subtle)', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px' }}>
                    <span>Sent by: {msg.sentBy}</span>
                    <span>{new Date(msg.sentAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
