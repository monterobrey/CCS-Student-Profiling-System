import React, { useMemo, useState } from "react";
import styles from "../../styles/Shared/UnifiedCalendar.module.css";
import { useAuth, ROLES } from "../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { awardService } from "../../services/awardService";
import { studentService } from "../../services/studentService";
import { violationService } from "../../services/violationService";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const UnifiedCalendar = () => {
  const { role } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch awards/events based on role
  const { data: awards = [], isLoading: isLoadingAwards } = useQuery({
    queryKey: ["unified-calendar-awards", role],
    queryFn: async () => {
      if (role === ROLES.STUDENT) {
        const res = await awardService.getMyAwards();
        return res.ok ? (res.data ?? []) : [];
      } else if (role === ROLES.FACULTY) {
        const res = await awardService.getFacultyAwards();
        return res.ok ? (res.data ?? []) : [];
      } else {
        const res = await awardService.getAll();
        return res.ok ? (res.data ?? []) : [];
      }
    },
  });

  // Fetch student profile (organizations/affiliations for activities)
  const { data: profile } = useQuery({
    queryKey: ["student-profile"],
    queryFn: async () => {
      const res = await studentService.getProfile();
      return res.ok ? res.data : null;
    },
    enabled: role === ROLES.STUDENT,
  });

  // Fetch violations for students/faculty as pending activities
  const { data: violations = [] } = useQuery({
    queryKey: ["unified-calendar-violations", role],
    queryFn: async () => {
      if (role === ROLES.STUDENT) {
        const res = await violationService.getMyViolations();
        return res.ok ? (res.data ?? []) : [];
      } else if (role === ROLES.FACULTY) {
        const res = await violationService.getMyViolations();
        return res.ok ? (res.data ?? []) : [];
      } else {
        const res = await violationService.getAll();
        return res.ok ? (res.data ?? []) : [];
      }
    },
  });

  const isLoading = isLoadingAwards;

  // Transform data into unified events format
  const events = useMemo(() => {
    const unifiedEvents = [];

    // Convert awards to event items
    awards.forEach((award) => {
      if (award.created_at || award.date_given) {
        const awardDate = new Date(award.created_at || award.date_given);
        unifiedEvents.push({
          id: `award-${award.id}`,
          title: award.title || "Award/Recognition",
          date: awardDate,
          startTime: "00:00",
          endTime: "23:59",
          type: "event",
          location: "CCS Department",
          description: award.description || "Award ceremony or recognition event",
        });
      }
    });

    // Add affiliations as activity items for students
    if (profile?.organizations && role === ROLES.STUDENT) {
      profile.organizations.forEach((aff) => {
        if (aff.joined_at) {
          unifiedEvents.push({
            id: `affiliation-${aff.id}`,
            title: `${aff.organization?.organization_name || "Organization"} - ${aff.role || "Member"}`,
            date: new Date(aff.joined_at),
            startTime: "00:00",
            endTime: "23:59",
            type: "activity",
            location: "Campus",
            description: aff.organization?.description || "Organization affiliation",
          });
        }
      });
    }

    // Add resolved violations as meetings only (no pending)
    violations.forEach((violation) => {
      if (violation.created_at && violation.status === "resolved" || violation.status === "dismissed") {
        unifiedEvents.push({
          id: `meeting-${violation.id}`,
          title: violation.title || "Resolved Violation",
          date: new Date(violation.created_at),
          startTime: "00:00",
          endTime: "23:59",
          type: "meeting",
          location: "CCS Department",
          description: violation.description || "Resolved violation record",
        });
      }
    });

    return unifiedEvents;
  }, [awards, profile, violations, role]);

  const eventTypes = {
    event: { label: "Event", color: "#10b981" },
    activity: { label: "Activity", color: "#f59e0b" },
    meeting: { label: "Meeting", color: "#8b5cf6" },
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      daysInMonth: lastDay.getDate(),
      startingDayOfWeek: firstDay.getDay(),
    };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(selectedDate);
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateMonth = (direction) => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const getEventsForDay = (day) => {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day &&
             eventDate.getMonth() === currentMonth &&
             eventDate.getFullYear() === currentYear;
    });
  };

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className={styles.unifiedCalendarPage}>
      <div className={styles.calendarHeader}>
        <button 
          className={styles.navBtn}
          onClick={() => navigateMonth(-1)}
        >
          &lt;
        </button>
        <h1 className={styles.monthTitle}>
          {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </h1>
        <button 
          className={styles.navBtn}
          onClick={() => navigateMonth(1)}
        >
          &gt;
        </button>
      </div>

      {isLoading ? (
        <div className={styles.loadingState}>
          <p>Loading activities...</p>
        </div>
      ) : (
        <>
          <div className={styles.calendarGrid}>
            <div className={styles.dayNames}>
              {dayNames.map(day => (
                <div key={day} className={styles.dayNameCell}>{day}</div>
              ))}
            </div>
            <div className={styles.daysGrid}>
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`${styles.dayCell} ${day ? '' : styles.emptyDay}`}
                >
                  {day && (
                    <>
                      <div className={styles.dayNumber}>{day}</div>
                      <div className={styles.eventsList}>
                        {getEventsForDay(day).slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className={styles.eventItem}
                            style={{ borderLeftColor: eventTypes[event.type]?.color || '#666' }}
                            title={`${event.title} | ${event.description}`}
                          >
                            <span className={styles.eventTitle}>{event.title}</span>
                            <span className={styles.eventTime}>
                              {event.startTime === event.endTime ? 'All day' : `${event.startTime}`}
                            </span>
                          </div>
                        ))}
                        {getEventsForDay(day).length > 3 && (
                          <div className={styles.moreEvents}>
                            +{getEventsForDay(day).length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.legend}>
            <h3>Activity Types</h3>
            <div className={styles.legendItems}>
              {Object.entries(eventTypes).map(([key, { label, color }]) => (
                <div key={key} className={styles.legendItem}>
                  <span className={styles.legendColor} style={{ backgroundColor: color }}></span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UnifiedCalendar;

