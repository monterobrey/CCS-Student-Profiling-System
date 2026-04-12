import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import "../../styles/Student/StudentProfile.css";

const StudentProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("personal");
  const [newSkill, setNewSkill] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [skills, setSkills] = useState([]);

  const [profile, setProfile] = useState({
    student_number: "", first_name: "", last_name: "", middle_name: "",
    gender: "", birthdate: "", civil_status: "", email: "",
    contact_number: "", course_name: "", section_name: "", year_level: "", gwa: "0.00",
  });

  const [address, setAddress] = useState({
    house_no: "", street: "", barangay: "", city: "", province: "", zip: "",
  });

  const [guardian, setGuardian] = useState({
    first_name: "", last_name: "", contact_number: "", relationship: "",
  });

  const tabs = [
    { key: "personal", label: "Personal" },
    { key: "contact", label: "Contact" },
    { key: "guardian", label: "Guardian" },
  ];

  const initials = useMemo(() => {
    return ((profile.first_name?.[0] || "") + (profile.last_name?.[0] || "")).toUpperCase() || "ST";
  }, [profile.first_name, profile.last_name]);

  const fullName = useMemo(() => {
    return [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(" ") || "Student";
  }, [profile.first_name, profile.middle_name, profile.last_name]);

  const fullAddress = useMemo(() => {
    return [address.house_no, address.street, address.barangay, address.city, address.province, address.zip]
      .filter(Boolean).join(", ");
  }, [address]);

  const contactNumberError = useMemo(() => {
    if (!profile.contact_number) return "Mobile number is required.";
    if (!/^[0-9]+$/.test(profile.contact_number)) return "Numbers only — no letters or special characters.";
    if (profile.contact_number.length < 11) return "Must be 11 digits (e.g. 09XXXXXXXXX).";
    return "";
  }, [profile.contact_number]);

  const guardianContactError = useMemo(() => {
    if (!guardian.contact_number) return "Contact number is required.";
    if (!/^[0-9]+$/.test(guardian.contact_number)) return "Numbers only — no letters or special characters.";
    if (guardian.contact_number.length < 11) return "Must be 11 digits (e.g. 09XXXXXXXXX).";
    return "";
  }, [guardian.contact_number]);

  const blockNonNumeric = (e) => {
    if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const blockNonAlpha = (e) => {
    if (!/[a-zA-Z\s\-]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/student/profile");
      const data = response.data;
      if (data) {
        setProfile(prev => ({
          ...prev,
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          middle_name: data.middle_name || "",
          gender: data.gender || "",
          birthdate: data.birthdate || "",
          civil_status: data.civil_status || "",
          contact_number: data.contact_number || "",
          student_number: data.user?.student_number || data.student_number || "—",
          email: data.user?.email || data.email || "—",
          course_name: data.program?.program_name || data.program?.name || "—",
          section_name: data.section?.section_name || data.section?.name || "Unassigned",
          year_level: data.year_level || "—",
          gwa: data.gwa || "0.00",
        }));
        if (data.address) {
          const parts = data.address.split(",").map(s => s.trim());
          setAddress({
            house_no: parts[0] || "", street: parts[1] || "", barangay: parts[2] || "",
            city: parts[3] || "", province: parts[4] || "", zip: parts[5] || "",
          });
        }
        if (data.guardian) {
          setGuardian({
            first_name: data.guardian.first_name || "",
            last_name: data.guardian.last_name || "",
            contact_number: data.guardian.contact_number || "",
            relationship: data.guardian.relationship || "",
          });
        }
        setSkills(data.skills || []);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const saveProfile = async () => {
    const newErrors = {};
    if (!profile.gender) newErrors.gender = true;
    if (!profile.birthdate) newErrors.birthdate = true;
    if (!profile.civil_status) newErrors.civil_status = true;
    if (!profile.contact_number || !/^[0-9]{11}$/.test(profile.contact_number)) newErrors.contact_number = true;
    if (!address.house_no) newErrors["address.house_no"] = true;
    if (!address.street) newErrors["address.street"] = true;
    if (!address.barangay) newErrors["address.barangay"] = true;
    if (!address.city) newErrors["address.city"] = true;
    if (!address.province) newErrors["address.province"] = true;
    if (!address.zip || !/^[0-9]{4}$/.test(address.zip)) newErrors["address.zip"] = true;
    if (!guardian.first_name || /[^a-zA-Z\s\-]/.test(guardian.first_name)) newErrors["guardian.first_name"] = true;
    if (!guardian.last_name || /[^a-zA-Z\s\-]/.test(guardian.last_name)) newErrors["guardian.last_name"] = true;
    if (!guardian.relationship) newErrors["guardian.relationship"] = true;
    if (!guardian.contact_number || !/^[0-9]{11}$/.test(guardian.contact_number)) newErrors["guardian.contact_number"] = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.gender || newErrors.birthdate || newErrors.civil_status) setActiveTab("personal");
      else if (newErrors.contact_number || Object.keys(newErrors).some(k => k.startsWith("address."))) setActiveTab("contact");
      else setActiveTab("guardian");
      return;
    }

    setSaving(true);
    try {
      await axios.post("/student/profile", {
        middle_name: profile.middle_name, gender: profile.gender,
        birthdate: profile.birthdate, civil_status: profile.civil_status,
        contact_number: profile.contact_number, address: fullAddress,
        address_house_no: address.house_no, address_street: address.street,
        address_barangay: address.barangay, address_city: address.city,
        address_province: address.province, address_zip: address.zip,
      });
      await axios.post("/student/guardian", guardian);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert("Error saving profile changes.");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = async () => {
    if (!newSkill.trim()) return;
    try {
      const response = await axios.post("/student/skills", { skillName: newSkill, skill_category: "Technical" });
      setSkills(prev => [...prev, response.data.skill]);
      setNewSkill("");
    } catch (err) {
      console.error("Failed to add skill:", err);
    }
  };

  const removeSkill = async (id) => {
    try {
      await axios.delete(`/student/skills/${id}`);
      setSkills(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error("Failed to remove skill:", err);
    }
  };

  return (
    <div className="spr-page">
      {/* Header */}
      <div className="spr-page-header">
        <div>
          <h2 className="spr-section-title">My Academic Profile</h2>
          <p className="spr-section-desc">Keep your personal and contact information up to date.</p>
        </div>
        <button className="spr-save-btn" onClick={saveProfile} disabled={saving}>
          {saving && <span className="spr-spinner-sm"></span>}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Error Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="spr-error-summary">
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Please fill in all required fields marked in red.</span>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="spr-loading-state">
          <span className="spr-spinner"></span>
          Loading your profile...
        </div>
      ) : (
        <div className="spr-profile-grid">

          {/* LEFT COLUMN */}
          <div className="spr-profile-main">

            {/* Identity Strip */}
            <div className="spr-identity-card">
              <div className="spr-avatar-circle">{initials}</div>
              <div className="spr-identity-info">
                <div className="spr-identity-name">{fullName}</div>
                <div className="spr-identity-meta">{profile.student_number} · {profile.section_name || "Unassigned"}</div>
              </div>
              <span className="spr-active-badge">Active</span>
            </div>

            {/* Tabbed Card */}
            <div className="spr-profile-card">
              <div className="spr-tab-bar">
                {tabs.map(tab => (
                  <button key={tab.key} className={`spr-tab-item${activeTab === tab.key ? " active" : ""}`}
                    onClick={() => setActiveTab(tab.key)}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Personal Tab */}
              {activeTab === "personal" && (
                <div className="spr-card-body">
                  <div className="spr-tab-header">
                    <div className="spr-tab-icon spr-personal">
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </div>
                    <div className="spr-tab-header-text">
                      <div className="spr-tab-header-title">Personal Information</div>
                      <div className="spr-tab-header-subtitle">Basic details about you</div>
                    </div>
                  </div>
                  <div className="spr-form-grid">
                    <div className="spr-form-group spr-full-width">
                      <label>Student Number</label>
                      <div className="spr-input-icon">
                        <svg className="spr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h10M7 12h6" /></svg>
                        <input value={profile.student_number} type="text" readOnly className="spr-readonly-input" />
                      </div>
                    </div>
                    <div className="spr-form-group">
                      <label>First Name</label>
                      <div className="spr-input-icon">
                        <svg className="spr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        <input value={profile.first_name} type="text" readOnly className="spr-readonly-input" />
                      </div>
                    </div>
                    <div className="spr-form-group">
                      <label>Last Name</label>
                      <div className="spr-input-icon">
                        <svg className="spr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        <input value={profile.last_name} type="text" readOnly className="spr-readonly-input" />
                      </div>
                    </div>
                    <div className="spr-form-group">
                      <label>Middle Name</label>
                      <div className="spr-input-icon">
                        <svg className="spr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        <input type="text" placeholder="Optional" value={profile.middle_name}
                          onChange={e => setProfile(p => ({ ...p, middle_name: e.target.value }))}
                          className={errors.middle_name ? "spr-error-input" : ""} />
                      </div>
                    </div>
                    <div className="spr-form-group">
                      <label>Gender</label>
                      <div className="spr-input-icon">
                        <svg className="spr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v6m0 12v2M9 5h6M5 12h14" /></svg>
                        <select value={profile.gender} onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}
                          className={errors.gender ? "spr-error-input" : ""}>
                          <option value="">Select Gender</option>
                          <option>Male</option><option>Female</option><option>Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="spr-form-group">
                      <label>Birthdate</label>
                      <div className="spr-input-icon">
                        <svg className="spr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                        <input type="date" value={profile.birthdate}
                          onChange={e => setProfile(p => ({ ...p, birthdate: e.target.value }))}
                          className={errors.birthdate ? "spr-error-input" : ""} />
                      </div>
                    </div>
                    <div className="spr-form-group">
                      <label>Civil Status</label>
                      <div className="spr-input-icon">
                        <svg className="spr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
                        <select value={profile.civil_status} onChange={e => setProfile(p => ({ ...p, civil_status: e.target.value }))}
                          className={errors.civil_status ? "spr-error-input" : ""}>
                          <option value="">Select Status</option>
                          <option>Single</option><option>Married</option><option>Separated</option><option>Widowed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Tab */}
              {activeTab === "contact" && (
                <div className="spr-card-body">
                  <div className="spr-tab-header">
                    <div className="spr-tab-icon spr-contact">
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 015.19 12a19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="spr-tab-header-text">
                      <div className="spr-tab-header-title">Contact Details</div>
                      <div className="spr-tab-header-subtitle">How we can reach you</div>
                    </div>
                  </div>
                  <div className="spr-form-grid">
                    <div className="spr-form-group spr-full-width">
                      <label>Institutional Email</label>
                      <div className="spr-input-icon">
                        <svg className="spr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg>
                        <input value={profile.email} type="email" readOnly className="spr-readonly-input" />
                      </div>
                    </div>
                    <div className="spr-form-group">
                      <label>Mobile Number</label>
                      <div className="spr-input-icon">
                        <svg className="spr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></svg>
                        <input type="tel" placeholder="09XX XXX XXXX" maxLength="11"
                          value={profile.contact_number}
                          onChange={e => setProfile(p => ({ ...p, contact_number: e.target.value.replace(/[^0-9]/g, "") }))}
                          onKeyPress={blockNonNumeric}
                          className={errors.contact_number ? "spr-error-input" : ""} />
                      </div>
                      {errors.contact_number && <span className="spr-field-error-msg">{contactNumberError}</span>}
                    </div>

                    {/* Address */}
                    <div className="spr-form-group spr-full-width spr-address-section">
                      <div className="spr-address-section-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        Permanent Address
                      </div>
                      <div className="spr-address-grid">
                        {[
                          { key: "house_no", label: "House / Unit No.", placeholder: "e.g. 123 or Unit 4B" },
                          { key: "street", label: "Street", placeholder: "e.g. Rizal St." },
                          { key: "barangay", label: "Barangay", placeholder: "e.g. Brgy. San Jose" },
                          { key: "city", label: "City / Municipality", placeholder: "e.g. Calamba City" },
                          { key: "province", label: "Province", placeholder: "e.g. Laguna" },
                        ].map(f => (
                          <div className="spr-form-group" key={f.key}>
                            <label>{f.label}</label>
                            <input type="text" placeholder={f.placeholder} value={address[f.key]}
                              onChange={e => setAddress(a => ({ ...a, [f.key]: e.target.value }))}
                              className={errors[`address.${f.key}`] ? "spr-error-input" : ""} />
                            {errors[`address.${f.key}`] && <span className="spr-field-error-msg">Required</span>}
                          </div>
                        ))}
                        <div className="spr-form-group">
                          <label>ZIP Code</label>
                          <input type="text" placeholder="e.g. 4027" maxLength="4" value={address.zip}
                            onChange={e => setAddress(a => ({ ...a, zip: e.target.value.replace(/[^0-9]/g, "") }))}
                            onKeyPress={blockNonNumeric}
                            className={errors["address.zip"] ? "spr-error-input" : ""} />
                          {errors["address.zip"] && <span className="spr-field-error-msg">Required (4-digit ZIP)</span>}
                        </div>
                      </div>
                      {fullAddress && (
                        <div className="spr-address-preview">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3.5 4.5 8.5 4.5 8.5S12.5 9.5 12.5 6c0-2.5-2-4.5-4.5-4.5z" /><circle cx="8" cy="6" r="1.5" /></svg>
                          {fullAddress}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Guardian Tab */}
              {activeTab === "guardian" && (
                <div className="spr-card-body">
                  <div className="spr-tab-header">
                    <div className="spr-tab-icon spr-guardian">
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="spr-tab-header-text">
                      <div className="spr-tab-header-title">Guardian Information</div>
                      <div className="spr-tab-header-subtitle">Emergency contact person</div>
                    </div>
                  </div>
                  <div className="spr-form-grid">
                    {[
                      { key: "first_name", label: "Guardian First Name", placeholder: "First name" },
                      { key: "last_name", label: "Guardian Last Name", placeholder: "Last name" },
                    ].map(f => (
                      <div className="spr-form-group" key={f.key}>
                        <label>{f.label}</label>
                        <div className="spr-input-icon">
                          <svg className="spr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                          <input type="text" placeholder={f.placeholder} value={guardian[f.key]}
                            onChange={e => setGuardian(g => ({ ...g, [f.key]: e.target.value.replace(/[^a-zA-Z\s\-]/g, "") }))}
                            onKeyPress={blockNonAlpha}
                            className={errors[`guardian.${f.key}`] ? "spr-error-input" : ""} />
                        </div>
                        {errors[`guardian.${f.key}`] && (
                          <span className="spr-field-error-msg">
                            {guardian[f.key] ? "Letters only — no numbers or special characters." : "Required"}
                          </span>
                        )}
                      </div>
                    ))}
                    <div className="spr-form-group">
                      <label>Relationship</label>
                      <div className="spr-input-icon">
                        <svg className="spr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
                        <select value={guardian.relationship}
                          onChange={e => setGuardian(g => ({ ...g, relationship: e.target.value }))}
                          className={errors["guardian.relationship"] ? "spr-error-input" : ""}>
                          <option value="">Select</option>
                          <option>Parent</option><option>Sibling</option><option>Relative</option><option>Guardian</option>
                        </select>
                      </div>
                    </div>
                    <div className="spr-form-group">
                      <label>Contact Number</label>
                      <div className="spr-input-icon">
                        <svg className="spr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></svg>
                        <input type="tel" placeholder="09XX XXX XXXX" maxLength="11"
                          value={guardian.contact_number}
                          onChange={e => setGuardian(g => ({ ...g, contact_number: e.target.value.replace(/[^0-9]/g, "") }))}
                          onKeyPress={blockNonNumeric}
                          className={errors["guardian.contact_number"] ? "spr-error-input" : ""} />
                      </div>
                      {errors["guardian.contact_number"] && <span className="spr-field-error-msg">{guardianContactError}</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Card */}
            <div className="spr-progress-card">
              <div className="spr-tab-header">
                <div className="spr-tab-icon spr-progress">
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                    <path d="M23 6l-9.5 9.5-5-5L1 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17 6h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="spr-tab-header-text">
                  <div className="spr-tab-header-title">Semester Progress</div>
                  <div className="spr-tab-header-subtitle">Academic Performance</div>
                </div>
              </div>
              <div className="spr-progress-body">
                {[
                  { label: "Units Completed", value: "36 / 120", pct: "30%", color: "orange" },
                  { label: "Subjects Passed", value: "12 / 15", pct: "80%", color: "purple" },
                ].map(item => (
                  <div className="spr-progress-item" key={item.label}>
                    <div className="spr-progress-labels">
                      <span className="spr-progress-label-text">
                        <span className={`spr-progress-dot ${item.color}`}></span>
                        {item.label}
                      </span>
                      <span className="spr-progress-value">{item.value}</span>
                    </div>
                    <div className="spr-progress-track">
                      <div className={`spr-progress-bar ${item.color}`} style={{ width: item.pct }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="spr-profile-side">
            {/* Academic Info */}
            <div className="spr-acad-card">
              <div className="spr-acad-header">
                <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5zM6 12v5c3 3 9 3 12 0v-5" stroke="#F5C4B3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="spr-acad-header-label">Academic Info</span>
              </div>
              <div className="spr-acad-rows">
                {[
                  { key: "Student ID", val: profile.student_number || "—" },
                  { key: "Program", val: profile.course_name || "—" },
                  { key: "Year Level & Section", val: profile.section_name || "Unassigned" },
                ].map(row => (
                  <div className="spr-acad-row" key={row.key}>
                    <span className="spr-acad-key">{row.key}</span>
                    <span className="spr-acad-val">{row.val}</span>
                  </div>
                ))}
                <div className="spr-gpa-row">
                  <span className="spr-gpa-label">Current GWA</span>
                  <div className="spr-gpa-display">
                    <span className="spr-gpa-num">{profile.gwa || "0.00"}</span>
                    <span className="spr-gpa-denom">/ 4.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Card */}
            <div className="spr-skills-card">
              <div className="spr-skills-header">
                <div className="spr-skills-header-left">
                  <div className="spr-skills-icon-wrap">
                    <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                      <path d="M6 5l-4 5 4 5M14 5l4 5-4 5M11.5 3l-3 14" stroke="#FF6B1A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="spr-skills-title">Technical Skills</div>
                    <div className="spr-skills-count">{skills.length} skill{skills.length !== 1 ? "s" : ""} added</div>
                  </div>
                </div>
              </div>
              <div className="spr-skills-input-section">
                <div className={`spr-skills-input-wrap${inputFocused ? " focused" : ""}`}>
                  <svg viewBox="0 0 20 20" fill="none" width="14" height="14" className="spr-skills-input-icon">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M10 6v8M6 10h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <input type="text" placeholder="e.g. React, Python, Figma…" className="spr-skills-input"
                    value={newSkill} onChange={e => setNewSkill(e.target.value)}
                    onKeyUp={e => e.key === "Enter" && addSkill()}
                    onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)} />
                  <button className="spr-skills-add-btn" onClick={addSkill} disabled={!newSkill.trim()}>Add</button>
                </div>
              </div>
              <div className="spr-skills-divider"></div>
              {skills.length === 0 ? (
                <div className="spr-skills-empty">
                  <div className="spr-skills-empty-icon">
                    <svg viewBox="0 0 40 40" fill="none" width="36" height="36">
                      <circle cx="20" cy="20" r="18" stroke="#f0e8e0" strokeWidth="2" />
                      <path d="M13 20h14M20 13v14" stroke="#e0cfc4" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="spr-skills-empty-text">No skills yet</p>
                  <p className="spr-skills-empty-sub">Add your first technical skill above</p>
                </div>
              ) : (
                <div className="spr-skills-list">
                  {skills.map((skill, index) => (
                    <div className="spr-skill-item" key={skill.id} style={{ animationDelay: index * 0.04 + "s" }}>
                      <div className="spr-skill-item-left">
                        <span className="spr-skill-dot"></span>
                        <span className="spr-skill-name">{skill.skillName}</span>
                      </div>
                      <button className="spr-skill-remove-btn" onClick={() => removeSkill(skill.id)} title="Remove skill">
                        <svg viewBox="0 0 16 16" fill="none" width="11" height="11">
                          <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;