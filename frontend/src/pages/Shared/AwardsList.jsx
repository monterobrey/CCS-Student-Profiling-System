import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth, ROLES } from "../../context/AuthContext";
import { awardService } from "../../services";
import styles from "../../styles/Shared/AwardsList.module.css";

const TABS = [
  { key: "all",      label: "All"      },
  { key: "pending",  label: "Pending"  },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const AVATAR_COLORS = [
  "#FF6B1A", "#e85500", "#c94000",
  "#3d1500", "#7c3d1a", "#b85c00",
];

function getAvatarColor(name = "") {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function getInitials(a) {
  const f = a.student?.first_name?.[0] ?? "";
  const l = a.student?.last_name?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

function getActionTaker(a) {
  if (!a) return "—";
  const actor = a.approver;
  return (
    actor?.name ||
    actor?.email ||
    (a.approved_by ? `User #${a.approved_by}` : "—")
  );
}

export default function AwardsList() {
  const cx = (...names) => names.filter(Boolean).map((name) => styles[name]).filter(Boolean).join(" ");

  const { role } = useAuth();
  const navigate  = useNavigate();
  const { id }    = useParams();
  const queryClient = useQueryClient();
  const canManageAwards = role === ROLES.DEAN || role === ROLES.CHAIR || role === ROLES.SECRETARY;

  const basePath = role === ROLES.DEAN ? "dean"
    : role === ROLES.CHAIR ? "department-chair"
    : "secretary";

  const [activeTab,    setActiveTab]    = useState("all");
  const [search,       setSearch]       = useState("");
  const [rejectId,     setRejectId]     = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast,        setToast]        = useState(null);

  const { data: awards = [], isLoading } = useQuery({
    queryKey: ["awards"],
    queryFn: async () => {
      const res = await awardService.getAll();
      return res.ok ? (res.data ?? []) : [];
    },
    // Make sure the list stays fresh when navigating back
    // or returning to the tab (no manual refresh needed).
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    }) : "—";

  // ── Detail view derived from URL param ──
  const viewingAward = id ? awards.find(a => String(a.id) === String(id)) : null;
  const openDetail   = (a) => navigate(`/${basePath}/awards/${a.id}`);
  const closeDetail  = ()  => navigate(`/${basePath}/awards`);

  const counts = useMemo(() => ({
    all:      awards.length,
    pending:  awards.filter(a => a.status === "pending").length,
    approved: awards.filter(a => a.status === "approved").length,
    rejected: awards.filter(a => a.status === "rejected").length,
  }), [awards]);

  const filteredAwards = useMemo(() => {
    let list = activeTab === "all"
      ? awards
      : awards.filter(a => a.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.awardName?.toLowerCase().includes(q) ||
        a.student?.first_name?.toLowerCase().includes(q) ||
        a.student?.last_name?.toLowerCase().includes(q) ||
        a.student?.program?.program_code?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [awards, activeTab, search]);

  const approveMutation = useMutation({
    mutationFn: async (id) => awardService.approve(id),
    onSuccess: async (res) => {
      if (!res?.ok) {
        showToast(
          "error",
          res?.status === 403
            ? "You do not have permission to approve this award."
            : (res?.message || "Failed to approve.")
        );
        return;
      }

      showToast("success", "Award approved successfully.");
      queryClient.setQueryData(["awards"], (old = []) =>
        old.map(a => a.id === res.data?.id ? res.data : a)
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["awards"] }),
        queryClient.invalidateQueries({ queryKey: ["dean-summary"] }),
      ]);
    },
    onError: () => showToast("error", "Failed to approve."),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }) => awardService.reject(id, reason),
    onSuccess: async (res) => {
      if (!res?.ok) {
        showToast(
          "error",
          res?.status === 403
            ? "You do not have permission to reject this award."
            : (res?.message || "Failed to reject.")
        );
        return;
      }

      showToast("success", "Award rejected.");
      setRejectId(null);
      setRejectReason("");
      queryClient.setQueryData(["awards"], (old = []) =>
        old.map(a => a.id === res.data?.id ? res.data : a)
      );
      await queryClient.invalidateQueries({ queryKey: ["awards"] });
    },
    onError: () => showToast("error", "Failed to reject."),
  });

  return (
    <div className={styles.page}>

      {/* TOAST */}
      {toast && (
        <div className={cx("toast", `toast-${toast.type}`)}>{toast.message}</div>
      )}

      {/* PAGE HEADER */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>Awards &amp; Recognition</h2>
          <p className={styles.pageSub}>
            {canManageAwards
              ? "Review and approve award nominations across all departments."
              : "View all student award records."}
          </p>
        </div>
        <div className={styles.headerBadge}>
          <span className={styles.headerDot}></span>
          {counts.pending} Pending
        </div>
      </div>

      {/* CONTROLS ROW */}
      <div className={styles.controlsRow}>
        <div className={styles.filterTabs}>
          {TABS.map(t => (
            <button
              key={t.key}
              className={cx("filterTab", activeTab === t.key && "active")}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
              {counts[t.key] > 0 && (
                <span className={styles.tabCount}>{counts[t.key]}</span>
              )}
            </button>
          ))}
        </div>

        <div className={styles.searchWrap}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="#b89f90" strokeWidth="1.3"/>
            <path d="M9.5 9.5l2.5 2.5" stroke="#b89f90" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search student or award..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch("")}>×</button>
          )}
        </div>
      </div>

      {/* TABLE */}
      {isLoading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading awards...</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <div className={styles.awardsList}>

            {/* Header */}
            <div className={cx("row", "headerRow", canManageAwards && "rowDean")}>
              <div className={styles.col}>Award</div>
              <div className={styles.col}>Student</div>
              <div className={styles.col}>Date</div>
              <div className={styles.col}>Status</div>
              {canManageAwards && <div className={cx("col", "actionCol")}>Action</div>}
            </div>

            {/* Empty state */}
            {filteredAwards.length === 0 ? (
              <div className={styles.emptyState}>
                No awards found.
                <span>
                  {search
                    ? "Try adjusting your search or filters."
                    : "No awards in this category yet."}
                </span>
              </div>
            ) : (
              filteredAwards.map(a => (
                <div
                  key={a.id}
                  className={cx("row", canManageAwards && "rowDean")}
                  onClick={() => openDetail(a)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Award */}
                  <div className={cx("col", "infoCol")}>
                    <div>
                      <p className={styles.awardTitle}>{a.awardName}</p>
                      <p className={styles.awardMeta}>
                        {a.applied_by
                          ? `Given by ${a.recommender?.name ?? "Admin"}`
                          : "Student application"}
                      </p>
                    </div>
                  </div>

                  {/* Student */}
                  <div className={styles.col}>
                    <div className={styles.studentCell}>
                      <div
                        className={styles.avatar}
                        style={{ background: getAvatarColor(a.student?.first_name ?? "") }}
                      >
                        {getInitials(a)}
                      </div>
                      <div>
                        <p className={styles.studentName}>
                          {a.student?.first_name} {a.student?.last_name}
                        </p>
                        <p className={styles.studentMeta}>
                          {a.student?.program?.program_code}
                          {a.student?.section?.section_name
                            ? ` · ${a.student.section.section_name}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className={styles.col}>
                    <p className={styles.date}>{formatDate(a.date_received)}</p>
                    {a.action_taken && (
                      <p className={styles.reason}>{a.action_taken}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className={styles.col}>
                    <span className={cx("status", `status-${a.status}`)}>
                      {a.status}
                    </span>
                  </div>

                  {/* Actions — Dean only */}
                  {canManageAwards && (
                    <div className={cx("col", "actionCol")} onClick={e => e.stopPropagation()}>
                      {a.status === "pending" ? (
                        <div className={styles.actions}>
                          <button
                            className={styles.btnApprove}
                            onClick={() => approveMutation.mutate(a.id)}
                            disabled={approveMutation.isPending}
                          >
                            Approve
                          </button>
                          <button
                            className={styles.btnReject}
                            onClick={() => { setRejectId(a.id); setRejectReason(""); }}
                            disabled={rejectMutation.isPending}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className={styles.resolvedBlock}>
                          <span className={styles.resolvedText}>
                            {a.status === "approved" ? "Approved" : "Rejected"}
                          </span>
                          <span className={styles.actionTakenBy}>
                            Action taken by {getActionTaker(a)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectId && (
        <div className={styles.modalOverlay} onClick={() => setRejectId(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Reject Award</h3>
              <button className={styles.modalClose} onClick={() => setRejectId(null)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Reason (optional)</label>
                <textarea
                  rows="3"
                  placeholder="Provide a reason for rejection..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setRejectId(null)}>Cancel</button>
              <button
                className={styles.btnReject}
                onClick={() => rejectMutation.mutate({ id: rejectId, reason: rejectReason })}
                disabled={rejectMutation.isPending}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {viewingAward && (() => {
        const a     = viewingAward;
        const COLOR = { approved: "#10b981", pending: "#f59e0b", rejected: "#ef4444" };
        const LABEL = { approved: "Approved", pending: "Pending Approval", rejected: "Rejected" };
        const color = COLOR[a.status] ?? "#9ca3af";
        const label = LABEL[a.status] ?? a.status;
        return (
          <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) closeDetail(); }}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

              {/* hero */}
              <div className={styles.detailHero} style={{ background: `linear-gradient(135deg,${color}20 0%,${color}08 100%)`, borderBottom: `3px solid ${color}28` }}>
                <div className={styles.detailHeroIcon} style={{ background: color + "22", border: `2px solid ${color}40` }}>
                  <svg viewBox="0 0 20 20" fill="none" width="22" height="22" style={{ color }}>
                    <path d="M10 2l2 6h6l-5 3.5 2 6L10 14.5l-5 3.5 2-6L2 8h6l2-6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className={styles.detailHeroText}>
                  <h3 className={styles.detailTitle}>{a.awardName}</h3>
                  <div className={styles.detailHeroMeta}>
                    <span className={cx("status", `status-${a.status}`)}>{label}</span>
                    {a.category      && <span className={styles.detailChip}>{a.category}</span>}
                    {a.academic_year && <span className={styles.detailChip}>{a.academic_year}</span>}
                  </div>
                </div>
                <button className={styles.modalClose} onClick={closeDetail}>×</button>
              </div>

              {/* student block */}
              <div className={styles.detailStudentBlock}>
                <div className={styles.avatar} style={{ background: getAvatarColor(a.student?.first_name ?? ""), width: 40, height: 40, fontSize: 14 }}>
                  {getInitials(a)}
                </div>
                <div>
                  <p className={styles.studentName}>{a.student?.first_name} {a.student?.last_name}</p>
                  <p className={styles.studentMeta}>
                    {a.student?.program?.program_code}
                    {a.student?.section?.section_name ? ` · ${a.student.section.section_name}` : ""}
                  </p>
                </div>
              </div>

              {/* info rows */}
              <div className={styles.detailBody}>
                <div className={styles.detailRow}>
                  <span className={styles.detailRowLabel}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    Date Received
                  </span>
                  <span className={styles.detailRowValue}>{formatDate(a.date_received)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailRowLabel}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    {a.applied_by ? "Given By" : "Submitted By"}
                  </span>
                  <span className={styles.detailRowValue}>{a.issued_by || "—"}</span>
                </div>
                {a.recommender?.name && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailRowLabel}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      Recommended By
                    </span>
                    <span className={styles.detailRowValue}>{a.recommender.name}</span>
                  </div>
                )}
                {a.status !== "pending" && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailRowLabel}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      Action Taken By
                    </span>
                    <span className={styles.detailRowValue}>{getActionTaker(a)}</span>
                  </div>
                )}
                {a.description && (
                  <div className={cx("detailRow", "detailRowBlock")}>
                    <span className={styles.detailRowLabel}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                      Description
                    </span>
                    <p className={styles.detailRowDesc}>{a.description}</p>
                  </div>
                )}
                {a.action_taken && a.status === "rejected" && (
                  <div className={cx("detailRow", "detailRowBlock", "detailRowDanger")}>
                    <span className={styles.detailRowLabel}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      Rejection Reason
                    </span>
                    <p className={styles.detailRowDesc}>{a.action_taken}</p>
                  </div>
                )}
              </div>

              {/* footer */}
              <div className={styles.modalFooter}>
                {canManageAwards && a.status === "pending" ? (
                  <>
                    <button
                      className={styles.btnReject}
                      onClick={() => { closeDetail(); setRejectId(a.id); setRejectReason(""); }}
                    >
                      Reject
                    </button>
                    <button
                      className={styles.btnApprove}
                      onClick={() => { approveMutation.mutate(a.id); closeDetail(); }}
                      disabled={approveMutation.isPending}
                    >
                      Approve
                    </button>
                  </>
                ) : (
                  <button className={styles.btnSecondary} onClick={closeDetail}>Close</button>
                )}
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}