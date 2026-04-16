import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { facultyService } from '../../services';
import '../../styles/Shared/FacultyWorkload.css';

const COLORS = ['#FF6B1A', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

const getColor = (id) => COLORS[id % COLORS.length];

export default function FacultyWorkload() {
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterLoad, setFilterLoad] = useState('');
  
  // State to control the schedule modal
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  const { data: facultyData = [], isLoading } = useQuery({
    queryKey: ['faculty'],
    queryFn: async () => {
      const res = await facultyService.getAll();
      return res.ok ? (res.data ?? []) : [];
    },
    staleTime: Infinity,
  });

  // Transform + derive workload data from cached faculty
  const faculty = useMemo(() => facultyData.map(f => {
    const schedules = f.schedules || [];
    const seen = new Set();
    let totalUnits = 0;
    
    schedules.forEach(s => {
      const key = `${s.course_id}-${s.section_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        totalUnits += parseFloat(s.course?.units || 0);
      }
    });

    const subjects = [...new Map(schedules.map(s => [
      `${s.course_id}-${s.section_id}`,
      {
        code:     s.course?.course_code || 'N/A',
        name:     s.course?.course_name || 'Untitled',
        section:  s.section?.section_name || 'N/A',
        schedule: s.dayOfWeek ? `${s.dayOfWeek} ${s.startTime || ''}-${s.endTime || ''}`.trim() : 'TBA',
      }
    ])).values()];

    const uniqueSections = new Map();
    schedules.forEach(s => {
      if (s.section_id && !uniqueSections.has(s.section_id)) {
        uniqueSections.set(s.section_id, s.section?.students_count || 0);
      }
    });
    
    const totalStudents = [...uniqueSections.values()].reduce((sum, c) => sum + c, 0);

    return {
      id:            f.id,
      name:          `${f.last_name}, ${f.first_name}`,
      department:    f.department?.department_name || 'N/A',
      position:      f.position || 'Faculty',
      units:         totalUnits,
      subjects,
      totalStudents,
      color:         getColor(f.id),
    };
  }), [facultyData]);

  // Unique departments for filter dropdown
  const departments = useMemo(() => [...new Set(faculty.map(f => f.department).filter(Boolean))].sort(), [faculty]);

  const filtered = useMemo(() => faculty.filter(f => {
    const matchSearch = !search     || f.name.toLowerCase().includes(search.toLowerCase()) || f.department.toLowerCase().includes(search.toLowerCase());
    const matchDept   = !filterDept || f.department === filterDept;
    const matchLoad   = !filterLoad
      || (filterLoad === 'full'   && f.units >= 18)
      || (filterLoad === 'normal' && f.units >= 12 && f.units < 18)
      || (filterLoad === 'light'  && f.units < 12);
    return matchSearch && matchDept && matchLoad;
  }), [faculty, search, filterDept, filterLoad]);

  const miniStats = useMemo(() => {
    const withSchedules = faculty.filter(f => f.subjects.length > 0);
    return [
      { label: 'Total Faculty',  value: faculty.length,                                      color: '#FF6B1A' },
      { label: 'Full Load',      value: withSchedules.filter(f => f.units >= 18).length,     color: '#ef4444' },
      { label: 'Normal Load',    value: withSchedules.filter(f => f.units >= 12 && f.units < 18).length, color: '#f59e0b' },
      { label: 'Light Load',     value: withSchedules.filter(f => f.units > 0 && f.units < 12).length, color: '#16a34a' },
      { label: 'Total Subjects', value: faculty.reduce((a, f) => a + f.subjects.length, 0),  color: '#8b5cf6' },
    ];
  }, [faculty]);

  const getLoadClass = (units) => units >= 18 ? 'load-full' : units >= 12 ? 'load-mid' : 'load-low';
  const getBadgeClass = (units) => units >= 18 ? 'wl-full' : units >= 12 ? 'wl-normal' : 'wl-light';
  const getLoadLabel  = (units) => units >= 18 ? 'Full Load' : units >= 12 ? 'Normal Load' : 'Light Load';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Faculty Workload &amp; Schedules</h2>
          <p className="page-sub">Overview of faculty subject loads and teaching schedules.</p>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="mini-stats">
        {miniStats.map((s) => (
          <div className="mini-stat" key={s.label}>
            <span className="mini-stat-value" style={{ color: s.color }}>{s.value}</span>
            <span className="mini-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Enhanced Toolbar */}
      <div className="table-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 18 18" fill="none" width="18" height="18">
            <path d="M8 15A7 7 0 108 1a7 7 0 000 14zM18 18l-4-4" stroke="#9a8070" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search by name or department..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <div className="toolbar-divider"></div>
        <div className="filter-group">
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filterLoad} onChange={e => setFilterLoad(e.target.value)}>
            <option value="">All Loads</option>
            <option value="full">Full Load (≥18)</option>
            <option value="normal">Normal Load (12–17)</option>
            <option value="light">Light Load (&lt;12)</option>
          </select>
        </div>
      </div>

      {/* Faculty Cards Grid */}
      {isLoading ? (
        <div className="loading-overlay">
          <div className="spinner-lg"></div>
          <p>Fetching faculty workload...</p>
        </div>
      ) : (
        <div className="faculty-grid">
          {filtered.length === 0 && (
            <p style={{ color: '#b89f90', fontStyle: 'italic', padding: '1rem', gridColumn: '1 / -1' }}>
              No faculty members found.
            </p>
          )}
          {filtered.map((f) => (
            <div className="faculty-card interactive" key={f.id} onClick={() => setSelectedFaculty(f)}>
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

              <div className="fc-footer">
                <span className="fc-students">{f.totalStudents} students total</span>
                <span className={`workload-badge ${getBadgeClass(f.units)}`}>
                  {getLoadLabel(f.units)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      {selectedFaculty && (
        <div className="modal-overlay" onClick={() => setSelectedFaculty(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{selectedFaculty.name}'s Schedule</h3>
                <p>{selectedFaculty.units} Total Units Assigned</p>
              </div>
              <button className="modal-close" onClick={() => setSelectedFaculty(null)}>✕</button>
            </div>
            
            <div className="modal-body">
              {selectedFaculty.subjects.length > 0 ? (
                <div className="calendar-ui">
                  {selectedFaculty.subjects.map((subj) => (
                    <div className="calendar-row" key={`${subj.code}-${subj.section}`}>
                      <div className="cal-time">
                        <span className="cal-day">{subj.schedule.split(' ')[0]}</span>
                        <span className="cal-hours">{subj.schedule.substring(subj.schedule.indexOf(' ') + 1)}</span>
                      </div>
                      <div className="cal-details">
                        <span className="cal-code">{subj.code}</span>
                        <span className="cal-name">{subj.name}</span>
                        <span className="cal-section">Sec: {subj.section}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-subjects-modal">
                   No subjects assigned for this semester.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}