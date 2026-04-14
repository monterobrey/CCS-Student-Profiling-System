/** Validation, tab routing on errors, mobile hints, input guards */

const PH11 = /^[0-9]{11}$/;
const ZIP4 = /^[0-9]{4}$/;
const NAME = /^[a-zA-Z\s-]+$/;

const NAV_KEYS = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];

export function validateStudentProfileForm({ profile, address, guardian }) {
  const errors = {};

  if (!profile.gender) errors.gender = true;
  if (!profile.birthdate) errors.birthdate = true;
  if (!profile.civil_status) errors.civil_status = true;
  if (!profile.contact_number || !PH11.test(profile.contact_number)) {
    errors.contact_number = true;
  }

  if (!address.house_no) errors["address.house_no"] = true;
  if (!address.street) errors["address.street"] = true;
  if (!address.barangay) errors["address.barangay"] = true;
  if (!address.city) errors["address.city"] = true;
  if (!address.province) errors["address.province"] = true;
  if (!address.zip || !ZIP4.test(address.zip)) errors["address.zip"] = true;

  if (!guardian.first_name || !NAME.test(guardian.first_name)) {
    errors["guardian.first_name"] = true;
  }
  if (!guardian.last_name || !NAME.test(guardian.last_name)) {
    errors["guardian.last_name"] = true;
  }
  if (!guardian.relationship) errors["guardian.relationship"] = true;
  if (!guardian.contact_number || !PH11.test(guardian.contact_number)) {
    errors["guardian.contact_number"] = true;
  }

  return errors;
}

export function profileTabForErrors(errors) {
  if (errors.gender || errors.birthdate || errors.civil_status) return "personal";
  if (errors.contact_number || Object.keys(errors).some((k) => k.startsWith("address."))) {
    return "contact";
  }
  return "guardian";
}

export function mobileFieldHint(value) {
  if (!value) return "Mobile number is required.";
  if (!/^[0-9]+$/.test(value)) return "Numbers only — no letters or special characters.";
  if (value.length < 11) return "Must be 11 digits (e.g. 09XXXXXXXXX).";
  return "";
}

export function blockNonNumericKey(e) {
  if (!/[0-9]/.test(e.key) && !NAV_KEYS.includes(e.key)) e.preventDefault();
}

export function blockNonAlphaKey(e) {
  if (!/[a-zA-Z\s-]/.test(e.key) && !NAV_KEYS.includes(e.key)) e.preventDefault();
}
