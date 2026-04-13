import React, { useState } from "react";
import '../../styles/Faculty/FacultySchedule.css';
import { FaChalkboardTeacher, FaCalendarDay, FaClock, FaSun } from "react-icons/fa";

const FacultySchedule = () => {
  const [selectedSection, setSelectedSection] = useState(null);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const timeLabels = [
    "7:00 AM","7:30 AM","8:00 AM","8:30 AM","9:00 AM","9:30 AM",
    "10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM",
    "1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM",
    "4:00 PM","4:30 PM","5:00 PM","5:30 PM","6:00 PM","6:30 PM",
    "7:00 PM","7:30 PM","8:00 PM","8:30 PM"
  ];

  return (
    <div className="faculty-page">

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">My Teaching Schedule</h2>
          <p className="page-sub">
            View your assigned courses and enrolled students.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">

        <div className="stat-card stat-card-blue">
          <div className="stat-icon stat-icon-blue"></div>
          <div className="stat-content">
            <span className="stat-number stat-number-blue"></span>
            <span className="stat-label">TOTAL CLASSES</span>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-icon stat-icon-green"></div>
          <div className="stat-content">
            <span className="stat-number stat-number-green"></span>
            <span className="stat-label">TODAY'S CLASSES</span>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-icon stat-icon-purple"></div>
          <div className="stat-content">
            <span className="stat-number"></span>
            <span className="stat-label">UPCOMING</span>
          </div>
        </div>

        <div className="stat-card stat-card-orange">
          <div className="stat-icon stat-icon-orange"></div>
          <div className="stat-content">
            <span className="stat-number stat-number-orange"></span>
            <span className="stat-label">MORNING</span>
          </div>
        </div>

        <div className="stat-card stat-card-red">
          <div className="stat-icon stat-icon-red"></div>
          <div className="stat-content">
            <span className="stat-number stat-number-red"></span>
            <span className="stat-label">AFTERNOON</span>
          </div>
        </div>

      </div>

      {/* Calendar */}
      <div className="calendar-card">
        <div className="calendar-wrapper">
          <div className="calendar-grid">

            {/* Header */}
            <div className="time-header"></div>
            {days.map((day) => (
              <div key={day} className="day-header">{day}</div>
            ))}

            {/* Time Grid */}
            {timeLabels.map((time, i) => (
              <React.Fragment key={i}>
                <div className="time-label">{time}</div>
                {days.map((d, j) => (
                  <div key={j} className="grid-cell"></div>
                ))}
              </React.Fragment>
            ))}

          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedSection && (
        <div className="modal-overlay" onClick={() => setSelectedSection(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header-styled">
              <div className="modal-title-info">
                <h3></h3>
                <p className="modal-subtitle"></p>
              </div>
              <button
                className="close-btn"
                onClick={() => setSelectedSection(null)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body-styled">
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
                  {/* No dummy data */}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default FacultySchedule;