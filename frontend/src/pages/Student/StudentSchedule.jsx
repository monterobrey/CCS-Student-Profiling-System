import { useState } from 'react'
import '../../styles/Student/StudentSchedule.css'

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS     = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const TIMES    = ['7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM']
const CELL_H   = 72
const START_HR = 7
const TODAY_COL = 2

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
  const [events]     = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const getEventStyle = (ev) => {
    const startMins = toMins(ev.start)
    const endMins   = toMins(ev.end)
    const top       = ((startMins - START_HR * 60) / 60) * CELL_H
    const height    = ((endMins - startMins) / 60) * CELL_H - 4
    const isActive  = selectedId === ev.id

    return {
      position:      'absolute',
      top:           `${top}px`,
      height:        `${height}px`,
      left:          `calc(${ev.day} * (100% / 7) + 5px)`,
      width:         `calc(100% / 7 - 10px)`,
      background:    ev.bg,
      color:         ev.fg,
      zIndex:        isActive ? 50 : 1,
      outline:       isActive ? '2px solid #1976D2' : 'none',
      outlineOffset: '1px',
    }
  }

  const isToday = (colIdx) => colIdx === TODAY_COL

  const toggleSelected = (id) => setSelectedId((prev) => (prev === id ? null : id))

  return (
    <div className="wrap">
      <div className="main">
        <div className="cal-area">
          <div className="cal-inner">

            {/* Day Headers - day names only, no dates */}
            <div className="day-headers">
              <div className="time-spacer"></div>
              {DAYS.map((day, i) => (
                <div key={day} className={`dh${isToday(i) ? ' today' : ''}`}>
                  <span className="dh-name">{day.slice(0, 3)}</span>
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
    </div>
  )
}

export default StudentSchedule