import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "../../services/httpClient";
import { API_ENDPOINTS } from "../../services/apiEndpoints";
import "../../styles/Student/StudentAffiliations.css";

const ORG_TYPE_COLOR = {
  Academic:       { bg: "#eff6ff", text: "#1d4ed8" },
  "Non-Academic": { bg: "#f0fdf4", text: "#15803d" },
  Sports:         { bg: "#fff7ed", text: "#c2410c" },
  Cultural:       { bg: "#fdf4ff", text: "#7e22ce" },
  Religious:      { bg: "#fefce8", text: "#a16207" },
  Other:          { bg: "#f5f5f5", text: "#555"    },
};
const typeStyle = (t) => ORG_TYPE_COLOR[t] ?? ORG_TYPE_COLOR.Other;
const ORG_TYPES = ["Academic", "Non-Academic", "Sports", "Cultural", "Religious", "Other"];

const EMPTY_FORM = {
  organization_name: "",
  organization_type: "Academic",
  role:              "Member",
  dateJoined:        "",
  dateLeft:          "",
  isCustomOrg:       false, // Track if "Others" is selected
};

const PREDEFINED_ORGS = [
  "PnC Pag-Asa",
  "PnC-Student of Destiny",
  "PnC's The Herald",
  "PnC-ALIBATA",
  "PnC Indak (PnC Arts and Culture)",
  "PnC Coral (PnC Arts and Culture)",
  "PnC Sports and Development",
  "PnC-Red Cross Youth",
  "University Student Government",
];

