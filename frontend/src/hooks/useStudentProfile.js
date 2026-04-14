import { useState, useLayoutEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { studentService } from "../services";
import {
  mapStudentProfileFromApi,
  formatFullAddress,
  profileInitials,
  profileFullName,
} from "../utils/profileMapper";
import {
  validateStudentProfileForm,
  profileTabForErrors,
  mobileFieldHint,
  blockNonNumericKey,
  blockNonAlphaKey,
} from "../utils/profileValidation";

const PROFILE_QUERY_KEY = ["student", "my-profile"];

export function useStudentProfile() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("personal");
  const [newSkill, setNewSkill] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [skills, setSkills] = useState([]);

  const [profile, setProfile] = useState(() => mapStudentProfileFromApi(null).profile);
  const [address, setAddress] = useState(() => mapStudentProfileFromApi(null).address);
  const [guardian, setGuardian] = useState(() => mapStudentProfileFromApi(null).guardian);

  const {
    data: profileRecord,
    isPending: profileLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      const res = await studentService.getProfile();
      if (!res.ok) throw new Error(res.message || "Failed to load profile");
      return res.data ?? null;
    },
  });

  useLayoutEffect(() => {
    if (!profileRecord) return;
    const mapped = mapStudentProfileFromApi(profileRecord);
    setProfile(mapped.profile);
    setAddress(mapped.address);
    setGuardian(mapped.guardian);
    setSkills(mapped.skills);
    setErrors({});
  }, [profileRecord]);

  const fullAddress = useMemo(() => formatFullAddress(address), [address]);
  const initials = useMemo(() => profileInitials(profile), [profile]);
  const fullName = useMemo(() => profileFullName(profile), [profile]);
  const contactNumberError = useMemo(
    () => mobileFieldHint(profile.contact_number),
    [profile.contact_number]
  );
  const guardianContactError = useMemo(
    () => mobileFieldHint(guardian.contact_number),
    [guardian.contact_number]
  );

  const saveProfile = useCallback(async () => {
    const newErrors = validateStudentProfileForm({ profile, address, guardian });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setActiveTab(profileTabForErrors(newErrors));
      return;
    }

    setSaving(true);
    try {
      const profileRes = await studentService.updateProfile({
        middle_name: profile.middle_name,
        gender: profile.gender,
        birthdate: profile.birthdate,
        civil_status: profile.civil_status,
        contact_number: profile.contact_number,
        address: fullAddress,
      });
      if (!profileRes.ok) {
        alert(profileRes.message || "Error saving profile.");
        return;
      }
      const guardianRes = await studentService.updateGuardian(guardian);
      if (!guardianRes.ok) {
        alert(guardianRes.message || "Error saving guardian information.");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert("Error saving profile changes.");
    } finally {
      setSaving(false);
    }
  }, [profile, address, guardian, fullAddress, queryClient]);

  const addSkill = useCallback(async () => {
    if (!newSkill.trim()) return;
    try {
      const res = await studentService.addSkill({
        skillName: newSkill.trim(),
        skill_category: "Technical",
      });
      if (!res.ok) {
        alert(res.message || "Failed to add skill.");
        return;
      }
      setNewSkill("");
      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    } catch (err) {
      console.error("Failed to add skill:", err);
    }
  }, [newSkill, queryClient]);

  const removeSkill = useCallback(
    async (id) => {
      try {
        const res = await studentService.removeSkill(id);
        if (!res.ok) {
          alert(res.message || "Failed to remove skill.");
          return;
        }
        await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      } catch (err) {
        console.error("Failed to remove skill:", err);
      }
    },
    [queryClient]
  );

  return {
    profile,
    setProfile,
    address,
    setAddress,
    guardian,
    setGuardian,
    skills,
    errors,
    activeTab,
    setActiveTab,
    newSkill,
    setNewSkill,
    inputFocused,
    setInputFocused,
    saving,
    profileLoading,
    isError,
    error,
    refetch,
    saveProfile,
    addSkill,
    removeSkill,
    initials,
    fullName,
    fullAddress,
    contactNumberError,
    guardianContactError,
    blockNonNumericKey,
    blockNonAlphaKey,
  };
}
