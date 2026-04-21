import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { courseService } from "../../services";
import { httpClient } from "../../services/httpClient";
import { API_ENDPOINTS } from "../../services/apiEndpoints";
import styles from "../../styles/Dean/CourseManagement.module.css";

const EMPTY_FORM = {
  course_code: "", course_name: "", program_id: "",
  year_level: "1", semester: "1st", type: "lec",
  lec_units: 3, lab_units: 0, units: 3, prerequisites: "",
};

export default function CourseManagement() {
  const cx = (...classKeys) =>
    classKeys
      .filter(Boolean)
      .map((k) => styles[k])
      .filter(Boolean)
      .join(" ");

  const queryClient = useQueryClient();

  // ── Cached queries ──
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const res = await courseService.getAll();
      return res.ok ? (res.data ?? []) : [];
    },
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const res = await httpClient.get(API_ENDPOINTS.PROGRAMS.LIST);
      return res.ok ? (res.data ?? []) : [];
    },
  });

  const [search,        setSearch]        = useState("");
  const [filterProgram, setFilterProgram] = useState("");
  const [showModal,     setShowModal]     = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [toast,         setToast]         = useState(null);

  /* ===========================
     TOAST
  =========================== */

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  /* ===========================
     FILTERED COURSES
  =========================== */

  const filteredCourses = useMemo(() => courses.filter((c) => {
    const matchesSearch =
      c.course_code.toLowerCase().includes(search.toLowerCase()) ||
      c.course_name.toLowerCase().includes(search.toLowerCase());

    // Match against primary program_id OR any curriculum program
    const pid = Number(filterProgram);
    const matchesProgram = !filterProgram ||
      c.program_id === pid ||
      c.curriculum_programs?.some(p => p.id === pid);

    return matchesSearch && matchesProgram;
  }), [courses, search, filterProgram]);

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
     AUTO-COMPUTE UNITS
  =========================== */

  const handleTypeChange = (type) => {
    let lec = 3, lab = 0;
    if (type === "lab")     { lec = 0; lab = 3; }
    if (type === "lec+lab") { lec = 2; lab = 1; }
    setForm((prev) => ({ ...prev, type, lec_units: lec, lab_units: lab, units: lec + lab }));
  };

  const handleUnitChange = (field, value) => {
    const val = parseInt(value) || 0;
    setForm((prev) => {
      const updated = { ...prev, [field]: val };
      updated.units = (updated.lec_units || 0) + (updated.lab_units || 0);
      return updated;
    });
  };

  /* ===========================
     MODAL ACTIONS
  =========================== */

  const openAddModal = () => {
    setEditingCourse(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setForm({
      course_code:   course.course_code,
      course_name:   course.course_name,
      program_id:    String(course.program_id),
      year_level:    course.year_level,
      semester:      course.semester,
      type:          course.type,
      lec_units:     course.lec_units,
      lab_units:     course.lab_units,
      units:         course.units,
      prerequisites: course.prerequisites || "",
    });
    setShowModal(true);
  };

  /* ===========================
     SAVE — setQueryData, no refetch
  =========================== */

  const saveCourse = async () => {
    setSaving(true);
    try {
      const res = editingCourse
        ? await courseService.update(editingCourse.id, form)
        : await courseService.create(form);

      if (res.ok) {
        showToast("success", res.message || "Course saved.");
        setShowModal(false);
        queryClient.setQueryData(["courses"], (old = []) => {
          if (editingCourse) return old.map(c => c.id === res.data.id ? res.data : c);
          return [...old, res.data];
        });
      } else {
        const firstError = res.errors ? Object.values(res.errors)[0]?.[0] : null;
        showToast("error", firstError || res.message || "Failed to save course.");
      }
    } catch {
      showToast("error", "Failed to save course.");
    } finally {
      setSaving(false);
    }
  };

  /* ===========================
     DELETE — setQueryData, no refetch
  =========================== */

  const deleteCourse = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      const res = await courseService.delete(id);
      if (res.ok) {
        showToast("success", "Course deleted.");
        queryClient.setQueryData(["courses"], (old = []) => old.filter(c => c.id !== id));
      } else {
        showToast("error", res.message || "Failed to delete course.");
      }
    } catch {
      showToast("error", "Failed to delete course.");
    }
  };

  /* ===========================
     JSX
  =========================== */

  return (
    <div className={styles["courses-page"]}>

      {toast && <div className={cx("toast", `toast-${toast.type}`)}>{toast.message}</div>}

      {/* HEADER */}
      <div className={styles["page-header"]}>
        <div>
          <h2 className={styles["page-title"]}>Course Management</h2>
          <p className={styles["page-sub"]}>Add, edit, and manage all available courses in the department.</p>
        </div>
        <div className={styles["header-actions"]}>
          <button className={styles["primary-btn"]} onClick={openAddModal}>Add New Course</button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className={cx("filter-bar", "pcard")}>
        <div className={styles["filter-main"]}>
          <div className={styles["search-group"]}>
            <label>Search Course</label>
            <div className={styles["search-wrapper"]}>
              <input
                type="text"
                placeholder="Search by code or name..."
                className={styles["search-input"]}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className={styles["filter-group"]}>
            <label>Program</label>
            <div className={styles["select-wrapper"]}>
              <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)}>
                <option value="">All Programs</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.program_code}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className={cx("courses-list", "pcard")}>
        {isLoading ? (
          <div className={styles["loading-state"]}>
            <div className={styles.spinner} />
            Loading courses...
          </div>
        ) : (
          <div className={styles["table-container"]}>
            <table className={styles["data-table"]}>
              <thead>
                <tr>
                  <th width="120">Code</th>
                  <th>Course Name</th>
                  <th width="100">Program</th>
                  <th width="100">Type</th>
                  <th width="150">Year / Sem</th>
                  <th width="150">Units</th>
                  <th width="100" className={styles["text-right"]}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((c) => (
                  <tr key={c.id}>
                    <td><span className={styles["code-badge"]}>{c.course_code}</span></td>
                    <td><strong>{c.course_name}</strong></td>
                    <td>
                      {c.curriculum_programs?.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {c.curriculum_programs.map((p) => (
                            <span key={p.id} className={styles["program-badge-table"]}>{p.program_code}</span>
                          ))}
                        </div>
                      ) : (
                        <span className={styles["program-badge-table"]}>{c.program?.program_code ?? "—"}</span>
                      )}
                    </td>
                    <td>
                      <span className={cx("type-badge", c.type)}>{c.type}</span>
                    </td>
                    <td className={styles["year-sem-text"]}>
                      {c.year_level}{getYearSuffix(c.year_level)} Year · {c.semester}
                    </td>
                    <td>
                      <div className={styles["units-breakdown"]}>
                        <span className={styles["total-units-badge"]}>{c.units} Units</span>
                        <span className={styles["units-detail"]}>
                          <span>Lec {c.lec_units}</span><span>·</span><span>Lab {c.lab_units}</span>
                        </span>
                      </div>
                    </td>
                    <td className={styles["actions-cell"]}>
                      <button className={styles["edit-btn"]} onClick={() => openEditModal(c)}>Edit</button>
                      <button className={styles["delete-btn"]} onClick={() => deleteCourse(c.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredCourses.length === 0 && (
                  <tr><td colSpan="7" className={styles["empty-row"]}>No courses found matching your criteria.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className={styles["modal-overlay"]} onClick={(e) => !saving && e.target === e.currentTarget && setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles["modal-header"]}>
              <div>
                <h3>{editingCourse ? "Edit Course" : "Add New Course"}</h3>
                <p className={styles["modal-sub"]}>
                  {editingCourse ? `Editing ${editingCourse.course_code}` : "Fill in the course details below."}
                </p>
              </div>
              <button className={styles["ghost-btn"]} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className={styles["modal-body"]}>
              <div className={styles["form-grid"]}>
                <div className={styles["form-group"]}>
                  <label>Course Code</label>
                  <input className={styles["form-control-modern"]} placeholder="e.g. IT101" value={form.course_code} onChange={(e) => setForm({ ...form, course_code: e.target.value })} />
                </div>
                <div className={styles["form-group"]}>
                  <label>Program</label>
                  <select className={styles["form-control-modern"]} value={form.program_id} onChange={(e) => setForm({ ...form, program_id: e.target.value })}>
                    <option value="">Select program</option>
                    {programs.map((p) => <option key={p.id} value={p.id}>{p.program_code} — {p.program_name}</option>)}
                  </select>
                </div>
                <div className={styles["form-group"]} style={{ gridColumn: "1 / -1" }}>
                  <label>Course Name</label>
                  <input className={styles["form-control-modern"]} placeholder="e.g. Introduction to Computing" value={form.course_name} onChange={(e) => setForm({ ...form, course_name: e.target.value })} />
                </div>
                <div className={styles["form-group"]}>
                  <label>Year Level</label>
                  <select className={styles["form-control-modern"]} value={form.year_level} onChange={(e) => setForm({ ...form, year_level: e.target.value })}>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div className={styles["form-group"]}>
                  <label>Semester</label>
                  <select className={styles["form-control-modern"]} value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                    <option value="1st">1st Semester</option>
                    <option value="2nd">2nd Semester</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>
                <div className={styles["form-group"]}>
                  <label>Type</label>
                  <select className={styles["form-control-modern"]} value={form.type} onChange={(e) => handleTypeChange(e.target.value)}>
                    <option value="lec">Lecture</option>
                    <option value="lab">Laboratory</option>
                    <option value="lec+lab">Lec + Lab</option>
                  </select>
                </div>
                <div className={styles["form-group"]}>
                  <label>Total Units</label>
                  <input className={styles["form-control-modern"]} type="number" min="0" value={form.units} readOnly style={{ background: "#faf8f6", color: "#9a8070" }} />
                </div>
                <div className={styles["form-group"]}>
                  <label>Lec Units</label>
                  <input className={styles["form-control-modern"]} type="number" min="0" value={form.lec_units} onChange={(e) => handleUnitChange("lec_units", e.target.value)} />
                </div>
                <div className={styles["form-group"]}>
                  <label>Lab Units</label>
                  <input className={styles["form-control-modern"]} type="number" min="0" value={form.lab_units} onChange={(e) => handleUnitChange("lab_units", e.target.value)} />
                </div>
                <div className={styles["form-group"]} style={{ gridColumn: "1 / -1" }}>
                  <label>Prerequisites <span style={{ color: "#b89f90", fontWeight: 400 }}>(optional, comma-separated codes)</span></label>
                  <input className={styles["form-control-modern"]} placeholder="e.g. IT101, IT102" value={form.prerequisites} onChange={(e) => setForm({ ...form, prerequisites: e.target.value })} />
                </div>
              </div>
            </div>

            <div className={styles["modal-footer"]}>
              <button className={styles["ghost-btn"]} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={styles["primary-btn"]} onClick={saveCourse} disabled={saving}>
                {saving ? "Saving..." : editingCourse ? "Update Course" : "Add Course"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
