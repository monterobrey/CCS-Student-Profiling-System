import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth, ROLES } from "../context/AuthContext";
import "./AppLayout.css";
import ccsLogo from "../assets/ccs-logo.png";

const getBasePath = (role) => {
  if (role === ROLES.DEAN) return 'dean';
  if (role === ROLES.CHAIR) return 'department-chair';
  if (role === ROLES.SECRETARY) return 'secretary';
  if (role === ROLES.FACULTY) return 'faculty';
  if (role === ROLES.STUDENT) return 'student';
  return 'dean';
};

const icons = {
  dashboard: '<rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/>',
  reports: '<path d="M12 15V9m-4 6V5m-4 10v-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  curriculum: '<path d="M3 5h14M3 10h14M3 15h14M6 3v14M14 3v14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  courses: '<path d="M3 4h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1zM3 8h14M8 4v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  performance: '<path d="M2 14l4-8 4 5 3-3 5 6H2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  violations: '<path d="M10 7v3m0 3.5v.5M3.5 16h13a1 1 0 00.87-1.5l-6.5-11a1 1 0 00-1.74 0l-6.5 11A1 1 0 003.5 16z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  profile: '<path d="M10 9a3 3 0 100-6 3 3 0 000 6zM2 17a8 8 0 0116 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  faculty: '<path d="M3 10h14M3 6h14M3 14h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  schedule: '<rect x="3" y="4" width="14" height="13" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 8h14M7 2v4M13 2v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  archive: '<path d="M4 6h12M4 10h12M4 14h12M7 2v4M13 2v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  awards: '<path d="M10 2l1.8 5.4H18l-4.9 3.6 1.9 5.7L10 13.4l-5 3.3 1.9-5.7L2 7.4h6.2L10 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  settings: '<circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <g dangerouslySetInnerHTML={{ __html: icons[name] || icons.dashboard }} />
    </svg>
  );
}

const SECTION_ORDER = ['Overview', 'Profiling', 'Academic', 'Accounts', 'Monitoring', 'Management', 'Settings'];

