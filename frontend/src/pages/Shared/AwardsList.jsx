import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export default function AwardsList() {
  const cx = (...names) => names.filter(Boolean).map((name) => styles[name]).filter(Boolean).join(" ");

  const { role } = useAuth();
  const queryClient = useQueryClient();
  const canManageAwards = role === ROLES.DEAN || role === ROLES.CHAIR || role === ROLES.SECRETARY;

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
                    <div className={cx("col", "actionCol")}>
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
                        <span className={styles.resolvedText}>
                          {a.status === "approved" ? "Approved" : "Rejected"}
                        </span>
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
    </div>
  );
}