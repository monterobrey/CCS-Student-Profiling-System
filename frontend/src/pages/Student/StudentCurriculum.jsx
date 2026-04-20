import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { studentService } from "../../services/studentService";
import { curriculumService } from "../../services/curriculumService";
import "../../styles/Student/StudentCurriculum.css";

const getYearSuffix = (y) => {
  if (y === 1) return "st";
  if (y === 2) return "nd";
  if (y === 3) return "rd";
  return "th";
};

export default function StudentCurriculum() {
  const [filterYear, setFilterYear] = useState("all");
  const [search, setSearch] = useState("");

  const {
    data: profileRecord,
    isPending: profileLoading,
    isError: profileError,
    error,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["student", "my-profile"],
    queryFn: async () => {
      const res = await studentService.getProfile();
      if (!res.ok) throw new Error(res.message || "Failed to load profile");
      return res.data ?? null;
    },
  });

  const program = profileRecord?.program ?? null;
  const programId = program?.id ?? null;

  const {
    data: curriculum = [],
    isPending: curriculumLoading,
    isError: curriculumError,
    refetch: refetchCurriculum,
  } = useQuery({
    queryKey: ["student-curriculum", String(programId || "")],
    queryFn: async () => {
      if (!programId) return [];
      const res = await curriculumService.getForStudent(programId);
      if (!res.ok) throw new Error(res.message || "Failed to load curriculum");
      return res.data ?? [];
    },
    enabled: !!programId,
  });

  const groupedCurriculum = useMemo(() => {
    let filtered = [...curriculum];

    if (filterYear !== "all") {
      filtered = filtered.filter((item) => String(item.year_level) === String(filterYear));
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter((item) => {
        const code = item?.course?.course_code?.toLowerCase?.() ?? "";
        const name = item?.course?.course_name?.toLowerCase?.() ?? "";
        return code.includes(s) || name.includes(s);
      });
    }

    const years = {};
    filtered.forEach((item) => {
      const y = String(item.year_level ?? "");
      if (!years[y]) years[y] = {};
      const sem = String(item.semester ?? "");
      if (!years[y][sem]) years[y][sem] = [];
      years[y][sem].push(item);
    });

    return Object.keys(years)
      .sort((a, b) => Number(a) - Number(b))
      .map((y) => ({
        year: y,
        semesters: Object.keys(years[y]).sort().map((s) => ({
          semester: s,
          courses: years[y][s],
        })),
      }));
  }, [curriculum, filterYear, search]);

  const programLabel = program
    ? [program.program_code, program.program_name].filter(Boolean).join(" — ")
    : null;

  const showErrorState = profileError || curriculumError;

  return (
    <div className="scur-page">
      <div className="scur-header">
        <div>
          <h2 className="scur-title">My Curriculum</h2>
          <p className="scur-sub">
            {programLabel ? (
              <>
                Based on your program: <span className="scur-program">{programLabel}</span>
              </>
            ) : (
              "View the subjects for your program curriculum."
            )}
          </p>
        </div>
      </div>

      <div className="scur-filter">
        <input
          className="scur-search"
          placeholder="Search by course code or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
          <option value="all">All Years</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </select>
      </div>

      {profileLoading ? (
        <div className="scur-state">
          <span className="scur-spinner" /> Loading your profile...
        </div>
      ) : !programId ? (
        <div className="scur-empty">
          <p className="scur-empty-title">No program assigned yet</p>
          <p className="scur-empty-sub">Once your program is set, your curriculum will appear here.</p>
        </div>
      ) : showErrorState ? (
        <div className="scur-empty scur-empty-error">
          <p className="scur-empty-title">Could not load curriculum</p>
          <p className="scur-empty-sub">{error?.message || "Please try again."}</p>
          <button
            className="scur-retry"
            onClick={() => {
              refetchProfile();
              refetchCurriculum();
            }}
          >
            Retry
          </button>
        </div>
      ) : curriculumLoading ? (
        <div className="scur-state">
          <span className="scur-spinner" /> Loading curriculum...
        </div>
      ) : groupedCurriculum.length === 0 ? (
        <div className="scur-empty">
          <p className="scur-empty-title">No curriculum entries found</p>
          <p className="scur-empty-sub">Try changing the year filter or search term.</p>
        </div>
      ) : (
        groupedCurriculum.map((year) => {
          const totalCourses = year.semesters.reduce((sum, s) => sum + s.courses.length, 0);
          const yNum = Number(year.year);
          return (
            <div key={year.year} className="scur-year-block" data-year={year.year}>
              <div className="scur-year-block-header">
                <span className="scur-year-pill">
                  {year.year}{Number.isFinite(yNum) ? getYearSuffix(yNum) : ""} Year
                </span>
                <span className="scur-year-course-count">
                  {totalCourses} course{totalCourses !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="scur-semesters-stack">
                {year.semesters.map((sem) => {
                  const semTotalUnits = sem.courses.reduce(
                    (sum, item) => sum + (Number(item.course?.units) || 0),
                    0
                  );
                  return (
                    <div key={sem.semester} className="scur-semester-box">
                      <div className="scur-semester-box-header">
                        <span className="scur-semester-label">{sem.semester} Semester</span>
                        <span className="scur-semester-count-badge">{sem.courses.length} subjects</span>
                      </div>

                      <table className="scur-sem-table">
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th className="scur-unit-cell">Lec</th>
                            <th className="scur-unit-cell">Lab</th>
                            <th className="scur-unit-cell">Units</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sem.courses.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <span className="scur-code-badge">{item.course?.course_code ?? "—"}</span>
                              </td>
                              <td>{item.course?.course_name ?? "—"}</td>
                              <td>
                                <span className={`scur-type-badge scur-type-${String(item.course?.type || "other").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                                  {item.course?.type ?? "—"}
                                </span>
                              </td>
                              <td className="scur-unit-cell">{item.course?.lec_units ?? "—"}</td>
                              <td className="scur-unit-cell">{item.course?.lab_units ?? "—"}</td>
                              <td className="scur-unit-cell scur-unit-total">{item.course?.units ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="scur-total-row">
                            <td colSpan={5} className="scur-total-label">Total Units</td>
                            <td className="scur-unit-cell scur-total-units">{semTotalUnits}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
