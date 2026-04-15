import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { curriculumService, courseService } from "../../services";
import { httpClient } from "../../services/httpClient";
import { API_ENDPOINTS } from "../../services/apiEndpoints";
import styles from "../../styles/Dean/CurriculumManagement.module.css";

export default function CurriculumManagement() {
  const cx = (...classKeys) =>
    classKeys
      .filter(Boolean)
      .map((k) => styles[k])
      .filter(Boolean)
      .join(" ");

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
      filtered = filtered.filter(item => item.year_level === filterYear);
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
    if (y === 1) return "st";
    if (y === 2) return "nd";
    if (y === 3) return "rd";
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
    <div className={styles["curriculum-page"]}>

      {toast && <div className={cx("toast", `toast-${toast.type}`)}>{toast.message}</div>}

      {/* HEADER */}
      <div className={styles["page-header"]}>
        <div>
          <h2 className={styles["page-title"]}>Curriculum Management</h2>
          <p className={styles["page-sub"]}>Define and manage program curricula.</p>
        </div>
        <div className={styles["header-actions"]}>
          <button className={styles["outline-btn"]} onClick={() => fileInput.current.click()} disabled={importing}>
            {importing ? "Importing..." : "Import CSV"}
          </button>
          <input ref={fileInput} type="file" hidden accept=".csv" onChange={handleImport} />
          <button
            className={styles["primary-btn"]}
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
      <div className={styles["filter-bar"]}>
        <input
          className={styles["search-input"]}
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
        <p className={styles["loading-text"]}>Loading curriculum...</p>
      ) : (
        groupedCurriculum.map((year) => {
          const totalCourses = year.semesters.reduce((sum, s) => sum + s.courses.length, 0);
          return (
            <div key={year.year} className={styles["year-block"]} data-year={year.year}>
              <div className={styles["year-block-header"]}>
                <span className={styles["year-pill"]}>{year.year}{getYearSuffix(year.year)} Year</span>
                <span className={styles["year-course-count"]}>{totalCourses} course{totalCourses !== 1 ? "s" : ""}</span>
              </div>

              <div className={styles["semesters-grid"]}>
                {year.semesters.map((sem) => (
                  <div key={sem.semester} className={styles["semester-box"]}>
                    <div className={styles["semester-box-header"]}>
                      <span className={styles["semester-label"]}>{sem.semester} Semester</span>
                      <span className={styles["semester-count-badge"]}>{sem.courses.length} subjects</span>
                    </div>

                    <table className={styles["sem-table"]}>
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Name</th>
                          <th>Type</th>
                          <th>Lec</th>
                          <th>Lab</th>
                          <th>Units</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sem.courses.map((item) => (
                          <tr key={item.id}>
                            <td><span className={styles["code-badge"]}>{item.course.course_code}</span></td>
                            <td>{item.course.course_name}</td>
                            <td>
                              <span className={cx("type-badge", `type-${item.course.type}`)}>
                                {item.course.type}
                              </span>
                            </td>
                            <td className={styles["unit-cell"]}>{item.course.lec_units ?? "—"}</td>
                            <td className={styles["unit-cell"]}>{item.course.lab_units ?? "—"}</td>
                            <td className={cx("unit-cell", "total")}>{item.course.units}</td>
                            <td>
                              <button className={styles["delete-btn-sm"]} onClick={() => deleteEntry(item.id)}>
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
            </div>
          );
        })
      )}

      {/* ADD CURRICULUM MODAL */}
      {showAddModal && (
        <div
          className={styles["modal-overlay"]}
          onClick={(e) => !saving && e.target === e.currentTarget && setShowAddModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles["modal-header"]}>
              <h3>Add Curriculum Entries</h3>
              <button className={styles["modal-close"]} onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className={styles["modal-body"]}>
              <div className={styles.field}>
                <label>Program</label>
                <select value={form.program_id} onChange={(e) => setForm({ ...form, program_id: e.target.value })}>
                  <option value="">Select program</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.program_code} — {p.program_name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label>Year Level</label>
                <select value={form.year_level} onChange={(e) => setForm({ ...form, year_level: e.target.value })}>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Semester</label>
                <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                  <option value="1st">1st Semester</option>
                  <option value="2nd">2nd Semester</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Courses</label>
                <input
                  className={styles["search-input"]}
                  placeholder="Search courses..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                />
              </div>
              <div className={styles["course-checklist"]}>
                {filteredCourses.map((c) => (
                  <label
                    key={c.id}
                    className={cx(
                      "course-check-item",
                      form.course_ids.includes(c.id) && "course-check-item-checked"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={form.course_ids.includes(c.id)}
                      onChange={() => toggleCourse(c.id)}
                    />
                    <span className={styles["course-meta"]}>
                      <span className={styles["course-code"]}>{c.course_code}</span>
                      <span className={styles["course-name"]}>{c.course_name}</span>
                    </span>
                  </label>
                ))}
                {filteredCourses.length === 0 && <p className={styles["no-results"]}>No courses found.</p>}
              </div>
              <p className={styles["selected-count"]}>
                {form.course_ids.length} course{form.course_ids.length !== 1 ? "s" : ""} selected
              </p>
            </div>
            <div className={styles["modal-footer"]}>
              <button className={styles["outline-btn"]} onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className={styles["primary-btn"]} onClick={saveBulkEntry} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