export default function Sidebar({ collapsed, setCollapsed }) {
const { role } = useAuth();

  const menuSections = useMemo(() => {
    const roleMenu = {
      [ROLES.DEAN]: [
        { name: "Overview", items: [{ path: "dashboard", meta: { title: "Dashboard", icon: "dashboard" } }] },
        { name: "Profiling", items: [
          { path: "reports", meta: { title: "Profiling Reports", icon: "reports" } },
          { path: "curriculum", meta: { title: "Curriculum", icon: "curriculum" } },
          { path: "courses", meta: { title: "Courses", icon: "courses" } }
        ]},
        { name: "Academic", items: [
          { path: "performance", meta: { title: "Academic Performance", icon: "performance" } },
          { path: "violations", meta: { title: "Violations", icon: "violations" } },
          { path: "awards", meta: { title: "Awards & Recognition", icon: "awards" } }
        ]},
        { name: "Accounts", items: [
          { path: "student-accounts", meta: { title: "Student Accounts", icon: "profile" } },
          { path: "faculty-accounts", meta: { title: "Faculty Accounts", icon: "faculty" } }
        ]},
        { name: "Monitoring", items: [
          { path: "faculty-workload", meta: { title: "Faculty Workload", icon: "faculty" } }
        ]},
        { name: "Management", items: [
          { path: "archive", meta: { title: "Archive Management", icon: "archive" } }
        ]},
      ],
      [ROLES.CHAIR]: [
        { name: "Overview", items: [{ path: "dashboard", meta: { title: "Dashboard", icon: "dashboard" } }] },
        { name: "Academic", items: [
          { path: "performance", meta: { title: "Academic Performance", icon: "performance" } },
          { path: "violations", meta: { title: "Violations", icon: "violations" } }
        ]},
        { name: "Awards", items: [
          { path: "awards", meta: { title: "Award Approvals", icon: "awards" } }
        ]},
        { name: "Schedule", items: [
          { path: "schedule", meta: { title: "Manage Schedule", icon: "schedule" } }
        ]},
        { name: "Accounts", items: [
          { path: "student-accounts", meta: { title: "Student Accounts", icon: "profile" } },
          { path: "faculty-accounts", meta: { title: "Faculty Accounts", icon: "faculty" } }
        ]},
        { name: "Monitoring", items: [
          { path: "faculty-workload", meta: { title: "Faculty Workload", icon: "faculty" } }
        ]},
      ],
      [ROLES.FACULTY]: [
        { name: "Overview", items: [{ path: "dashboard", meta: { title: "Dashboard", icon: "dashboard" } }] },
        { name: "My Classes", items: [
          { path: "schedule", meta: { title: "My Schedule", icon: "schedule" } },
          { path: "subjects", meta: { title: "My Subjects", icon: "courses" } }
        ]},
        { name: "Monitoring", items: [
          { path: "students", meta: { title: "Student Profiles", icon: "profile" } },
          { path: "violations", meta: { title: "Record Violation", icon: "violations" } },
          { path: "awards", meta: { title: "Recommend Awards", icon: "awards" } }
        ]},
        { name: "Account Settings", items: [
          { path: "settings", meta: { title: "My Profile", icon: "profile" } },
          { path: "settings", meta: { title: "Account Settings", icon: "settings" } }
        ]},
      ],
      [ROLES.SECRETARY]: [
        { name: "Overview", items: [{ path: "dashboard", meta: { title: "Dashboard", icon: "dashboard" } }] },
        { name: "Accounts", items: [
          { path: "student-accounts", meta: { title: "Student Accounts", icon: "profile" } },
          { path: "faculty-accounts", meta: { title: "Faculty Accounts", icon: "faculty" } }
        ]},
        { name: "Monitoring", items: [
          { path: "faculty-workload", meta: { title: "Faculty Workload", icon: "faculty" } },
          { path: "awards", meta: { title: "Awards & Recognition", icon: "awards" } }
        ]},
      ],
      [ROLES.STUDENT]: [
        { name: "Overview", items: [
          { path: "dashboard", meta: { title: "Dashboard", icon: "dashboard" } }
        ]},
        { name: "My Academic", items: [
          { path: "profile", meta: { title: "My Profile", icon: "profile" } },
          { path: "curriculum", meta: { title: "My Curriculum", icon: "courses" } },
          { path: "violations", meta: { title: "My Violations", icon: "violations" } },
        ]},
        { name: "Academics", items: [
          { path: "schedule", meta: { title: "My Schedule", icon: "schedule" } },
        ]},
        { name: "My Activities", items: [
          { path: "awards", meta: { title: "My Achievements", icon: "awards" } },
        ]},
      ],
    };

    return roleMenu[role] || roleMenu[ROLES.DEAN];
  }, [role]);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div 
        className="sidebar-brand" 
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand Sidebar' : ''}
      >
        <div className="brand-icon">
          <img src={ccsLogo} alt="CSS Logo" className="brand-logo-img" />
        </div>
        {!collapsed && (
          <div className="brand-text">
            <span className="brand-name">CSS Portal</span>
            <span className="brand-sub">CCS · AY 2026–2027</span>
          </div>
        )}
        {!collapsed && (
          <button 
            className="collapse-btn" 
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(true);
            }}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 5l-5 5 5 5" />
            </svg>
          </button>
        )}
      </div>

      {!collapsed && <div className="sidebar-brand-separator"></div>}

      <nav className="sidebar-nav">
        {menuSections.map(section => (
          <div key={section.name}>
            {!collapsed && <div className="nav-section-label">{section.name}</div>}
            {section.items.map(item => (
              <NavLink 
                key={item.path}
                to={`/${getBasePath(role)}/${item.path}`} 
                className="nav-item"
              >
                <Icon name={item.meta.icon} />
                {!collapsed && <span>{item.meta.title}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      
    </aside>
  );
}