/** API student record → form slices + small display helpers */

function emptyProfile() {
  return {
    student_number: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    gender: "",
    birthdate: "",
    civil_status: "",
    email: "",
    contact_number: "",
    course_name: "",
    section_name: "",
    year_level: "",
    gwa: "0.00",
  };
}

function emptyAddress() {
  return { house_no: "", street: "", barangay: "", city: "", province: "", zip: "" };
}

function emptyGuardian() {
  return { first_name: "", last_name: "", contact_number: "", relationship: "" };
}

function parseAddressString(address) {
  if (!address) return emptyAddress();
  const parts = String(address).split(",").map((s) => s.trim());
  return {
    house_no: parts[0] || "",
    street: parts[1] || "",
    barangay: parts[2] || "",
    city: parts[3] || "",
    province: parts[4] || "",
    zip: parts[5] || "",
  };
}

export function mapStudentProfileFromApi(data) {
  if (!data) {
    return {
      profile: emptyProfile(),
      address: emptyAddress(),
      guardian: emptyGuardian(),
      skills: [],
    };
  }

  const profile = {
    ...emptyProfile(),
    first_name: data.first_name || "",
    last_name: data.last_name || "",
    middle_name: data.middle_name || "",
    gender: data.gender || "",
    birthdate: data.birthdate ? String(data.birthdate).slice(0, 10) : "",
    civil_status: data.civil_status || "",
    contact_number: data.contact_number || "",
    student_number: data.user?.student_number ?? data.student_number ?? "—",
    email: data.user?.email ?? data.email ?? "—",
    course_name: data.program?.program_name ?? data.program?.name ?? "—",
    section_name: data.section?.section_name ?? data.section?.name ?? "Unassigned",
    year_level: data.year_level != null ? String(data.year_level) : "—",
    gwa: data.gwa != null ? String(data.gwa) : "0.00",
  };

  const address = data.address ? parseAddressString(data.address) : emptyAddress();

  const guardian = data.guardian
    ? {
        first_name: data.guardian.first_name || "",
        last_name: data.guardian.last_name || "",
        contact_number: data.guardian.contact_number || "",
        relationship: data.guardian.relationship || "",
      }
    : emptyGuardian();

  const skills = Array.isArray(data.skills) ? data.skills : [];

  return { profile, address, guardian, skills };
}

export function profileInitials(profile) {
  return ((profile.first_name?.[0] || "") + (profile.last_name?.[0] || "")).toUpperCase() || "ST";
}

export function profileFullName(profile) {
  return [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(" ") || "Student";
}

export function formatFullAddress(address) {
  return [address.house_no, address.street, address.barangay, address.city, address.province, address.zip]
    .filter(Boolean)
    .join(", ");
}

export function skillDisplayName(skill) {
  return skill?.skillName ?? skill?.skill_name ?? "";
}
