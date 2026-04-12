import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { curriculumService, courseService } from "../../services";
import { httpClient } from "../../services/httpClient";
import { API_ENDPOINTS } from "../../services/apiEndpoints";
import "../../styles/Dean/CurriculumManagement.css";

export default function CurriculumManagement() {
  const queryClient = useQueryClient();
  const fileInput = useRef();

  const [filterProgram,    setFilterProgram]    = useState("");
  const [filterYear,       setFilterYear]       = useState("all");
  const [curriculumSearch, setCurriculumSearch] = useState("");
  const [courseSearch,     setCourseSearch]     = useState("");
  const [showAddModal,     setShowAddModal]     = useState(false);
  const [importing,        setImporting]        = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [toast,            setToast]            = useState(null);

  const [form, setForm] = useState({
    program_id: "", year_level: "1", semester: "1st", course_ids: [],
  });

  /* ===========================
     CACHED QUERIES
  =========================== */

  // Programs — shared cache key, fetched once across the app
  const { data: programs = [] } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const res = await httpClient.get(API_ENDPOINTS.PROGRAMS.LIST);
      return res.ok ? (res.data ?? []) : [];
    },
  });

  useEffect(() => {
    if (filterProgram || !programs.length) return;
    const bsit = programs.find((p) => p.program_code === "BSIT");
    if (bsit) setFilterProgram(String(bsit.id));
  }, [programs, filterProgram]);

  // Courses — shared cache key
  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const res = await courseService.getAll();
      return res.ok ? (res.data ?? []) : [];
    },
  });

  // Curriculum — keyed by filterProgram so each program has its own cache slot
  const { data: curriculum = [], isLoading } = useQuery({
    queryKey: ["curriculum", filterProgram],
    queryFn: async () => {
      if (!filterProgram) return [];
      const res = await curriculumService.getAll(filterProgram);
      return res.ok ? (res.data ?? []) : [];
    },
    enabled: !!filterProgram,
  });

  /* ===========================
     TOAST
  =========================== */

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  /* ===========================
     FILTERED COURSES (modal)
  =========================== */

  const filteredCourses = useMemo(() => courses.filter((c) => {
    if (!courseSearch) return true;
    const s = courseSearch.toLowerCase();
    return c.course_code.toLowerCase().includes(s) || c.course_name.toLowerCase().includes(s);
  }), [courses, courseSearch]);

  /* ===========================
     GROUP CURRICULUM
  =========================== */

  const groupedCurriculum = useMemo(() => {
    let filtered = [...curriculum];

    if (filterYear !== "all") {
      filtered = filtered.filter(item => item.year_level == filterYear);
    }

    if (curriculumSearch.trim()) {
      const s = curriculumSearch.toLowerCase();
      filtered = filtered.filter(item =>
        item.course.course_code.toLowerCase().includes(s) ||
        item.course.course_name.toLowerCase().includes(s)
      );
    }

    const years = {};
    filtered.forEach(item => {
      const y = item.year_level;
      if (!years[y]) years[y] = {};
      const s = item.semester;
      if (!years[y][s]) years[y][s] = [];
      years[y][s].push(item);
    });

    return Object.keys(years).sort().map(y => ({
      year: y,
      semesters: Object.keys(years[y]).sort().map(s => ({
        semester: s,
        courses: years[y][s],
      })),
    }));
  }, [curriculum, filterYear, curriculumSearch]);

  /* ===========================
     YEAR SUFFIX
  =========================== */

  const getYearSuffix = (y) => {
    if (y == 1) return "st";
    if (y == 2) return "nd";
    if (y == 3) return "rd";
    return "th";
  };

  /* ===========================
     TOGGLE COURSE SELECTION
  =========================== */

  const toggleCourse = (id) => {
    setForm(prev => ({
      ...prev,
      course_ids: prev.course_ids.includes(id)
        ? prev.course_ids.filter(c => c !== id)
        : [...prev.course_ids, id],
    }));
  };

  /* ===========================
     IMPORT CSV
  =========================== */

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const res = await curriculumService.importCsv(file);
      if (res.ok) {
        showToast("success", res.message || "Import successful.");
        // Invalidate current program's curriculum cache
        queryClient.invalidateQueries({ queryKey: ["curriculum", filterProgram] });
      } else {
        showToast("error", res.message || "Import failed.");
      }
    } catch {
      showToast("error", "Import failed.");
    } finally {
      setImporting(false);
      fileInput.current.value = "";
    }
  };

  /* ===========================
     DELETE — setQueryData, no refetch
  =========================== */

  const deleteEntry = async (id) => {
    if (!window.confirm("Remove this course from curriculum?")) return;
    try {
      const res = await curriculumService.delete(id);
      if (res.ok) {
        showToast("success", "Entry removed.");
        queryClient.setQueryData(["curriculum", filterProgram], (old = []) =>
          old.filter(item => item.id !== id)
        );
      } else {
        showToast("error", res.message || "Delete failed.");
      }
    } catch {
      showToast("error", "Delete failed.");
    }
  };

  /* ===========================
     SAVE BULK — invalidate after bulk add
     (we don't know exact items returned, so invalidate is correct here)
  =========================== */

  const saveBulkEntry = async () => {
    if (!form.program_id || form.course_ids.length === 0) {
      showToast("error", "Select a program and at least one course.");
      return;
    }
    setSaving(true);
    try {
      const res = await curriculumService.bulkStore(form);
      if (res.ok) {
        showToast("success", res.message || "Curriculum updated.");
        setShowAddModal(false);
        setForm({ program_id: "", year_level: "1", semester: "1st", course_ids: [] });
        // Invalidate the affected program's curriculum cache
        queryClient.invalidateQueries({ queryKey: ["curriculum", String(form.program_id)] });
      } else {
        showToast("error", res.message || "Save failed.");
      }
    } catch {
      showToast("error", "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  /* ===========================
     JSX
  =========================== */

  return (
    <div className="curriculum-page">

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Curriculum Management</h2>
          <p className="page-sub">Define and manage program curricula.</p>
        </div>
        <div className="header-actions">
          <button className="outline-btn" onClick={() => fileInput.current.click()} disabled={importing}>
            {importing ? "Importing..." : "Import CSV"}
          </button>
          <input ref={fileInput} type="file" hidden accept=".csv" onChange={handleImport} />
          <button
            className="primary-btn"
            onClick={() => {
              setForm({ program_id: filterProgram || "", year_level: "1", semester: "1st", course_ids: [] });
              setShowAddModal(true);
            }}
          >
            Add Curriculum
          </button>
        </div>
      </div>

      {/* FILTER */}
      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="Search..."
          value={curriculumSearch}
          onChange={(e) => setCurriculumSearch(e.target.value)}
        />
        <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)}>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.program_code}</option>
          ))}
        </select>
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
          <option value="all">All Years</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </select>
      </div>

      {/* TABLE */}
      {isLoading ? (
        <p className="loading-text">Loading curriculum...</p>
      ) : (
        groupedCurriculum.map((year) => (
          <div key={year.year} className="year-section">
            <h3 className="year-title">{year.year}{getYearSuffix(year.year)} Year</h3>
            {year.semesters.map((sem) => (
              <div key={sem.semester} className="semester-card">
                <h4>{sem.semester} Semester</h4>
                <table className="sem-table">
                  <thead>
                    <tr><th>Code</th><th>Name</th><th>Units</th><th></th></tr>
                  </thead>
                  <tbody>
                    {sem.courses.map((item) => (
                      <tr key={item.id}>
                        <td>{item.course.course_code}</td>
                        <td>{item.course.course_name}</td>
                        <td>{item.course.units}</td>
                        <td>
                          <button className="delete-btn-sm" onClick={() => deleteEntry(item.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ))
      )}

      {/* ADD CURRICULUM MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Curriculum Entries</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>Program</label>
                <select value={form.program_id} onChange={(e) => setForm({ ...form, program_id: e.target.value })}>
                  <option value="">Select program</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.program_code} — {p.program_name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Year Level</label>
                <select value={form.year_level} onChange={(e) => setForm({ ...form, year_level: e.target.value })}>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
              <div className="field">
                <label>Semester</label>
                <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                  <option value="1st">1st Semester</option>
                  <option value="2nd">2nd Semester</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
              <div className="field">
                <label>Courses</label>
                <input
                  className="search-input"
                  placeholder="Search courses..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                />
              </div>
              <div className="course-checklist">
                {filteredCourses.map((c) => (
                  <label key={c.id} className="course-check-item">
                    <input
                      type="checkbox"
                      checked={form.course_ids.includes(c.id)}
                      onChange={() => toggleCourse(c.id)}
                    />
                    <span>{c.course_code} — {c.course_name}</span>
                  </label>
                ))}
                {filteredCourses.length === 0 && <p className="no-results">No courses found.</p>}
              </div>
              <p className="selected-count">
                {form.course_ids.length} course{form.course_ids.length !== 1 ? "s" : ""} selected
              </p>
            </div>
            <div className="modal-footer">
              <button className="outline-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="primary-btn" onClick={saveBulkEntry} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