export default function StudentAffiliations() {
  const queryClient = useQueryClient();

  // modal mode: null | "add" | "edit"
  const [modalMode, setModalMode]     = useState(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archivingAff, setArchivingAff]         = useState(null);
  const [editTarget, setEditTarget] = useState(null); // affiliation being edited
  const [form, setForm]             = useState(EMPTY_FORM);
  const [errors, setErrors]         = useState({});
  const [saving, setSaving]         = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [toast, setToast]           = useState(null);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: profile, isLoading } = useQuery({
    queryKey: ["student-profile"],
    queryFn: async () => {
      const res = await httpClient.get(API_ENDPOINTS.STUDENT.PROFILE);
      return res.ok ? res.data : null;
    },
  });

  // All university orgs — for autocomplete suggestions
  const { data: allOrgs = [] } = useQuery({
    queryKey: ["student-organizations"],
    queryFn: async () => {
      const res = await httpClient.get(API_ENDPOINTS.STUDENT.ORGANIZATIONS);
      return res.ok ? (res.data ?? []) : [];
    },
  });

  const affiliations = profile?.organizations ?? [];

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Field helper ──────────────────────────────────────────────────────────
  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const handleOrgDropdownChange = (value) => {
    if (value === "Others") {
      setForm((f) => ({ ...f, organization_name: "", isCustomOrg: true }));
    } else {
      setForm((f) => ({ ...f, organization_name: value, isCustomOrg: false }));
    }
    setErrors((e) => ({ ...e, organization_name: "" }));
  };

  // ── Open modals ───────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setModalMode("add");
  };

  const openEdit = (aff) => {
    setEditTarget(aff);
    setForm({
      organization_name: aff.organization?.organization_name ?? "",
      organization_type: aff.organization?.organization_type ?? "Academic",
      role:              aff.role ?? "",
      dateJoined:        aff.dateJoined ?? "",
      dateLeft:          aff.dateLeft ?? "",
      isCustomOrg:       false,
    });
    setErrors({});
    setModalMode("edit");
  };
  const closeModal = () => {
    if (saving) return;
    setModalMode(null);
    setEditTarget(null);
  };

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (modalMode === "add") {
      if (form.isCustomOrg && !form.organization_name.trim()) {
        errs.organization_name = "Required";
      } else if (!form.isCustomOrg && !form.organization_name) {
        errs.organization_name = "Please select an organization";
      }
      if (!form.dateJoined) errs.dateJoined = "Required";
    }
    if (!form.role.trim()) errs.role = "Required";
    return errs;
  };

  // ── Save (add or edit) ────────────────────────────────────────────────────
  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      let res;
      if (modalMode === "edit") {
        res = await httpClient.put(
          API_ENDPOINTS.STUDENT.UPDATE_AFFILIATION(editTarget.id),
          {
            role:     form.role.trim(),
            dateLeft: form.dateLeft || null,
          }
        );
      } else {
        res = await httpClient.post(API_ENDPOINTS.STUDENT.ADD_AFFILIATION, {
          organization_name: form.organization_name.trim(),
          organization_type: form.organization_type,
          role:              form.role.trim(),
          dateJoined:        form.dateJoined,
          ...(form.dateLeft ? { dateLeft: form.dateLeft } : {}),
        });
      }

      if (res.ok) {
        showToast("success", modalMode === "edit" ? "Affiliation updated." : "Affiliation added.");
        closeModal();

        // Refresh the org list cache so new orgs appear in future suggestions
        queryClient.invalidateQueries({ queryKey: ["student-organizations"] });

        // Update profile cache directly
        queryClient.setQueryData(["student-profile"], (old) => {
          if (!old) return old;
          if (modalMode === "edit") {
            return {
              ...old,
              organizations: old.organizations.map((o) =>
                o.id === editTarget.id ? res.data : o
              ),
            };
          }
          return { ...old, organizations: [...(old.organizations ?? []), res.data] };
        });
      } else {
        const firstErr = res.errors ? Object.values(res.errors)[0]?.[0] : null;
        showToast("error", firstErr || res.message || "Failed to save.");
      }
    } catch {
      showToast("error", "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // ── Archive (sets dateLeft to today, keeps in list) ──────────────────────
  const confirmArchive = (aff) => {
    setArchivingAff(aff);
    setShowArchiveModal(true);
  };

  const handleArchive = async () => {
    if (!archivingAff) return;
    setRemovingId(archivingAff.id);
    try {
      const res = await httpClient.patch(API_ENDPOINTS.STUDENT.ARCHIVE_AFFILIATION(archivingAff.id));
      if (res.ok) {
        showToast("success", "Affiliation archived.");
        setShowArchiveModal(false);
        setArchivingAff(null);
        queryClient.setQueryData(["student-profile"], (old) => {
          if (!old) return old;
          return {
            ...old,
            organizations: old.organizations.map((o) =>
              o.id === archivingAff.id ? res.data : o
            ),
          };
        });
      } else {
        showToast("error", res.message || "Failed to archive.");
      }
    } catch {
      showToast("error", "Something went wrong.");
    } finally {
      setRemovingId(null);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : null;

  const isOpen = modalMode !== null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="aff-page">

      {toast && (
        <div className={`aff-toast aff-toast-${toast.type}`}>{toast.message}</div>
      )}

      {/* HEADER */}
      <div className="aff-header">
        <div>
          <h2 className="aff-title">Organizations & Affiliations</h2>
          <p className="aff-sub">University organizations and clubs you are a member of.</p>
        </div>
        <button className="aff-primary-btn" onClick={openAdd}>
          <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Add Affiliation
        </button>
      </div>

      {/* CONTENT */}
      {isLoading ? (
        <div className="aff-loading">
          <span className="aff-spinner" />
          Loading affiliations...
        </div>
      ) : affiliations.length === 0 ? (
        <div className="aff-empty">
          <div className="aff-empty-icon">
            <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
              <circle cx="24" cy="24" r="22" stroke="#f0e8e0" strokeWidth="2"/>
              <path d="M16 24h16M24 16v16" stroke="#e0cfc4" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="aff-empty-title">No affiliations yet</p>
          <p className="aff-empty-sub">Add the organizations and clubs you belong to.</p>
          <button className="aff-primary-btn" onClick={openAdd}>Add Affiliation</button>
        </div>
      ) : (
        <div className="aff-grid">
          {affiliations.map((aff) => {
            const org   = aff.organization;
            const style = typeStyle(org?.organization_type);
            return (
              <div className={`aff-card${aff.is_default ? " aff-card-default" : ""}`} key={aff.id}>
                <div className="aff-card-top">
                  <div className="aff-org-badge" style={{ background: style.bg, color: style.text }}>
                    {org?.organization_type ?? "Organization"}
                  </div>
                  <div className="aff-card-actions">
                    {aff.is_default && (
                      <span className="aff-default-tag" title="Automatically assigned based on your program">
                        <svg viewBox="0 0 14 14" fill="none" width="10" height="10">
                          <path d="M7 1l1.5 3.1 3.4.5-2.5 2.4.6 3.4L7 8.8l-3 1.6.6-3.4L2.1 4.6l3.4-.5z"
                            stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                        </svg>
                        Default
                      </span>
                    )}
                    {/* Edit — available for all */}
                    <button
                      className="aff-icon-btn aff-edit-btn"
                      onClick={() => openEdit(aff)}
                      title="Edit affiliation"
                    >
                      <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                        <path d="M11.5 2.5l2 2M2 14l2-2 8.5-8.5-2-2-8.5 8.5z"
                          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {/* Archive — hidden if already has an end date; blocked for defaults */}
                    {!aff.is_default && !aff.dateLeft && (
                      <button
                        className="aff-icon-btn aff-remove-btn"
                        onClick={() => confirmArchive(aff)}
                        disabled={removingId === aff.id}
                        title="Archive affiliation"
                      >
                        {removingId === aff.id ? (
                          <span className="aff-spinner-sm" />
                        ) : (
                          <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                            <path d="M2 4h12v1.5H2zM3.5 5.5V13a1 1 0 001 1h7a1 1 0 001-1V5.5M6 5.5V3h4v2.5"
                              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M6.5 8v3M9.5 8v3"
                              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <p className="aff-org-name">{org?.organization_name ?? "—"}</p>
                <p className="aff-role">{aff.role}</p>

                {org?.description && (
                  <p className="aff-org-desc">{org.description}</p>
                )}

                <div className="aff-dates">
                  <span className="aff-date-item">
                    <svg viewBox="0 0 14 14" fill="none" width="11" height="11">
                      <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M4 1v2M10 1v2M1 5h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    Joined {formatDate(aff.dateJoined)}
                  </span>
                  {aff.dateLeft ? (
                    <span className="aff-date-item aff-date-left">Left {formatDate(aff.dateLeft)}</span>
                  ) : (
                    <span className="aff-active-dot">Active</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isOpen && (
        <div className="aff-overlay" onClick={closeModal}>
          <div className="aff-modal" onClick={(e) => e.stopPropagation()}>

            <div className="aff-modal-header">
              <div className="aff-modal-header-left">
                <div className="aff-modal-icon">
                  <svg viewBox="0 0 18 18" fill="none" width="18" height="18">
                    {modalMode === "edit" ? (
                      <path d="M13 2.5l2.5 2.5M3 15l2.5-2.5 8-8-2.5-2.5-8 8z"
                        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    ) : (
                      <>
                        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4"/>
                        <path d="M6 9h6M9 6v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      </>
                    )}
                  </svg>
                </div>
                <div>
                  <h3>{modalMode === "edit" ? "Edit Affiliation" : "Add Affiliation"}</h3>
                  <p className="aff-modal-sub">
                    {modalMode === "edit"
                      ? "Update your role, dates, or organization details."
                      : "Type an org name — existing ones will appear as suggestions."}
                  </p>
                </div>
              </div>
              <button className="aff-close-btn" onClick={closeModal} disabled={saving}>✕</button>
            </div>

            <div className="aff-modal-body">

              {modalMode === "edit" ? (
                /* ── EDIT: read-only org info + editable role & dateLeft ── */
                <>
                  {/* Read-only org summary */}
                  <div className="aff-readonly-block">
                    <div className="aff-readonly-row">
                      <span className="aff-readonly-label">Organization</span>
                      <span className="aff-readonly-val">{form.organization_name}</span>
                    </div>
                    <div className="aff-readonly-row">
                      <span className="aff-readonly-label">Type</span>
                      <span className="aff-readonly-val">{form.organization_type}</span>
                    </div>
                    <div className="aff-readonly-row">
                      <span className="aff-readonly-label">Date Joined</span>
                      <span className="aff-readonly-val">
                        {form.dateJoined
                          ? new Date(form.dateJoined).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Editable fields */}
                  <div className="aff-field">
                    <label>Role / Position <span className="aff-req">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Member, President, Secretary"
                      value={form.role}
                      onChange={(e) => setField("role", e.target.value)}
                      className={errors.role ? "aff-error" : ""}
                      disabled={saving}
                    />
                    {errors.role && <span className="aff-field-err">{errors.role}</span>}
                  </div>

                  <div className="aff-field">
                    <label>
                      Date Left
                      <span className="aff-optional"> (leave blank if still active)</span>
                    </label>
                    <input
                      type="date"
                      value={form.dateLeft}
                      onChange={(e) => setField("dateLeft", e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </>
              ) : (
                /* ── ADD: full form ── */
                <>
                  {/* Org name dropdown */}
                  <div className="aff-field">
                    <label>Organization <span className="aff-req">*</span></label>
                    <select
                      value={form.isCustomOrg ? "Others" : form.organization_name}
                      onChange={(e) => handleOrgDropdownChange(e.target.value)}
                      className={errors.organization_name ? "aff-error" : ""}
                      disabled={saving}
                    >
                      <option value="">Select organization</option>
                      {PREDEFINED_ORGS.map((org) => (
                        <option key={org} value={org}>{org}</option>
                      ))}
                      <option value="Others">Others</option>
                    </select>
                    {errors.organization_name && <span className="aff-field-err">{errors.organization_name}</span>}
                  </div>

                  {/* Custom org name field — shown only when "Others" is selected */}
                  {form.isCustomOrg && (
                    <div className="aff-field">
                      <label>Organization Name <span className="aff-req">*</span></label>
                      <input
                        type="text"
                        placeholder="Enter organization name"
                        value={form.organization_name}
                        onChange={(e) => setField("organization_name", e.target.value)}
                        className={errors.organization_name ? "aff-error" : ""}
                        disabled={saving}
                      />
                      {errors.organization_name && <span className="aff-field-err">{errors.organization_name}</span>}
                    </div>
                  )}

                  <div className="aff-field">
                    <label>Organization Type</label>
                    <select
                      value={form.organization_type}
                      onChange={(e) => setField("organization_type", e.target.value)}
                      disabled={saving}
                    >
                      {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="aff-field">
                    <label>Your Role / Position <span className="aff-req">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Member, President, Secretary"
                      value={form.role}
                      onChange={(e) => setField("role", e.target.value)}
                      className={errors.role ? "aff-error" : ""}
                      disabled={saving}
                    />
                    {errors.role && <span className="aff-field-err">{errors.role}</span>}
                  </div>

                  <div className="aff-field-row">
                    <div className="aff-field">
                      <label>Date Joined <span className="aff-req">*</span></label>
                      <input
                        type="date"
                        value={form.dateJoined}
                        onChange={(e) => setField("dateJoined", e.target.value)}
                        className={errors.dateJoined ? "aff-error" : ""}
                        disabled={saving}
                      />
                      {errors.dateJoined && <span className="aff-field-err">{errors.dateJoined}</span>}
                    </div>
                    <div className="aff-field">
                      <label>
                        Date Left
                        <span className="aff-optional"> (leave blank if still active)</span>
                      </label>
                      <input
                        type="date"
                        value={form.dateLeft}
                        onChange={(e) => setField("dateLeft", e.target.value)}
                        disabled={saving}
                      />
                    </div>
                  </div>
                </>
              )}

            </div>

            <div className="aff-modal-footer">
              <button className="aff-ghost-btn" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="aff-primary-btn" onClick={handleSave} disabled={saving}>
                {saving
                  ? <><span className="aff-spinner-sm" /> Saving…</>
                  : modalMode === "edit" ? "Save Changes" : "Add Affiliation"
                }
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ARCHIVE CONFIRMATION MODAL */}
      {showArchiveModal && archivingAff && (
        <div className="aff-overlay" onClick={() => { setShowArchiveModal(false); setArchivingAff(null); }}>
          <div className="aff-modal aff-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="aff-modal-header">
              <div className="aff-modal-header-left">
                <div className="aff-modal-icon aff-modal-icon-danger">
                  <svg viewBox="0 0 18 18" fill="none" width="18" height="18">
                    <path d="M3 5h12v1H3zM4.5 6v8a1 1 0 001 1h7a1 1 0 001-1V6M7 6V4h4v2"
                      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h3>Archive Affiliation</h3>
                  <p className="aff-modal-sub">This will set today as your end date.</p>
                </div>
              </div>
              <button className="aff-close-btn" onClick={() => { setShowArchiveModal(false); setArchivingAff(null); }}>✕</button>
            </div>
            <div className="aff-modal-body">
              <p className="aff-delete-msg">
                Are you sure you want to archive your membership in{" "}
                <strong>{archivingAff.organization?.organization_name}</strong>?
                Your end date will be set to today and the affiliation will remain in your record.
              </p>
            </div>
            <div className="aff-modal-footer">
              <button className="aff-ghost-btn" onClick={() => { setShowArchiveModal(false); setArchivingAff(null); }}>
                Cancel
              </button>
              <button className="aff-danger-btn" onClick={handleArchive} disabled={removingId === archivingAff.id}>
                {removingId === archivingAff.id
                  ? <><span className="aff-spinner-sm" /> Archiving…</>
                  : "Archive"
                }
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
