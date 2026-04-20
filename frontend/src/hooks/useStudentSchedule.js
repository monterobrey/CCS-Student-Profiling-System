import { useQuery } from "@tanstack/react-query";
import { httpClient } from "../services/httpClient";
import { API_ENDPOINTS } from "../services/apiEndpoints";

export function useStudentSchedule() {
  return useQuery({
    queryKey: ["student-schedule"],
    queryFn: async () => {
      const res = await httpClient.get(API_ENDPOINTS.STUDENT.SCHEDULE);
      return res.ok ? (res.data ?? []) : [];
    },
  });
}
