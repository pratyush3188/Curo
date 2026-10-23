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
            Operational Overview & Clinical Schedule
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
      <div className="card" style={{ padding: '20px' }}>
        <div className="card-header" style={{ marginBottom: '16px' }}>
          <div>
            <h4 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} style={{ color: '#00838f' }} /> 7-Day Patient Volume & Operational Trend
            </h4>
            <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
              Daily consultation visits and patient volume distribution
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#00838f' }} />
              Patient Visits
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#059669' }} />
              Today
            </span>
          </div>
        </div>

        {/* Bar Chart Container */}
        <div style={{ position: 'relative', height: '240px', padding: '10px 0 24px 44px' }}>
          {/* Horizontal Gridlines & Y-axis labels */}
          {[10, 8, 6, 4, 2, 0].map((val) => (
            <div
              key={val}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: `${(val / 10) * 190 + 24}px`,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <span
                style={{
                  width: '36px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-subtle)',
                  textAlign: 'right',
                  paddingRight: '8px'
                }}
              >
                {val}
              </span>
              <div
                style={{
                  flex: 1,
                  height: '1px',
                  background: val === 0 ? 'var(--border-color)' : 'rgba(226, 232, 240, 0.7)',
                  borderTop: val === 0 ? '1px solid #cbd5e1' : 'none'
                }}
              />
            </div>
          ))}

          {/* Bars */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              height: '190px',
              position: 'relative',
              zIndex: 1,
              marginLeft: '4px'
            }}
          >
            {metrics.recent7Days.map((item, idx) => {
              const maxVal = 10;
              const heightPercent = Math.min(100, (item.count / maxVal) * 100);
              const isToday = item.date.includes('Today');

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1,
                    maxWidth: '80px',
                    height: '100%',
                    justifyContent: 'flex-end'
                  }}
                >
                  {/* Tooltip / Data Label on top of bar */}
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isToday ? '#059669' : '#00838f',
                      marginBottom: '6px'
                    }}
                  >
                    {item.count}
                  </span>

                  {/* Bar Body */}
                  <div
                    style={{
                      width: '42px',
                      height: `${Math.max( heightPercent, 5 )}%`,
                      background: isToday
                        ? 'linear-gradient(180deg, #059669 0%, #10b981 60%, rgba(16, 185, 129, 0.35) 100%)'
                        : 'linear-gradient(180deg, #00838f 0%, #00acc1 60%, rgba(0, 131, 143, 0.3) 100%)',
                      borderRadius: '6px 6px 0 0',
                      border: isToday ? '1px solid #059669' : '1px solid #00838f',
                      boxShadow: isToday
                        ? '0 3px 8px rgba(5, 150, 105, 0.25)'
                        : '0 3px 8px rgba(0, 131, 143, 0.2)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer'
                    }}
                    title={`${item.date}: ${item.count} patients · Estimated Revenue: ₹${item.revenue}`}
                  />

                  {/* X-axis Label below bar */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-24px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: isToday ? 700 : 500,
                        color: isToday ? '#059669' : 'var(--text-muted)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.date}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart Summary Footer */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '14px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: 'var(--text-muted)'
          }}
        >
          <div>
            Total 7-Day Patient Visits:{' '}
            <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>
              {metrics.recent7Days.reduce((acc, curr) => acc + curr.count, 0)} patients
            </strong>
          </div>
          <div>
            Daily Average:{' '}
            <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>
              {(metrics.recent7Days.reduce((acc, curr) => acc + curr.count, 0) / metrics.recent7Days.length).toFixed(1)} / day
            </strong>
          </div>
          <div>
            Highest Volume Day:{' '}
            <strong style={{ color: '#00838f', fontSize: '13px' }}>
              {(() => {
                const maxDay = metrics.recent7Days.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), metrics.recent7Days[0]);
                return `${maxDay.date} (${maxDay.count} visits)`;
              })()}
            </strong>
          </div>
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
