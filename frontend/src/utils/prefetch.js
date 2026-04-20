/**
 * Prefetch helpers — called on nav link hover so data is in cache
 * before the user even clicks. Pages render instantly with no loading state.
 *
 * Each function receives the queryClient and fires the same queryFn
 * that the target page uses, keyed identically so the cache is shared.
 */

import { studentService } from "../services/studentService";
import { curriculumService } from "../services/curriculumService";
import { awardService } from "../services/awardService";
import { API_ENDPOINTS } from "../services/apiEndpoints";
import { httpClient } from "../services/httpClient";

// ─── shared fetch fns (mirror what each page uses) ────────────────────────────

const fetchStudentProfile = async () => {
  const res = await studentService.getProfile();
  if (!res.ok) throw new Error(res.message || "Failed to load profile");
  return res.data ?? null;
};

const fetchStudentAwards = async () => {
  const res = await awardService.getMyAwards();
  return res.ok ? (res.data ?? []) : [];
};

const fetchStudentViolations = async () => {
  const res = await studentService.getViolations();
  return res.ok ? (res.data ?? []) : [];
};

const fetchStudentOrganizations = async () => {
  const res = await httpClient.get(API_ENDPOINTS.STUDENT.ORGANIZATIONS);
  return res.ok ? (res.data ?? []) : [];
};

// Curriculum depends on programId — we read it from the already-cached profile
// if available, otherwise skip (it will be fetched when the profile loads).
const fetchStudentCurriculum = async (queryClient) => {
  const profile = queryClient.getQueryData(["student", "my-profile"]);
  const programId = profile?.program?.id ?? null;
  if (!programId) return [];
  const res = await curriculumService.getForStudent(programId);
  return res.ok ? (res.data ?? []) : [];
};

// ─── prefetch map: route path → prefetch function ─────────────────────────────

/**
 * Call this on nav link mouseEnter.
 * @param {import("@tanstack/react-query").QueryClient} queryClient
 * @param {string} path  e.g. "profile", "curriculum", "awards"
 */
export function prefetchStudentPage(queryClient, path) {
  const STALE = 1000 * 60 * 5; // 5 min — same as global staleTime

  switch (path) {
    case "profile":
      queryClient.prefetchQuery({
        queryKey: ["student", "my-profile"],
        queryFn: fetchStudentProfile,
        staleTime: STALE,
      });
      break;

    case "curriculum":
      // Prefetch profile first (needed for programId), then curriculum
      queryClient.prefetchQuery({
        queryKey: ["student", "my-profile"],
        queryFn: fetchStudentProfile,
        staleTime: STALE,
      }).then(() => {
        const profile = queryClient.getQueryData(["student", "my-profile"]);
        const programId = profile?.program?.id ?? null;
        if (!programId) return;
        queryClient.prefetchQuery({
          queryKey: ["student-curriculum", String(programId)],
          queryFn: () => fetchStudentCurriculum(queryClient),
          staleTime: STALE,
        });
      });
      break;

    case "awards":
      queryClient.prefetchQuery({
        queryKey: ["student-awards"],
        queryFn: fetchStudentAwards,
        staleTime: STALE,
      });
      break;

    case "violations":
      queryClient.prefetchQuery({
        queryKey: ["student-violations"],
        queryFn: fetchStudentViolations,
        staleTime: STALE,
      });
      break;

    case "affiliations":
      queryClient.prefetchQuery({
        queryKey: ["student-profile"],
        queryFn: async () => {
          const res = await httpClient.get(API_ENDPOINTS.STUDENT.PROFILE);
          return res.ok ? res.data : null;
        },
        staleTime: STALE,
      });
      queryClient.prefetchQuery({
        queryKey: ["student-organizations"],
        queryFn: fetchStudentOrganizations,
        staleTime: STALE,
      });
      break;

    case "dashboard":
      // Dashboard uses its own axios call — prefetch the profile so at least
      // the profile-dependent pages are warm when navigating from dashboard.
      queryClient.prefetchQuery({
        queryKey: ["student", "my-profile"],
        queryFn: fetchStudentProfile,
        staleTime: STALE,
      });
      break;

    default:
      break;
  }
}
