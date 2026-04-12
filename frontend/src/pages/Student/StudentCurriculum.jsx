import { useState, useMemo } from 'react'
import '../../styles/Student/StudentSchedule.css'

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS      = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const TIMES     = ['7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM']
const CELL_H    = 72
const START_HR  = 7
const TODAY_COL = 2

const MONTH_DATES = [
  null, null, null, null, null, 1, 2,
  3, 4, 5, 6, 7, 8, 9,
  10, 11, 12, 13, 14, 15, 16,
  17, 18, 19, 20, 21, 22, 23,
  24, 25, 26, 27, 28, 29, 30,
  31, null, null, null, null, null, null,
]

const INITIAL_EVENTS = [
  { id: 1, name: 'IT Elective',      code: 'IT 401', room: 'Room 301', day: 0, start: '7:30 AM',  end: '9:00 AM',  bg: '#FF9800', fg: '#fff'    },
  { id: 2, name: 'IT Elective',      code: 'IT 402', room: 'Room 302', day: 1, start: '8:30 AM',  end: '10:00 AM', bg: '#B2DFDB', fg: '#004D40' },
  { id: 3, name: 'IT Elective',      code: 'IT 403', room: 'Room 303', day: 2, start: '7:00 AM',  end: '10:00 AM', bg: '#29B6F6', fg: '#fff'    },
  { id: 4, name: 'Graphic Design',   code: 'GD 201', room: 'Lab 2',    day: 2, start: '10:30 AM', end: '12:00 PM', bg: '#66BB6A', fg: '#fff'    },
  { id: 5, name: 'Event Faculty',    code: 'EF 101', room: 'Room 105', day: 3, start: '10:30 AM', end: '12:00 PM', bg: '#FFA726', fg: '#fff'    },
  { id: 6, name: 'Class Exhibition', code: 'CE 301', room: 'Hall A',   day: 0, start: '1:00 PM',  end: '2:30 PM',  bg: '#EF9A9A', fg: '#7f0000' },
  { id: 7, name: 'Design Review',    code: 'DR 201', room: 'Studio 1', day: 1, start: '1:30 PM',  end: '3:00 PM',  bg: '#FF8A65', fg: '#fff'    },
  { id: 8, name: 'English Exam',     code: 'EN 102', room: 'Room 201', day: 4, start: '1:00 PM',  end: '2:30 PM',  bg: '#FFF176', fg: '#5d4037' },
  { id: 9, name: 'Workshop',         code: 'WS 101', room: 'Lab 3',    day: 5, start: '10:00 AM', end: '12:00 PM', bg: '#CE93D8', fg: '#4a148c' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toMins(timeStr) {
  const [time, mod] = timeStr.split(' ')
  let [h, m] = time.split(':').map(Number)
  if (!m) m = 0
  if (mod === 'PM' && h !== 12) h += 12
  if (mod === 'AM' && h === 12) h = 0
  return h * 60 + m
}

// ─── Component ────────────────────────────────────────────────────────────────
const StudentSchedule = () => {
  const [events]       = useState(INITIAL_EVENTS)
  const [weekOffset, setWeekOffset]   = useState(0)
  const [selectedId, setSelectedId]   = useState(null)

  const weekDates = useMemo(
    () => DAYS.map((_, i) => 12 + weekOffset * 7 + i),
    [weekOffset]
  )

  const currentHighlight = weekDates[TODAY_COL]

  const todayEvents = useMemo(
    () => events.filter((e) => e.day === TODAY_COL),
    [events]
  )

  const getEventStyle = (ev) => {
    const startMins = toMins(ev.start)
    const endMins   = toMins(ev.end)
    const top       = ((startMins - START_HR * 60) / 60) * CELL_H
    const height    = ((endMins - startMins) / 60) * CELL_H - 4
    const isActive  = selectedId === ev.id

    return {
      position:     'absolute',
      top:          `${top}px`,
      height:       `${height}px`,
      left:         `calc(${ev.day} * (100% / 7) + 5px)`,
      width:        `calc(100% / 7 - 10px)`,
      background:   ev.bg,
      color:        ev.fg,
      zIndex:       isActive ? 50 : 1,
      outline:      isActive ? '2px solid #1976D2' : 'none',
      outlineOffset: '1px',
    }
  }

  const isToday = (colIdx) => colIdx === TODAY_COL && weekOffset === 0

  const toggleSelected = (id) => setSelectedId((prev) => (prev === id ? null : id))

  return (
    <div className="wrap">
      {/* ── Main Calendar ── */}
      <div className="main">
        <div className="cal-area">
          <div className="cal-inner">
            {/* Day Headers */}
            <div className="day-headers">
              <div className="time-spacer"></div>
              {DAYS.map((day, i) => (
                <div key={day} className={`dh${isToday(i) ? ' today' : ''}`}>
                  <span className="dh-name">{day.slice(0, 3)}</span>
                  <span className="dh-num">{weekDates[i]}</span>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="time-grid">
              <div className="time-col">
                {TIMES.map((t) => (
                  <div key={t} className="t-label">{t}</div>
                ))}
              </div>
              <div className="grid-cols">
                {/* Background cells */}
                {DAYS.map((day, di) => (
                  <div key={`col-${di}`} className="g-col">
                    {TIMES.map((t) => (
                      <div key={t} className="g-cell"></div>
                    ))}
                  </div>
                ))}

                {/* Event blocks */}
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="evt"
                    style={getEventStyle(ev)}
                    onClick={() => toggleSelected(ev.id)}
                  >
                    <div className="evt-name">{ev.name}</div>
                    <div className="evt-time">{ev.start} - {ev.end}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="right">
        {/* Mini Calendar */}
        <div className="mini-cal">
          <div className="mini-hdr">
            <h3>August 2020</h3>
            <div className="mini-nav">
              <button onClick={() => setWeekOffset((w) => w - 1)}>&#8249;</button>
              <button onClick={() => setWeekOffset((w) => w + 1)}>&#8250;</button>
            </div>
          </div>
          <div className="mini-days">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="mini-grid">
            {MONTH_DATES.map((d, i) => (
              <span
                key={i}
                className={[
                  d === null ? 'empty' : '',
                  d === currentHighlight ? 'cur' : '',
                  d !== null && weekDates.includes(d) && d !== currentHighlight ? 'hi' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* Class List */}
        <div className="class-list">
          <div className="cl-hdr">
            <h3>Class list</h3>
            <a href="#" onClick={(e) => e.preventDefault()}>View all</a>
          </div>
          <div className="cl-sub">Today, Aug 14</div>
          {todayEvents.map((ev) => (
            <div
              key={`card-${ev.id}`}
              className={`cl-card${selectedId === ev.id ? ' card-active' : ''}`}
              style={{ background: ev.bg }}
              onClick={() => toggleSelected(ev.id)}
            >
              <div className="cl-card-inner">
                <div className="cl-dot" style={{ background: ev.fg, opacity: 0.6 }}></div>
                <div className="cl-info">
                  <h4 style={{ color: ev.fg }}>{ev.name}</h4>
                  <p style={{ color: ev.fg }}>{ev.start} - {ev.end}</p>
                </div>
              </div>
              <div className="cl-arr" style={{ color: ev.fg, opacity: 0.5 }}>&#8250;</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StudentSchedule