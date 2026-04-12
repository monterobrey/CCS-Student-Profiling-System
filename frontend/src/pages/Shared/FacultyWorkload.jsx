import { useMemo } from 'react';
import '../../styles/Shared/FacultyWorkload.css';

const FacultyWorkload = ({ faculty = [] }) => {
  // Compute stats based on the faculty prop
  const miniStats = useMemo(() => [
    { label: 'Total Faculty', value: faculty.length, color: '#FF6B1A' },
    { 
      label: 'Full Load', 
      value: faculty.filter(f => f.units >= 18).length, 
      color: '#ef4444' 
    },
    { 
      label: 'Normal Load', 
      value: faculty.filter(f => f.units >= 12 && f.units < 18).length, 
      color: '#f59e0b' 
    },
    { 
      label: 'Light Load', 
      value: faculty.filter(f => f.units < 12).length, 
      color: '#16a34a' 
    },
    { 
      label: 'Total Subjects', 
      value: faculty.reduce((a, f) => a + (f.subjects?.length || 0), 0), 
      color: '#8b5cf6' 
    }
  ], [faculty]);

  const getLoadClass = (units) => {
    if (units >= 18) return 'load-full';
    if (units >= 12) return 'load-mid';
    return 'load-low';
  };

  const getBadgeClass = (units) => {
    if (units >= 18) return 'wl-full';
    if (units >= 12) return 'wl-normal';
    return 'wl-light';
  };

  const getLoadLabel = (units) => {
    if (units >= 18) return 'Full Load';
    if (units >= 12) return 'Normal Load';
    return 'Light Load';
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Faculty Workload & Schedules</h2>
          <p className="page-sub">Overview of faculty subject loads and teaching schedules.</p>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="mini-stats">
        {miniStats.map((s) => (
          <div className="mini-stat" key={s.label}>
            <span className="mini-stat-value" style={{ color: s.color }}>
              {s.value}
            </span>
            <span className="mini-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Faculty Cards */}
      <div className="faculty-grid">
        {faculty.map((f) => (
          <div className="faculty-card" key={f.id}>
            <div className="fc-header">
              <div className="fc-avatar" style={{ background: f.color }}>
                {f.name.charAt(0)}
              </div>
              <div className="fc-info">
                <p className="fc-name">{f.name}</p>
                <p className="fc-dept">{f.department}</p>
                <p className="fc-pos">{f.position}</p>
              </div>
              <div className={`fc-load ${getLoadClass(f.units)}`}>
                <span className="load-num">{f.units}</span>
                <span className="load-label">units</span>
              </div>
            </div>

            <div className="fc-subjects">
              {f.subjects.map((subj) => (
                <div className="fc-subject-row" key={subj.code}>
                  <span className="subj-code">{subj.code}</span>
                  <span className="subj-name">{subj.name}</span>
                  <span className="subj-section">{subj.section}</span>
                  <span className="subj-sched">{subj.schedule}</span>
                </div>
              ))}
            </div>

            <div className="fc-footer">
              <span className="fc-students">{f.totalStudents} students total</span>
              <span className={`workload-badge ${getBadgeClass(f.units)}`}>
                {getLoadLabel(f.units)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FacultyWorkload;