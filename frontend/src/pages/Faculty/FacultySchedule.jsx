import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import '../../styles/Faculty/FacultySchedule.css';

const FacultySchedule = () => {
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [sectionStudents, setSectionStudents] = useState([]);

  // Constants for Grid Logic
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const START_MINUTES = 7 * 60; // 7:00 AM
  const MINUTES_PER_ROW = 15;

  const timeLabels = [
    '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
    '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'
  ];

  const [scheduleStats, setScheduleStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    pendingSetup: 0,
    bscsStudents: 0,
    bsitStudents: 0
  });

  const todayLabel = useMemo(() => 
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }), 
  []);

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (hours === 12) hours = 0;
      if (modifier === 'PM') hours += 12;
      return hours * 60 + (minutes || 0);
    } else {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + (minutes || 0);
    }
  };

  const formattedSchedule = useMemo(() => {
    if (!Array.isArray(schedule)) return [];

    return schedule.map(item => {
      if (!item || !item.startTime || !item.endTime || !item.dayOfWeek) return null;

      const start = timeToMinutes(item.startTime);
      const end = timeToMinutes(item.endTime);
      const duration = end - start;

      const startRow = Math.floor((start - START_MINUTES) / MINUTES_PER_ROW) + 2;
      const rowSpan = Math.max(1, Math.floor(duration / MINUTES_PER_ROW));

      const dayName = item.dayOfWeek.charAt(0).toUpperCase() + item.dayOfWeek.slice(1).toLowerCase();
      let colIndex = days.indexOf(dayName);

      if (colIndex === -1) {
        const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        colIndex = shortDays.indexOf(dayName.slice(0, 3));
      }

      if (colIndex === -1) return null;
      const colPosition = colIndex + 2;

      return {
        ...item,
        gridArea: `${startRow} / ${colPosition} / span ${rowSpan} / ${colPosition}`
      };
    }).filter(Boolean);
  }, [schedule]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/faculty/schedule');
      const scheduleData = response.data;
      setSchedule(scheduleData);

      // Calculate stats from API data
      let total = 0;
      let bscs = 0;
      let bsit = 0;
      scheduleData.forEach(item => {
        const enrolled = item.enrolled_students || 0;
        total += enrolled;
        if (item.section?.program?.code === 'BSCS') bscs += enrolled;
        if (item.section?.program?.code === 'BSIT') bsit += enrolled;
      });
      setScheduleStats({
        totalStudents: total,
        activeStudents: total,
        pendingSetup: 0,
        bscsStudents: bscs,
        bsitStudents: bsit
      });
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewStudents = async (item) => {
    setSelectedSection(item);
    setLoadingStudents(true);
    try {
      const response = await axios.get(`/faculty/sections/${item.section_id}/students`);
      setSectionStudents(response.data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  return (
    <div className="faculty-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">My Teaching Schedule</h2>
          <p className="page-sub">View your assigned courses and enrolled students.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card stat-card-blue">
          <div className="stat-icon stat-icon-blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div className="stat-content">
            <span className="stat-number stat-number-blue">{scheduleStats.totalStudents}</span>
            <span className="stat-label">TOTAL STUDENTS</span>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-icon stat-icon-green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div className="stat-content">
            <span className="stat-number stat-number-green">{scheduleStats.activeStudents}</span>
            <span className="stat-label">ACTIVE</span>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-icon stat-icon-purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="stat-content">
            <span className="stat-number">{scheduleStats.pendingSetup}</span>
            <span className="stat-label">PENDING SETUP</span>
          </div>
        </div>

        <div className="stat-card stat-card-orange">
          <div className="stat-icon stat-icon-orange">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div className="stat-content">
            <span className="stat-number stat-number-orange">{scheduleStats.bscsStudents}</span>
            <span className="stat-label">BSCS</span>
          </div>
        </div>

        <div className="stat-card stat-card-red">
          <div className="stat-icon stat-icon-red">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div className="stat-content">
            <span className="stat-number stat-number-red">{scheduleStats.bsitStudents}</span>
            <span className="stat-label">BSIT</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <span className="spinner"></span>
          Loading schedule...
        </div>
      ) : (
        <div className="calendar-card">
          <div className="calendar-wrapper">
            <div className="calendar-grid">
              <div className="time-header"></div>
              {days.map(day => (
                <div key={day} className="day-header">{day}</div>
              ))}

              {timeLabels.map((time, tIdx) => (
                <React.Fragment key={time}>
                  <div className="time-label">{time}</div>
                  {days.map(day => (
                    <div key={`${day}-${time}`} className="grid-cell"></div>
                  ))}
                </React.Fragment>
              ))}

              {formattedSchedule.map((item, index) => (
                <div 
                  key={index}
                  className="schedule-item"
                  style={{
                    gridArea: item.gridArea,
                    backgroundColor: item.color || '#FF6B1A',
                    borderLeft: '3px solid rgba(0,0,0,0.15)'
                  }}
                  onClick={() => viewStudents(item)}
                >
                  <div className="item-content">
                    <div className="item-name">{item.course.course_name}</div>
                    <div className="item-meta">
                      <span className="item-code">{item.course.course_code}</span>
                      <span className="item-sep">|</span>
                      <span className="item-section">{item.section.section_name}</span>
                      <span className="item-sep">|</span>
                      <span className="item-room">{item.room}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedSection && (
        <div className="modal-overlay" onClick={() => setSelectedSection(null)}>
          <div className="modal-content pcard" onClick={e => e.stopPropagation()}>
            <div className="modal-header-styled">
              <div className="modal-title-info">
                <h3>Students in {selectedSection.section.section_name}</h3>
                <p className="modal-subtitle">
                  {selectedSection.course.course_code} · {selectedSection.course.course_name}
                </p>
              </div>
              <button className="close-btn" onClick={() => setSelectedSection(null)}>&times;</button>
            </div>
            <div className="modal-body-styled">
              {loadingStudents ? (
                <div className="loading-small">
                  <span className="spinner-sm"></span>
                  Loading student list...
                </div>
              ) : (
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Student Number</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionStudents.map(student => (
                      <tr key={student.id}>
                        <td className="id-cell">{student.user.student_number}</td>
                        <td className="name-cell">{student.first_name} {student.last_name}</td>
                        <td>
                          <span className={`status-badge ${student.user.status}`}>
                            {student.user.status}
                          </span>
                        </td>
                        <td className="text-right">
                          <button className="report-btn">Report Violation</button>
                        </td>
                      </tr>
                    ))}
                    {sectionStudents.length === 0 && (
                      <tr>
                        <td colSpan="4" className="empty-row">No students enrolled in this section yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultySchedule;