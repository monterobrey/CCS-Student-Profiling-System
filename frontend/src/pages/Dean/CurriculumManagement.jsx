import React, { useEffect, useState, useRef } from "react";
import { curriculumService, courseService } from "../../services";
import { httpClient } from "../../services/httpClient";
import { API_ENDPOINTS } from "../../services/apiEndpoints";
import "../../styles/Dean/CurriculumManagement.css";

export default function CurriculumManagement() {
  const [curriculum, setCurriculum] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);

  const [filterProgram, setFilterProgram] = useState("");
  const [filterYear, setFilterYear] = useState("all");

  const [curriculumSearch, setCurriculumSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");

  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }

  const fileInput = useRef();

  const [form, setForm] = useState({
    program_id: "",
    year_level: "1",
    semester: "1st",
    course_ids: [],
  });

  /* ===========================
     TOAST HELPER
  =========================== */

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  /* ===========================
     FILTERED COURSES (for modal)
  =========================== */

  const filteredCourses = courses.filter((c) => {
    if (!courseSearch) return true;
    const s = courseSearch.toLowerCase();
    return (
      c.course_code.toLowerCase().includes(s) ||
      c.course_name.toLowerCase().includes(s)
    );
  });

  /* ===========================
     GROUP CURRICULUM
  =========================== */

  const groupedCurriculum = () => {
    let filtered = [...curriculum];

    if (filterYear !== "all") {
      filtered = filtered.filter((item) => item.year_level == filterYear);
    }

    if (curriculumSearch.trim()) {
      const s = curriculumSearch.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.course.course_code.toLowerCase().includes(s) ||
          item.course.course_name.toLowerCase().includes(s)
      );
    }

    const years = {};
    filtered.forEach((item) => {
      const y = item.year_level;
      if (!years[y]) years[y] = {};
      const s = item.semester;
      if (!years[y][s]) years[y][s] = [];
      years[y][s].push(item);
    });

    return Object.keys(years)
      .sort()
      .map((y) => ({
        year: y,
        semesters: Object.keys(years[y])
          .sort()
          .map((s) => ({ semester: s, courses: years[y][s] })),
      }));
  };

  /* ===========================
     FETCH DATA
  =========================== */

  const fetchCurriculum = async () => {
    setLoading(true);
    try {
      const res = await curriculumService.getAll(filterProgram || null);
      if (res.ok) {
        setCurriculum(res.data ?? []);
      } else {
        showToast("error", res.message || "Failed to load curriculum.");
      }
    } catch {
      showToast("error", "Failed to load curriculum.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHelperData = async () => {
    try {
      const [programsRes, coursesRes] = await Promise.all([
        httpClient.get(API_ENDPOINTS.PROGRAMS.LIST),
        courseService.getAll(),
      ]);

      const programList = programsRes.data ?? [];
      const courseList = coursesRes.data ?? [];

      setPrograms(programList);
      setCourses(courseList);

      const bsit = programList.find((p) => p.program_code === "BSIT");
      if (bsit) setFilterProgram(bsit.id);
    } catch {
      showToast("error", "Failed to load programs or courses.");
    }
  };

  useEffect(() => {
    fetchHelperData();
  }, []);

  useEffect(() => {
    if (filterProgram) fetchCurriculum();
  }, [filterProgram]);

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
        fetchCurriculum();
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
     DELETE
  =========================== */

  const deleteEntry = async (id) => {
    if (!window.confirm("Remove this course from curriculum?")) return;
    try {
      const res = await curriculumService.delete(id);
      if (res.ok) {
        showToast("success", "Entry removed.");
        fetchCurriculum();
      } else {
        showToast("error", res.message || "Delete failed.");
      }
    } catch {
      showToast("error", "Delete failed.");
    }
  };

  /* ===========================
     SAVE BULK
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
        fetchCurriculum();
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
     TOGGLE COURSE SELECTION
  =========================== */

  const toggleCourse = (id) => {
    setForm((prev) => ({
      ...prev,
      course_ids: prev.course_ids.includes(id)
        ? prev.course_ids.filter((c) => c !== id)
        : [...prev.course_ids, id],
    }));
  };

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
     JSX
  =========================== */

  return (
    <div className="curriculum-page">

      {/* TOAST */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Curriculum Management</h2>
          <p className="page-sub">Define and manage program curricula.</p>
        </div>

        <div className="header-actions">
          <button
            className="outline-btn"
            onClick={() => fileInput.current.click()}
            disabled={importing}
          >
            {importing ? "Importing..." : "Import CSV"}
          </button>

          <input
            ref={fileInput}
            type="file"
            hidden
            accept=".csv"
            onChange={handleImport}
          />

          <button
            className="primary-btn"
            onClick={() => {
              setForm({
                program_id: filterProgram || "",
                year_level: "1",
                semester: "1st",
                course_ids: [],
              });
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

        <select
          value={filterProgram}
          onChange={(e) => setFilterProgram(e.target.value)}
        >
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.program_code}
            </option>
          ))}
        </select>

        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
        >
          <option value="all">All Years</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </select>
      </div>

      {/* TABLE */}
      {loading ? (
        <p className="loading-text">Loading curriculum...</p>
      ) : (
        groupedCurriculum().map((year) => (
          <div key={year.year} className="year-section">
            <h3 className="year-title">
              {year.year}{getYearSuffix(year.year)} Year
            </h3>

            {year.semesters.map((sem) => (
              <div key={sem.semester} className="semester-card">
                <h4>{sem.semester} Semester</h4>

                <table className="sem-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Units</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sem.courses.map((item) => (
                      <tr key={item.id}>
                        <td>{item.course.course_code}</td>
                        <td>{item.course.course_name}</td>
                        <td>{item.course.units}</td>
                        <td>
                          <button
                            className="delete-btn-sm"
                            onClick={() => deleteEntry(item.id)}
                          >
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
              {/* Program */}
              <div className="field">
                <label>Program</label>
                <select
                  value={form.program_id}
                  onChange={(e) => setForm({ ...form, program_id: e.target.value })}
                >
                  <option value="">Select program</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.program_code} — {p.program_name}</option>
                  ))}
                </select>
              </div>

              {/* Year Level */}
              <div className="field">
                <label>Year Level</label>
                <select
                  value={form.year_level}
                  onChange={(e) => setForm({ ...form, year_level: e.target.value })}
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              {/* Semester */}
              <div className="field">
                <label>Semester</label>
                <select
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                >
                  <option value="1st">1st Semester</option>
                  <option value="2nd">2nd Semester</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>

              {/* Course Search */}
              <div className="field">
                <label>Courses</label>
                <input
                  className="search-input"
                  placeholder="Search courses..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                />
              </div>

              {/* Course List */}
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
                {filteredCourses.length === 0 && (
                  <p className="no-results">No courses found.</p>
                )}
              </div>

              <p className="selected-count">
                {form.course_ids.length} course{form.course_ids.length !== 1 ? "s" : ""} selected
              </p>
            </div>

            <div className="modal-footer">
              <button className="outline-btn" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
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
