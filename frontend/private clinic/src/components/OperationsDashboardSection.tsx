import React from 'react';
import { useClinic } from '../context/ClinicContext';
import { ClinicService } from '../services/clinicService';
import {
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  IndianRupee,
  TrendingUp,
  Activity,
  UserCheck,
  CreditCard,
  Briefcase
} from 'lucide-react';

export const OperationsDashboardSection: React.FC = () => {
  const { currentClinic, isDoctor, activeDoctor } = useClinic();

  if (!currentClinic) return null;

  const metrics = ClinicService.getDashboardMetrics(currentClinic.id);
  const appointments = ClinicService.getAppointments(currentClinic.id);

  // Filter today's consultations/appointments
  const allTodayList = appointments.filter((a) => a.confirmedSlot || a.status === 'Completed');

  // If logged in as doctor (e.g. Dr. Rajesh Sharma), strictly only show their patient schedule
  const todayList = isDoctor && activeDoctor
    ? allTodayList.filter(
        (a) => a.doctorId === activeDoctor.id || a.doctorName.toLowerCase().includes(activeDoctor.fullName.toLowerCase())
      )
    : allTodayList;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner Notice */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 18px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}
      >
        <div>
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>
            Operational Overview & Clinical Schedule: {currentClinic.name}
          </span>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Live clinical appointments, visiting roster, and daily patient activity.
          </div>
        </div>
        <span className="badge badge-emerald">Live Queue</span>
      </div>

      {/* Primary KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px' }}>
            <span>Scheduled Today</span>
            <Calendar size={16} style={{ color: '#00838f' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '8px', color: 'var(--text-main)' }}>
            {metrics.todayAppointmentsCount}
          </div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>
            {metrics.completedTodayCount} visits completed
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px' }}>
            <span>Pending Enquiries</span>
            <Clock size={16} style={{ color: '#d97706' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '8px', color: '#d97706' }}>
            {metrics.pendingEnquiriesCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Awaiting receptionist / coordinator review
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px' }}>
            <span>Patients Registered</span>
            <Users size={16} style={{ color: '#4f46e5' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '8px', color: 'var(--text-main)' }}>
            {metrics.totalPatientsCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '4px' }}>
            {metrics.newPatientsCount} new vs {metrics.returningPatientsCount} returning
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px' }}>
            <span>Doctor Availability</span>
            <UserCheck size={16} style={{ color: '#059669' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '8px', color: '#059669' }}>
            {metrics.activeDoctorsCount} / {metrics.totalDoctorsCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Specialists on active roster
          </div>
        </div>
      </div>

      {/* Today's Schedule Overview */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">
            <Activity size={16} style={{ color: '#00838f' }} /> Today's Confirmed Patient Roster
            {isDoctor && activeDoctor && (
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#00838f', marginLeft: '6px' }}>
                (Showing patients for {activeDoctor.fullName} only)
              </span>
            )}
          </h4>
        </div>

        {todayList.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {isDoctor && activeDoctor
              ? `No confirmed appointments scheduled for ${activeDoctor.fullName} today.`
              : 'No confirmed appointments scheduled for today.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {todayList.map((apt) => (
              <div
                key={apt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13px'
                }}
              >
                <div>
                  <strong style={{ color: 'var(--text-main)', fontSize: '14px' }}>{apt.patientName}</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {apt.serviceName} with <span style={{ fontWeight: 600, color: '#00838f' }}>{apt.doctorName}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <span className="badge badge-indigo">{apt.consultationMode}</span>
                  <div style={{ fontSize: '12px', color: 'var(--text-subtle)', marginTop: '3px', fontWeight: 500 }}>
                    {apt.confirmedSlot?.startTime || '09:30'} – {apt.confirmedSlot?.endTime || '10:00'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={apt.paymentStatus === 'Paid' ? 'badge badge-emerald' : 'badge badge-amber'}>
                    ₹{apt.fee} • {apt.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Chart: 7-Day Patient Volume Trend */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">
            <TrendingUp size={16} style={{ color: '#00838f' }} /> 7-Day Patient Volume & Operational Trend
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
            Daily consultation flow
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '170px', paddingTop: '20px', paddingBottom: '10px' }}>
          {metrics.recent7Days.map((item, idx) => {
            const heightPercent = Math.min(100, Math.max(20, (item.count / 10) * 100));
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#00838f' }}>{item.count} visits</span>
                <div
                  style={{
                    width: '38px',
                    height: `${heightPercent}%`,
                    background: 'linear-gradient(180deg, #00838f 0%, rgba(0, 131, 143, 0.2) 100%)',
                    borderRadius: '6px 6px 0 0',
                    transition: 'height 0.3s ease',
                    border: '1px solid #00acc1'
                  }}
                  title={`Revenue: ₹${item.revenue}`}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.date}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue & Billing Summary — Placed at the LAST position */}
      <div style={{ marginTop: '10px' }}>
        <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IndianRupee size={18} style={{ color: '#00838f' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
            Financial & Revenue Summary (Placed at Bottom)
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          <div className="card" style={{ borderLeft: '4px solid #00838f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#00838f', textTransform: 'uppercase' }}>
                  Today's Estimated Revenue
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>
                  ₹{metrics.todayEstimatedRevenue}
                </div>
              </div>
              <IndianRupee size={28} style={{ color: '#00838f', opacity: 0.8 }} />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Total fees for all confirmed visits scheduled today. Includes pending settlements.
            </p>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #059669' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#059669', textTransform: 'uppercase' }}>
                  Today's Collected Revenue
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>
                  ₹{metrics.todayCollectedRevenue}
                </div>
              </div>
              <CreditCard size={28} style={{ color: '#059669', opacity: 0.8 }} />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Confirmed paid patient fees settled at reception or online.
            </p>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #7c3aed' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#7c3aed', textTransform: 'uppercase' }}>
                  Clinic Lifetime Collected
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>
                  ₹{metrics.allTimeCollectedRevenue}
                </div>
              </div>
              <Briefcase size={28} style={{ color: '#7c3aed', opacity: 0.8 }} />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Total cumulative payments received for {currentClinic.name}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
