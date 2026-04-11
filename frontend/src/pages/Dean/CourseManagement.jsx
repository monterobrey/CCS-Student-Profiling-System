import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/Dean/CourseManagement.css";

export default function CourseManagement() {

  const [courses, setCourses] = useState([]);
  const [programs, setPrograms] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const [search, setSearch] = useState("");
  const [filterProgram, setFilterProgram] = useState("");

  const [form, setForm] = useState({
    course_code: "",
    course_name: "",
    program_id: "",
    year_level: "1",
    semester: "1st",
    type: "lec",
    lec_units: 3,
    lab_units: 0,
    units: 3,
    prerequisites: ""
  });

  /* ===========================
     FILTERED COURSES
  =========================== */

  const filteredCourses = courses.filter(c => {

    const matchesSearch =
      c.course_code
        .toLowerCase()
        .includes(search.toLowerCase()) ||

      c.course_name
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesProgram =
      !filterProgram ||
      c.program_id == filterProgram;

    return matchesSearch && matchesProgram;

  });

  /* ===========================
     YEAR SUFFIX
  =========================== */

  const getYearSuffix = y => {

    if (y == 1) return "st";
    if (y == 2) return "nd";
    if (y == 3) return "rd";

    return "th";

  };

  /* ===========================
     UPDATE UNITS
  =========================== */

  const updateUnits = () => {

    let newForm = { ...form };

    if (form.type === "lec") {

      newForm.lec_units = 3;
      newForm.lab_units = 0;

    }
    else if (form.type === "lab") {

      newForm.lec_units = 0;
      newForm.lab_units = 3;

    }
    else {

      newForm.lec_units = 2;
      newForm.lab_units = 1;

    }

    newForm.units =
      (newForm.lec_units || 0) +
      (newForm.lab_units || 0);

    setForm(newForm);

  };

  /* ===========================
     FETCH DATA
  =========================== */

  const fetchCourses = async () => {

    setLoading(true);

    try {

      const res =
        await axios.get("/courses");

      setCourses(res.data);

    }
    catch (err) {

      console.error(
        "Failed to fetch courses:",
        err
      );

    }
    finally {

      setLoading(false);

    }

  };

  const fetchPrograms = async () => {

    try {

      const res =
        await axios.get("/programs");

      setPrograms(res.data);

    }
    catch (err) {

      console.error(
        "Failed to fetch programs:",
        err
      );

    }

  };

  useEffect(() => {

    fetchCourses();
    fetchPrograms();

  }, []);

  /* ===========================
     MODAL ACTIONS
  =========================== */

  const openAddModal = () => {

    setEditingCourse(null);

    setForm({
      course_code: "",
      course_name: "",
      program_id: "",
      year_level: "1",
      semester: "1st",
      type: "lec",
      lec_units: 3,
      lab_units: 0,
      units: 3,
      prerequisites: ""
    });

    setShowModal(true);

  };

  const openEditModal = course => {

    setEditingCourse(course);

    setForm({
      course_code: course.course_code,
      course_name: course.course_name,
      program_id: course.program_id,
      year_level: course.year_level,
      semester: course.semester,
      type: course.type,
      lec_units: course.lec_units,
      lab_units: course.lab_units,
      units: course.units,
      prerequisites:
        course.prerequisites || ""
    });

    setShowModal(true);

  };

  /* ===========================
     SAVE COURSE
  =========================== */

  const saveCourse = async () => {

    setSaving(true);

    try {

      if (editingCourse) {

        await axios.put(
          `/courses/${editingCourse.id}`,
          form
        );

        alert(
          "Course updated successfully."
        );

      }
      else {

        await axios.post(
          "/courses",
          form
        );

        alert(
          "Course added successfully."
        );

      }

      setShowModal(false);

      fetchCourses();

    }
    catch (err) {

      alert(
        err.response?.data?.message ||
        "Failed to save course."
      );

    }
    finally {

      setSaving(false);

    }

  };

  /* ===========================
     DELETE
  =========================== */

  const deleteCourse = async id => {

    if (
      !window.confirm(
        "Are you sure you want to delete this course?"
      )
    )
      return;

    try {

      await axios.delete(
        `/courses/${id}`
      );

      fetchCourses();

    }
    catch {

      alert("Failed to delete course.");

    }

  };

  /* ===========================
     JSX
  =========================== */

  return (

    <div className="courses-page">

      {/* HEADER */}

      <div className="page-header">

        <div>

          <h2 className="page-title">
            Course Management
          </h2>

          <p className="page-sub">
            Add, edit, and manage all available courses in the department.
          </p>

        </div>

        <div className="header-actions">

          <button
            className="primary-btn"
            onClick={openAddModal}
          >

            Add New Course

          </button>

        </div>

      </div>

      {/* FILTER BAR */}

      <div className="filter-bar pcard">

        <div className="filter-main">

          <div className="search-group">

            <label>
              Search Course
            </label>

            <div className="search-wrapper">

              <input
                type="text"
                placeholder="Search by code or name..."
                className="search-input"
                value={search}
                onChange={e =>
                  setSearch(e.target.value)
                }
              />

            </div>

          </div>

          <div className="filter-group">

            <label>
              Program
            </label>

            <div className="select-wrapper">

              <select
                value={filterProgram}
                onChange={e =>
                  setFilterProgram(
                    e.target.value
                  )
                }
              >

                <option value="">
                  All Programs
                </option>

                {programs.map(p => (

                  <option
                    key={p.id}
                    value={p.id}
                  >

                    {p.program_code}

                  </option>

                ))}

              </select>

            </div>

          </div>

        </div>

      </div>

      {/* TABLE */}

      <div className="courses-list pcard">

        {loading ? (

          <div className="loading-state">
            Loading courses...
          </div>

        ) : (

          <div className="table-container">

            <table className="data-table">

              <thead>

                <tr>

                  <th width="120">
                    Code
                  </th>

                  <th>
                    Course Name
                  </th>

                  <th width="100">
                    Program
                  </th>

                  <th width="100">
                    Type
                  </th>

                  <th width="150">
                    Year/Sem
                  </th>

                  <th width="150">
                    Units
                  </th>

                  <th
                    width="100"
                    className="text-right"
                  >

                    Action

                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredCourses.map(c => (

                  <tr key={c.id}>

                    <td>

                      <span className="code-badge">
                        {c.course_code}
                      </span>

                    </td>

                    <td>

                      <strong>
                        {c.course_name}
                      </strong>

                    </td>

                    <td>

                      {c.program?.program_code}

                    </td>

                    <td>

                      {c.type}

                    </td>

                    <td>

                      {c.year_level}
                      {getYearSuffix(
                        c.year_level
                      )}{" "}
                      Year · {c.semester}

                    </td>

                    <td>

                      {c.units} Units

                    </td>

                    <td className="actions-cell">

                      <button
                        className="edit-btn"
                        onClick={() =>
                          openEditModal(c)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() =>
                          deleteCourse(c.id)
                        }
                      >
                        Delete
                      </button>

                    </td>

                  </tr>

                ))}

                {filteredCourses.length === 0 && (

                  <tr>

                    <td
                      colSpan="7"
                      className="empty-row"
                    >

                      No courses found matching your criteria.

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>

  );

}