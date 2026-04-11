import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
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

  const fileInput = useRef();

  const [form, setForm] = useState({
    program_id: "",
    year_level: "1",
    semester: "1st",
    course_ids: [],
  });

  /* ===========================
     FILTERED COURSES
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
      filtered = filtered.filter(
        (item) => item.year_level == filterYear
      );
    }

    if (curriculumSearch.trim()) {
      const s = curriculumSearch.toLowerCase();

      filtered = filtered.filter(
        (item) =>
          item.course.course_code
            .toLowerCase()
            .includes(s) ||
          item.course.course_name
            .toLowerCase()
            .includes(s)
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
          .map((s) => ({
            semester: s,
            courses: years[y][s],
          })),
      }));
  };

  /* ===========================
     FETCH DATA
  =========================== */

  const fetchCurriculum = async () => {
    setLoading(true);

    try {
      const res = await axios.get(
        "/dean/curriculum",
        {
          params: {
            program_id: filterProgram,
          },
        }
      );

      setCurriculum(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHelperData = async () => {
    try {
      const [programsRes, coursesRes] =
        await Promise.all([
          axios.get("/programs"),
          axios.get("/courses"),
        ]);

      setPrograms(programsRes.data);
      setCourses(coursesRes.data);

      const bsit = programsRes.data.find(
        (p) => p.program_code === "BSIT"
      );

      if (bsit) {
        setFilterProgram(bsit.id);
      }
    } catch (err) {
      console.error(err);
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

    const formData = new FormData();
    formData.append("file", file);

    setImporting(true);

    try {
      const res = await axios.post(
        "/dean/curriculum/import",
        formData
      );

      alert(res.data.message);

      fetchCurriculum();
    } catch (err) {
      alert("Import failed.");
    } finally {
      setImporting(false);
      fileInput.current.value = "";
    }
  };

  /* ===========================
     DELETE
  =========================== */

  const deleteEntry = async (id) => {
    if (
      !window.confirm(
        "Remove this course from curriculum?"
      )
    )
      return;

    try {
      await axios.delete(
        `/dean/curriculum/${id}`
      );

      fetchCurriculum();
    } catch {
      alert("Delete failed.");
    }
  };

  /* ===========================
     SAVE BULK
  =========================== */

  const saveBulkEntry = async () => {
    if (
      !form.program_id ||
      form.course_ids.length === 0
    ) {
      alert("Select courses first.");
      return;
    }

    setSaving(true);

    try {
      const res = await axios.post(
        "/dean/curriculum/bulk",
        form
      );

      alert(res.data.message);

      setShowAddModal(false);

      fetchCurriculum();
    } catch {
      alert("Save failed.");
    } finally {
      setSaving(false);
    }
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

      {/* HEADER */}

      <div className="page-header">

        <div>
          <h2 className="page-title">
            Curriculum Management
          </h2>

          <p className="page-sub">
            Define and manage program curricula.
          </p>
        </div>

        <div className="header-actions">

          <button
            className="outline-btn"
            onClick={() =>
              fileInput.current.click()
            }
          >
            {importing
              ? "Importing..."
              : "Import CSV"}
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
            onClick={() =>
              setShowAddModal(true)
            }
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
          onChange={(e) =>
            setCurriculumSearch(
              e.target.value
            )
          }
        />

        <select
          value={filterProgram}
          onChange={(e) =>
            setFilterProgram(
              e.target.value
            )
          }
        >
          {programs.map((p) => (
            <option
              key={p.id}
              value={p.id}
            >
              {p.program_code}
            </option>
          ))}
        </select>

        <select
          value={filterYear}
          onChange={(e) =>
            setFilterYear(
              e.target.value
            )
          }
        >
          <option value="all">
            All Years
          </option>

          <option value="1">
            1st Year
          </option>

          <option value="2">
            2nd Year
          </option>

          <option value="3">
            3rd Year
          </option>

          <option value="4">
            4th Year
          </option>

        </select>

      </div>

      {/* TABLE */}

      {groupedCurriculum().map(
        (year) => (

          <div
            key={year.year}
            className="year-section"
          >

            <h3 className="year-title">
              {year.year}
              {getYearSuffix(
                year.year
              )}{" "}
              Year
            </h3>

            {year.semesters.map(
              (sem) => (

                <div
                  key={sem.semester}
                  className="semester-card"
                >

                  <h4>
                    {sem.semester} Semester
                  </h4>

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

                      {sem.courses.map(
                        (item) => (

                          <tr
                            key={item.id}
                          >

                            <td>
                              {
                                item.course
                                  .course_code
                              }
                            </td>

                            <td>
                              {
                                item.course
                                  .course_name
                              }
                            </td>

                            <td>
                              {
                                item.course
                                  .units
                              }
                            </td>

                            <td>

                              <button
                                className="delete-btn-sm"
                                onClick={() =>
                                  deleteEntry(
                                    item.id
                                  )
                                }
                              >
                                Delete
                              </button>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )
            )}

          </div>

        )
      )}

    </div>
  );
}