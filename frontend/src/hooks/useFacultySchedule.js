import { useQuery } from "@tanstack/react-query";
import { facultyService } from "../services/facultyService";

export function useFacultySchedule() {
  return useQuery({
    queryKey: ["faculty-schedule"],
    queryFn: async () => {
      const res = await facultyService.getMySchedule();
      return res.ok ? (res.data ?? []) : [];
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useSectionStudents(sectionId) {
  return useQuery({
    queryKey: ["faculty-section-students", sectionId],
    queryFn: async () => {
      const res = await facultyService.getSectionStudents(sectionId);
      return res.ok ? (res.data ?? []) : [];
    },
    enabled: Boolean(sectionId),
  });
}
