export const adminEn = {
  description:
    "This page is a customer operations workspace for expanding master data management, user operations, and default settings. In this phase, the second master data step extends the partner master with contact fields and multi-select outsourcing process capabilities.",
  sections: [
    {
      title: "Master Data",
      description:
        "Area to expand into factories, vendors, outsourcing partners, and process masters",
    },
    {
      title: "Users",
      description:
        "Area to expand into invitations, role updates, and active user management",
    },
    {
      title: "Operations Settings",
      description: "Area for notifications, defaults, and operations settings",
    },
  ],
  common: {
    loadingList: "Loading list.",
    summary: "Summary",
    move: "Go",
    preparing: "Preparing",
    adminMenu: "Admin menu",
    countUnit: "items",
  },
  permissions: {
    workorder: {
      read: {
        label: "Read",
        description: "View work order lists and details.",
      },
      create: { label: "Create", description: "Create new work orders." },
      update: {
        label: "Edit",
        description: "Edit work order information and contents.",
      },
      delete: {
        label: "Request deletion",
        description: "Move work orders to trash or request deletion.",
      },
      restore: {
        label: "Restore",
        description: "Restore deleted work orders.",
      },
      statusReview: {
        label: "Review status",
        description: "Move work orders into review steps.",
      },
      statusOrder: {
        label: "Order status",
        description: "Change order and production progress status.",
      },
      statusInspect: {
        label: "Inspection status",
        description: "Change inbound inspection and defect status.",
      },
      statusComplete: {
        label: "Complete",
        description: "Mark work orders as completed.",
      },
    },
    partner: {
      read: { label: "Read", description: "View partner lists and details." },
      create: { label: "Create", description: "Create new partners." },
      update: { label: "Edit", description: "Edit partner details and roles." },
      delete: {
        label: "Disable/delete",
        description: "Disable partners or request deletion.",
      },
      manage: {
        label: "Legacy manage",
        description:
          "Legacy aggregate partner management permission from earlier versions.",
      },
    },
    storage: {
      read: { label: "Read", description: "View storage files and usage." },
      deleteRequest: {
        label: "Request deletion",
        description: "Request deletion for files and trash items.",
      },
      restore: { label: "Restore", description: "Restore files from trash." },
    },
    stats: {
      read: {
        label: "Read",
        description: "View statistics and operation metrics.",
      },
    },
    settings: {
      read: {
        label: "Read",
        description: "View settings and company configuration.",
      },
      manage: {
        label: "Edit",
        description: "Edit settings and company policies.",
      },
    },
    standards: {
      read: {
        label: "Read",
        description: "View unit, process, and item standards.",
      },
      create: { label: "Create", description: "Create new standards." },
      update: {
        label: "Edit",
        description: "Edit standard labels, order, and active status.",
      },
      delete: {
        label: "Delete/disable",
        description: "Delete or disable standards.",
      },
      manage: {
        label: "Legacy manage",
        description:
          "Legacy aggregate standards management permission from earlier versions.",
      },
    },
    member: {
      read: { label: "Read", description: "View members and approval queues." },
      invite: {
        label: "Invite",
        description: "Create member invitation links.",
      },
      approve: { label: "Approve", description: "Approve join requests." },
      reject: { label: "Reject", description: "Reject join requests." },
      permissionUpdate: {
        label: "Edit permissions",
        description: "Edit member roles and detailed permissions.",
      },
      suspend: {
        label: "Change status",
        description: "Suspend or reactivate members.",
      },
    },
    audit: {
      readCompany: {
        label: "Read audit logs",
        description: "View company-level change history.",
      },
    },
    personalSettings: {
      manage: {
        label: "Personal settings",
        description:
          "Change the member's own language, theme, and personal settings.",
      },
    },
    system: {
      standardManage: {
        label: "System standards",
        description: "Manage system-only standards.",
      },
      companyInvite: {
        label: "Invite companies",
        description: "Create system-admin company invitations.",
      },
      companyApprove: {
        label: "Approve companies",
        description: "Approve system-admin company join requests.",
      },
    },
  },
  filesPage: {
    title: "Storage",
    tabGroupLabel: "Document/design status",
    tabs: {
      attachments: "Documents/designs",
      trash: "Recycle Bin",
      storage: "Storage policy",
    },
    snapshotLoadFailed: "Could not load file list from DB",
    snapshotLoadFailedWithMessage:
      "Could not load file list from DB: {message}",
  },
  auditSummary: {
    title: "Admin Audit",
    closedDescription:
      "The dashboard prioritizes operating metrics, while DB and structure checks stay collapsed until needed.",
    open: "Open audit",
    chips: {
      db: "Data",
      domain: "Structure",
      sample: "Samples",
      finalAudit: "Final check",
    },
    close: "Close audit",
  },
  completionAudit: {
    title: "Admin Completion Audit",
    description:
      "Checks whether the admin area can be closed before the WorkOrder refactor.",
    chips: {
      domain: "Structure",
      legacyRemoved: "Legacy removed",
      legacyKept: "Legacy kept",
      db: "Data",
      sample: "Samples",
      finalAudit: "Final check",
    },
    decision: "Completion decision",
  },
  dbConnectionAudit: {
    title: "Data connection audit",
    description:
      "Actual data read/write boundaries and safe display status by admin screen.",
    read: "Read",
    write: "Write",
    alternateDisplay: "Safe display",
    nextCheck: "Next check",
    repository: {
      workorder: "Work orders",
      partner: "Partners",
      attachmentMemo: "Memos/attachments",
    },
    repositoryModes: { db: "Live data", mock: "Sample data" },
    statuses: {
      "db-connected": "Live data",
      "db-prepared": "DB prepared",
      "fallback-guarded": "Safe display protected",
      "mock-only": "Sample data",
      "not-applicable": "N/A",
    },
    sourceTypes: {
      "actual-db": "Live DB read/write",
      "db-with-fallback": "Live DB + safe display",
      "db-prepared-fallback": "DB prepared + safe display",
      "mock-only": "Sample data",
      "not-applicable": "N/A",
    },
  },
  historyModal: {
    title: "Work Order History",
    description:
      "Review the full work order history in a modal without leaving the admin workspace.",
  },
  notificationModal: {
    title: "Notification Event Settings",
    description:
      "Manage notification event ON/OFF states in a modal without leaving the admin workspace.",
  },
  historySection: {
    title: "History",
    summary: "Shows only admin-relevant operational history.",
    countSuffix: "items",
  },
  navigation: {
    dashboard: "Dashboard",
    workorder: "Work Orders",
    partners: "Partners",
    storage: "Storage",
    statistics: "Statistics",
    history: "History",
    settings: "Settings",
    dbConnected: "DB status audit",
  },
  operationsDashboard: {
    title: "Operations Dashboard",
    eyebrow: "Work order flow",
    description:
      "Review review, ordering, inspection, and delayed inbound queues in one place.",
    visualTitle: "Check the flow that needs attention today.",
    visualDescription:
      "Review, order, inspection, and inbound delay queues are grouped so you can move directly into work-order handling.",
    visualHelper: "Select a queue to update the list.",
    selectedQueueEyebrow: "Selected queue",
    priorityEyebrow: "Queue",
    workorderStatusTitle: "Work order status",
    sourceDb: "Shows work queue items from DB.",
    sourceNotConfigured:
      "No database connection is configured, so values are shown as zero.",
    sourceError: "Database lookup failed, so values are shown as zero.",
    periodAria: "Dashboard period selector",
    periods: { today: "Today", week: "This week", month: "This month" },
    todayWorkTitle: "Review and order queue",
    todayWorkDescription:
      "Shows work orders that need admin review or order handling.",
    priorityTitle: "Current waiting status",
    dueLabel: "Due",
    statusFlowTitle: "Status flow",
    statusDistributionTitle: "Status distribution",
    todayCheckTitle: "Today check",
    previewEmpty: "Preview",
    attachmentLabel: "Files",
    factoryLabel: "Factory",
    quantityLabel: "Qty",
    updatedLabel: "Updated",
    openWorkorder: "Open",
    actions: {
      openWorkorderShort: "Workspace",
      openWorkorderWorkspace: "Open work order workspace",
    },
    todayTasksEmpty: "No review or order waiting work orders to check today.",
    countSuffix: "items",
    statusDistribution: {
      working: "Working",
      reviewWaiting: "Review waiting",
      inboundWaiting: "Inspection waiting",
      completed: "Completed",
    },
    insights: {
      reviewWaiting: "Review waiting",
      reviewWaitingDescription: "Work orders that require admin review",
      orderWaiting: "Order waiting",
      orderWaitingDescription:
        "Work orders that need order handling after review completion",
      inspectionWaiting: "Inspection waiting",
      inspectionWaitingDescription:
        "Work orders requiring inspection or inbound confirmation",
      inboundDelayed: "Inbound delayed",
      inboundDelayedDescription:
        "Inspection-waiting work orders more than 24 hours after the due date starts",
    },
    queues: {
      reviewWaiting: {
        title: "Review waiting list",
        empty: "No work orders are waiting for review.",
      },
      orderWaiting: {
        title: "Order waiting list",
        empty: "No work orders are waiting for order handling.",
      },
      inspectionWaiting: {
        title: "Inspection waiting list",
        empty: "No work orders are waiting for inspection.",
      },
      inboundDelayed: {
        title: "Inbound delayed list",
        empty: "No delayed inbound work orders.",
      },
    },
    todayTasks: {
      duePending: "Due pending",
      overdue: "Overdue",
      dueToday: "Today",
      dueTomorrow: "Tomorrow",
      dueAfter: "D-{days}",
      status: {
        reviewRequested: "Review waiting",
        inspection: "Inspection waiting",
        reviewCompleted: "Order waiting",
        rejected: "Rejected",
        draft: "Draft",
      },
      priority: {
        review: "Review needed",
        inspection: "Inspection needed",
        order: "Order check",
      },
      factoryPending: "Factory pending",
      quantityPending: "Quantity pending",
      quantityValue: "{count} pcs",
      updatedPending: "No record",
      updatedMinutes: "{minutes}m ago",
      updatedHours: "{hours}h ago",
      updatedDays: "{days}d ago",
    },
  },
  adminConsole: {
    actions: { open: "Open" },
    statuses: {
      available: "Available",
      planned: "Preparing",
      linked: "Connected",
      api: "API ready",
      legacy: "Existing",
    },
    permissionLabel: "Permission",
    managementCards: {
      eyebrow: "Workspace",
      title: "Workspace shortcuts",
      description:
        "Frequently used customer-admin screens are arranged as screen-level action cards.",
      cardCount: "{count} screens",
    },
    memberCards: {
      title: "Member management",
      description:
        "Handle member invitations, join approvals, roles, and permissions in a separate card.",
    },
    futurePermissions: {
      title: "Master data",
      description: "",
    },
    links: {
      "workorder-entry": {
        label: "Work order workspace",
        description: "Open the work order list and detail workspace.",
      },
      partners: {
        label: "Partner management",
        description:
          "Manage factory, fabric, subsidiary, and outsourcing master data.",
      },
      files: {
        label: "Storage management",
        description: "Manage documents/designs, trash, and storage usage.",
      },
      stats: {
        label: "Statistics",
        description: "Review work order, partner, and file usage metrics.",
      },
      settings: {
        label: "Settings",
        description: "Use the top-right settings button.",
      },
      "member-management": {
        label: "Member management",
        description:
          "Manage member invitations, join approvals, roles, and permissions.",
      },
      "material-orders": {
        label: "Fabric and subsidiary orders",
        description:
          "Reserved for the material ordering workspace connected to work orders.",
      },
      billing: {
        label: "Billing and payments",
        description:
          "Reserved for plan, card, payment history, receipt, and evidence screens.",
      },
      legal: {
        label: "Terms and policies",
        description:
          "Reserved for terms, privacy, refund, and data retention policy screens.",
      },
      "standard-units": {
        label: "Standard units",
        description:
          "Manage units used for fabric, subsidiary materials, and production quantities.",
      },
      "outsourcing-processes": {
        label: "Outsourcing processes",
        description:
          "Manage printing, embroidery, washing, and other outsourcing process standards.",
      },
      "product-types": {
        label: "Product types",
        description:
          "Manage work order item and product classification standards.",
      },
    },
  },
  memberManagement: {
    visualHero: {
      eyebrow: "Team operation",
      title: "Manage members and permission flow in one place",
      description: "Review invitation links, join approvals, employment status, and screen permissions under one shared standard.",
      badge: {
        role: "Role based",
        permission: "Permission control",
      },
    },
    title: "Member management",
    description:
      "Manage company member invitations, join approvals, and direct permission assignment.",
    eyebrow: "Member permissions",
    permissionCount: "{count} permissions",
    systemOnlyCount: "{count} system-only",
    matrixEnabledCount: "{count} default checks",
    actions: {
      openOrganizationSettings: "Open organization settings",
      createInvite: "Create invitation link",
    },
    detailModal: {
      title: "Member details",
      description:
        "Click a member row to manage work order, partner, standards, and order authority.",
      permissionGroupCount: "{count} permissions",
      permissionGroupSelectedCount: "{selected}/{total} selected",
      selectedPermissionCount: "{count} selected",
      roleTemplateHelper:
        "A role is only the starting value. Adjust the actual work permissions with the four options below.",
      policyNotice:
        "Removing your own permission-management access or the last administrator access is blocked when saving.",
      summary: {
        title: "Selected member",
        role: "Role",
        permissions: "Selected items",
      },
      sections: {
        profile: "Profile",
        profileDescription:
          "Name and contact are saved against the same-company member record.",
        permissions: "Workspace permissions",
        permissionsDescription:
          "Unchecked items remain read-only. Checked items allow writing and management. Stats are always readable by default.",
      },
      fields: {
        name: "Name",
        phone: "Contact",
        status: "Status",
        role: "Role",
      },
      simplePermissions: {
        workorderManage: {
          label: "Work order management",
          description:
            "When off, the member can only view assigned work orders. When on, the member can create, edit, delete, and request review.",
        },
        partnerManage: {
          label: "Partner management",
          description:
            "When off, the member can only view partners. When on, the member can create, edit, deactivate, and request deletion.",
        },
        standardsManage: {
          label: "Standards management",
          description:
            "When off, the member can only view standards. When on, the member can create, edit, deactivate, and request deletion.",
        },
        workorderOrderDirect: {
          label: "Order authority",
          description:
            "Allows admin-level direct order requests without the review step.",
        },
      },
      actions: {
        save: "Save",
        saving: "Saving",
        resetRoleTemplate: "Apply role defaults",
        selectGroup: "Select group",
        clearGroup: "Clear",
      },
      errors: {
        permissionRequired: "Select at least one permission.",
        selfPermissionBlocked:
          "You cannot remove your own permission-editing permission.",
        selfStatusBlocked: "You cannot change your own active status.",
        lastAdminBlocked: "The last admin permission cannot be removed.",
        updateFailed: "Could not save member information.",
      },
      feedback: { saved: "Member information saved." },
    },
    tabs: {
      invite: {
        label: "Invite members",
        description: "Create and copy invitation links.",
        count: "{count} invites",
      },
      members: {
        label: "Members",
        description: "Manage pending approvals and members in one list.",
        count: "{count} people",
      },
      permissions: {
        label: "Permissions",
        description: "Manage permission codes and home card visibility.",
        count: "{count} permissions",
      },
    },
    inviteBuilder: {
      eyebrow: "Member invitation",
      title: "Create employee invitation",
      description:
        "Invitation links are created independently. Email and SMS are only future delivery channels.",
      fields: {
        method: "Invitation method",
        email: "Email address",
        phone: "Mobile phone",
        roleTemplate: "Default permission bundle",
        expires: "Invitation expiry",
      },
      placeholders: { email: "member@example.com", phone: "010-1234-5678" },
      validation: {
        required: "Enter an invitation target.",
        email: "Enter a valid email address.",
        phone: "Enter a valid mobile phone number.",
      },
      expires: { "3d": "3 days", "7d": "7 days", "14d": "14 days" },
      sendPolicyTitle: "Link creation rule",
      sendPolicy: {
        email: "Send the invitation link by email.",
        phone: "Send the invitation link by SMS.",
        linkOnly:
          "Create an invitation link for copying. Actual email/SMS delivery will be connected later.",
      },
      actions: {
        copy: "Copy link",
        create: "Create invitation",
        creating: "Creating",
        cancel: "Cancel invitation",
      },
      feedback: {
        created: "Invitation link created.",
        copied: "Invitation link copied.",
        cancelled: "Invitation cancelled.",
      },
      errors: {
        load: "Could not load invitation links.",
        create: "Could not create the invitation link.",
        revoke: "Could not cancel the invitation link.",
        route:
          "Could not create the member invitation link. Try again shortly.",
        policy:
          "Could not verify the member invitation conditions. Try again with a company administrator account.",
        notFound: "The invitation link could not be found.",
      },
    },

    memberDirectory: {
      eyebrow: "Member management",
      title: "Member management",
      description:
        "Review and process pending approvals and all members in one list.",
      none: "None",
      filters: {
        search: "Search",
        searchPlaceholder: "Search name, email, or contact",
        status: "Status",
        role: "Permission",
      },
      statusFilters: {
        all: "All",
        pending: "Pending approval",
        approved: "Active",
        suspended: "Left/inactive",
        withdrawalRequested: "Withdrawal requested",
      },
      roleFilters: { all: "All" },
      statuses: {
        pending: "Pending approval",
        approved: "Active",
        suspended: "Left/inactive",
        withdrawalRequested: "Withdrawal requested",
        withdrawn: "Left",
        rejected: "Rejected",
      },
    },
    approvalWorkbench: {
      eyebrow: "Join request approval",
      title: "Member approval and permission assignment",
      description:
        "A first-pass screen for reviewing a join request and adjusting role-template permissions before approval or rejection.",
      previewApplicant: {
        name: "Designer Kim",
        email: "designer@example.com",
        description:
          "A preview state for a member who applied through an invitation link.",
      },
      steps: {
        review: {
          label: "Review request",
          description: "Check the invitation token and applicant profile.",
        },
        permission: {
          label: "Choose permissions",
          description:
            "Adjust only the permissions needed from the default role bundle.",
        },
        approve: {
          label: "Approve/reject",
          description: "Save the member and permissions when approved.",
        },
        audit: {
          label: "Audit log",
          description: "Record member approval and permission change events.",
        },
      },
      permissionChecklistTitle: "Permission checklist",
      permissionChecklistDescription:
        "Role templates are only starting values; approval stores the direct permission_code list.",
      actionsTitle: "Approval actions",
      actionsDescription:
        "Join-request approval/rejection and approved-member permission writes are connected to the live DB.",
      actions: {
        approve: { label: "Approve" },
        reject: { label: "Reject" },
        permissionUpdate: { label: "Edit permissions" },
      },
      guardTitle: "Write contract",
      guardDescription:
        "Approval marks company_members as approved and stores selected permissions in member_permissions. Approved-member permission edits are saved as a full replacement.",
    },
    joinRequestStatuses: { pending: "Pending approval" },
    invitationMethods: { email: "Email", phone: "SMS" },
    memberStatuses: {
      approved: "Approved",
      pending: "Pending",
      suspended: "Suspended",
    },
    invitationStatuses: {
      draft: "Draft",
      active: "Active",
      pending: "Waiting",
      sent: "Sent",
      expired: "Expired",
      accepted: "Accepted",
      revoked: "Revoked",
      cancelled: "Cancelled",
    },
    statuses: { ready: "Connected", planned: "Planned", pending: "Pending" },
    sourceState: {
      dbPending: "DB connection planned",
      dbLoading: "Loading DB",
      dbConnected: "DB connected",
      dbFailed: "DB load failed",
    },
    permissionGuards: {
      visible: "Visible",
      hidden: "Hidden",
      blocked: "Permission missing",
      allowedButDbPending: "Allowed · DB connection planned",
      requiredPermissions: "Required permissions: {permissions}",
    },
    summary: {
      activeMembers: {
        label: "Active",
        description:
          "Approved members currently working in the company workspace.",
      },
      pendingApprovals: {
        label: "Pending approval",
        description: "Users waiting for join-request or member approval.",
      },
      inactiveMembers: {
        label: "Left/inactive",
        description: "Members managed as resigned or inactive.",
      },
      permissionTemplates: {
        label: "Permission templates",
        description: "Permission presets used as default role bundles.",
      },
    },
    sections: {
      members: "Member management",
      membersDescription:
        "Manage pending approvals and all members in one list.",
      invitations: "Invitation links",
      invitationsDescription:
        "Review usable, accepted, expired, and cancelled links, then copy or cancel them.",
      joinRequests: "Join requests / approval queue",
      joinRequestsDescription:
        "Approve or reject users who applied through an invitation link.",
      roles: "Role defaults",
      rolesDescription:
        "Roles are used as default permission bundles, while screen exposure will expand by permission code.",
      nextSteps: "Next implementation scope",
      workspaceCards: "Home card permissions",
      workspaceCardsDescription:
        "Cards that can appear on a member home screen when an admin grants the corresponding permissions.",
      permissionGroups: "Permission groups",
      permissionGroupsDescription:
        "Permission group standards for a future DB-backed permission table.",
      permissionCatalog: "Permission catalog",
      permissionCatalogDescription:
        "permission_code standards for DB permission_catalog and role templates.",
      permissionMatrix: "Permission matrix",
      permissionMatrixDescription:
        "Roles are default check presets; actual storage and access control use directly granted permission_code values.",
    },
    tables: {
      members: {
        columns: {
          name: "Name",
          email: "Email",
          phone: "Contact",
          role: "Permission",
          status: "Status",
          requestedAt: "Requested",
          approvedAt: "Approved",
          lastActive: "Last login",
          actions: "Action",
        },
      },
      memberDirectory: {
        columns: {
          name: "Name",
          email: "Email",
          phone: "Contact",
          role: "Permission",
          status: "Status",
          requestedAt: "Requested",
          approvedAt: "Approved",
          lastActiveAt: "Last login",
          actions: "Action",
        },
      },
      invitations: {
        columns: {
          target: "Target",
          type: "Type",
          link: "Invitation link",
          expires: "Expires",
          createdAt: "Created",
          status: "Status",
          actions: "Actions",
        },
      },
      joinRequests: {
        columns: {
          applicant: "Applicant",
          contact: "Contact",
          inviteEmail: "Invite email",
          emailMatch: "Match",
          memo: "Memo",
          requestedRole: "Requested role",
          status: "Status",
          requestedAt: "Requested",
          actions: "Actions",
        },
      },
    },
    empty: {
      members: {
        title: "No members to show",
        description:
          "Pending approvals or registered members will appear in this list.",
      },
      memberDirectory: {
        title: "No members to show",
        description:
          "Pending approvals or registered members will appear in this list.",
      },
      invitations: {
        title: "No invitations created",
        description:
          "Active, expired, and cancelled invitations will appear after invitation-link generation is connected.",
      },
      joinRequests: {
        title: "No join requests waiting",
        description:
          "Invitation-link join requests will appear here as approval, rejection, and permission-assignment targets.",
      },
    },
    loading: {
      members: {
        title: "Loading members",
        description:
          "Loading company_members and pending join requests from the DB.",
      },
      memberDirectory: {
        title: "Loading members",
        description:
          "Loading company_members and pending join requests from the DB.",
      },
      joinRequests: {
        title: "Loading join requests",
        description: "Loading the join_requests.pending list from the DB.",
      },
    },
    loadErrors: {
      members: "Could not load members.",
      joinRequests: "Could not load the approval queue.",
    },
    reviewActions: {
      approve: "Approve",
      reject: "Reject",
      processing: "Processing",
      approveSuccess: "The join request has been approved.",
      rejectSuccess: "The join request has been rejected.",
      approveError: "Could not approve the request.",
      rejectError: "Could not reject the request.",
      error: "Failed to process the join request.",
    },
    memberActions: {
      managePermissions: "Manage permissions",
      savePermissions: "Save permissions",
      saving: "Saving",
      permissionUpdateSuccess: "Member permissions have been saved.",
      permissionUpdateError: "Failed to save member permissions.",
    },
    emailMatchStatuses: {
      matched: "Matched",
      mismatched: "Mismatch",
      unknown: "Unknown",
    },
    roles: {
      admin: {
        label: "Admin",
        description:
          "Default role for organization operations, settings, storage, statistics, and member permissions.",
      },
      company_admin: {
        label: "Company admin",
        description:
          "Default permission bundle for operations, settings, storage, statistics, and member permissions.",
      },
      designer: {
        label: "Designer",
        description:
          "Role focused on design files, revision requests, and work order review.",
      },
      inspector: {
        label: "Inspector",
        description:
          "Role focused on inbound inspection, defect checks, and completion handling.",
      },
      inventory: {
        label: "Order/inventory",
        description:
          "Role focused on ordering, inbound status, outsourcing processes, and master data.",
      },
      inventory_manager: {
        label: "Inventory/materials",
        description:
          "Default permission bundle for ordering, inbound status, outsourcing processes, and materials checks.",
      },
      viewer: {
        label: "Read-only",
        description:
          "Candidate role for internal or external collaborators who only need to read work flow status.",
      },
    },
    nextSteps: {
      invite: {
        title: "Invitation flow",
        description:
          "Connect invitation links, QR generation, and link copy before automated email sending.",
      },
      role: {
        title: "Role assignment",
        description:
          "Assign a default role to each member and connect it to a default permission bundle.",
      },
      permission: {
        title: "Permission adjustment",
        description:
          "Adjust feature permissions such as partners, storage, and master data per member.",
      },
      workspace: {
        title: "Home card reflection",
        description:
          "Automatically compose member home cards based on granted permissions.",
      },
    },
    permissionCards: {
      workorder: {
        label: "Work orders",
        description: "Permission to access the work order workspace.",
      },
      partners: {
        label: "Partners",
        description:
          "Home-card visibility and read/create/edit/disable permissions for partners.",
      },
      workflow: {
        label: "Workflow",
        description:
          "Work-order status transition permissions such as review, order, inspection, and completion.",
      },
      standards: {
        label: "Standards",
        description:
          "Home-card visibility and read/create/edit/disable permissions for standards.",
      },
      storage: {
        label: "Storage management",
        description:
          "Permission to manage documents/designs, trash, and storage usage.",
      },
      stats: {
        label: "Statistics",
        description:
          "Permission to view operational metrics and file usage indicators.",
      },
      members: {
        label: "Member management",
        description:
          "Permission to access member invitation, approval, and permission assignment screens.",
      },
      "organization-settings": {
        label: "Settings",
        description:
          "Permission to manage organization-level policies and standards.",
      },
      "standard-units": {
        label: "Standard units",
        description:
          "Permission to manage units for fabric, subsidiary materials, and quantities.",
      },
      "outsourcing-processes": {
        label: "Outsourcing processes",
        description:
          "Permission to manage printing, embroidery, washing, and other process standards.",
      },
      "product-types": {
        label: "Product types",
        description:
          "Permission to manage work order item and product classification standards.",
      },
    },
    permissionGroups: {
      workorder: { label: "Work orders" },
      workflow: { label: "Workflow" },
      memo: { label: "Memos" },
      attachment: { label: "Files/designs" },
      "master-data": { label: "Master data" },
      partner: { label: "Partners" },
      standards: { label: "Standards" },
      storage: { label: "Storage" },
      stats: { label: "Statistics" },
      settings: { label: "Settings" },
      member: { label: "Members" },
      audit: { label: "Audit logs" },
      personal: { label: "Personal settings" },
      system: { label: "System" },
      operation: { label: "Operations" },
      "workspace-card": { label: "Home cards" },
    },
    permissionCatalogColumns: {
      code: "Permission code",
      group: "Group",
      scope: "Scope",
    },
    scope: { company: "Company", system: "System" },
  },
  filesSummary: {
    title: "Storage usage",
    description:
      "Review plan capacity, file status, and file types based on current data.",
    visualEyebrow: "Storage control",
    visualTitle: "Manage storage and trash in one view.",
    visualDescription:
      "Review usage, file types, and trash status before handling restore or delete actions.",
    periods: { 7: "7 days", 15: "15 days", 30: "30 days" },
    uploadAmount: "Upload amount",
    count: "Count",
    fileType: "File type",
    fileTypeLabel: "File type",
    countSuffix: "items",
    totalUsage: "Total usage",
    attachments: "Documents/designs",
    trash: "Trash",
    retentionPeriod: "Retention period",
    usage: "Usage",
    refreshLabel: "Refresh storage data",
    documents: "Documents",
    designs: "Designs",
    memos: "Memos",
    others: "Other",
    storagePlanLabel: "Storage plan",
    currentPlan: "Current plan",
    pendingPlan: "Checking",
    upgrade: "Upgrade",
    upgradeTitle: "Plan upgrade screen will be connected in a later version.",
    planCapacityPending: "Checking plan",
    planCapacityLoading: "Checking plan capacity",
    planCapacityLoadingDescription:
      "Loading the plan capacity from customer information",
    usedSuffix: "used",
    remainingSuffix: "remaining",
    fileOperationsLabel: "File operations",
    fileOperationsTitle: "File operations summary",
    totalLabel: "Total",
    activeFiles: "Active files",
    trashFiles: "Trash files",
    purgeRequestedFiles: "Deletion requests",
    zeroTrashSize: "0MB stored",
    zeroActiveSize: "0MB used",
    zeroPurgeRequestSize: "0MB waiting",
    storedSuffix: "stored",
    waitingSuffix: "waiting",
    statuses: { normal: "Normal", caution: "Caution", danger: "Risk" },
    units: { count: "items", day: "days" },
  },
  filesWorkOrders: {
    description:
      "Review work orders you deleted and the documents, designs, and memos moved to trash with them.",
    summary: { deletedWorkOrders: "Deleted work orders" },
  },
  filesList: {
    title: "Document/design list",
    sort: { latest: "Latest", size: "By size", workorder: "By work order" },
    selectAll: "Select all",
    clearAll: "Clear all",
    emptyTrash: "Empty trash",
    delete: "Delete",
    restore: "Restore",
    purge: "Delete",
    refresh: "Refresh",
    refreshing: "Refreshing",
    processing: "Processing",
    close: "Close",
    yes: "Yes",
    no: "No",
    empty: "No documents or designs to display.",
    trashEmpty: "No items are stored in trash.",
    restoreSkipsBlockedItems: "Items that cannot be restored will be skipped.",
    purgeSkipsBlockedItems:
      "Items that cannot be requested for deletion will be skipped.",
    selectWorkOrder: "Select work order",
    deselectWorkOrder: "Deselect work order",
    selectItem: "Select",
    deselectItem: "Deselect",
    countSuffix: "items",
    selectionConfirm: {
      restoreTitle: "Confirm restore",
      purgeTitle: "Confirm deletion",
      description: "Review the selected processing scope before continuing.",
      restoreQuestion: "Restore the items above?",
      purgeQuestion: "Request deletion for the items above?",
      skippedNotice:
        "{count} selected items that cannot be processed will be skipped.",
      purgePolicyNotice:
        "Deletion is handled as a customer-admin deletion request. Actual file deletion is handled in the system-admin step.",
      emptyScope: "There are no items to process.",
      counts: {
        workorders: "{count} work orders",
        documents: "{count} documents",
        designs: "{count} designs",
        memos: "{count} memos",
      },
    },
    columns: {
      select: "Select",
      target: "Deleted target",
      workorder: "Spec Sheet",
      createdAt: "Created",
      deletedAt: "Deleted Time",
      fileName: "File name",
      type: "Type",
      size: "Size",
    },
    selectedScope: {
      workorder: "Work order",
      workorderValue: "1 representative row",
      bundleAttachments: "Documents/designs/memos",
      restoreBlocked: "Restore excluded items",
      totalSize: "File size",
    },
    emptyTrashConfirmTitle: "Empty trash",
    emptyTrashConfirmDescription: "Request deletion for all items in trash?",
    workorderPurgePreview: "Review deletion scope",
    workorderRestorePreview: "Review restore scope",
    workorderActionGuardTitle: "Review the processing scope by work order.",
    workorderRestoreConnectedNotice:
      "Restoring the work order also restores the deleted documents, designs, and memos.",
    workorderActionSkeletonNotice:
      "Request deletion is handled as a customer-admin deletion request and hidden from the default trash list. R2 file deletion is handled only in the system-admin Worker purge flow.",
    workorderRestoreGuardDescription:
      "Restoring the work order also restores the deleted documents, designs, and memos.",
    workorderPurgeGuardDescription:
      "Request deletion switches the selected scope to customer-admin deletion request status. Actual file deletion is handled in the system-admin step.",
    fileTypes: { document: "Document", design: "Design", other: "Other" },
    attachmentCount: "Documents/designs",
    detailTitles: {
      workorder: "Work order trash details",
      file: "File trash details",
    },
    detail: {
      openPreview: "Open file preview",
      previewFailed: "Preview failed",
      workorderActionHint:
        "Restoring the work order also restores the deleted documents, designs, and memos.",
      fileActionHint: "Restore or request deletion for this file only.",
      documentsDesigns: "Documents/designs",
      memos: "Memos",
      documentDesignCount: "{count} documents/designs",
      memoCount: "{count} memos",
    },
    disabledReasons: {
      workorderRestorePreparing:
        "Restoring the work order also restores the deleted documents, designs, and memos.",
      workorderPurgePreparing:
        "The work order will be moved to deletion-request status and hidden from the customer-admin trash list.",
      bundleRestoreRequired:
        "Restoring the work order also restores the deleted documents, designs, and memos.",
      bundlePurgeRequired:
        "Request deletion for the work order together with its documents/designs/memos.",
      parentWorkOrderMissing: "The related work order could not be found.",
      purgeFailedNeedsSystemReview:
        "Deletion failed and needs system-admin review.",
      restoreUnavailable: "This item is not available for restore.",
      purgeUnavailable: "This item is not available for deletion request.",
    },
    workorderStage: {
      currentStage: "Current stage",
      deletedAtStage: "At deletion",
      steps: {
        draft: "Draft",
        review: "Review",
        order: "Order",
        inspection: "Inspection",
        completed: "Completed",
      },
    },
    visual: { workorder: "Work" },
    types: { workorder: "Spec Sheet", specSheet: "Spec Sheet" },
    restorePolicies: { workorderBundle: "Work order scope" },
    sizeUnit: { byte: "B", kb: "KB", mb: "MB", gb: "GB" },
  },
  trashPage: { title: "Recycle Bin" },

  historyPage: {
    title: "Work Order History",
    description:
      "Use a dedicated admin page to search, filter, and inspect detailed work order history without modal constraints.",
    moveToAdminMain: "Admin Home",
    moveToWorkspace: "Open Workspace",
    searchLabel: "Search logs",
    searchPlaceholder: "Search by action, user, time, or detail text",
    filterDescription:
      "Use filters and search together to trace the full work order history quickly.",
    emptySearch: "No history matches the current search.",
    guideTitle: "Screen Guide",
    guideDescription:
      "Open details to review transitions and additional detail lines in one place.",
    searchGuide: "Search scans action, user, time, and detail text together.",
    searchBoxTitle: "History Search",
    searchBoxDescription: "Check work logs by date, event type, and user.",
    dateLabel: "Date",
    userLabel: "User",
    refreshLabel: "Refresh history",
    dateFilters: {
      all: "All dates",
      today: "Today",
      week: "Last 7 days",
      month: "Last 30 days",
    },
    filters: {
      all: "All",
      work: "Work",
      inventory: "Inventory",
      attachment: "Files",
    },
    allUsers: "All users",
    actions: {
      WORKORDER_CREATED: "Work Order Created",
      STATUS_CHANGED: "Status Changed",
      FILE_UPLOADED: "File Uploaded",
      FILE_DELETED: "File Deleted",
      PARTNER_UPDATED: "Partner Updated",
      SETTINGS_CHANGED: "Settings Changed",
      PARTNER_CREATED: "Partner Created",
      PARTNER_DELETED: "Partner Deleted",
    },
    status: {
      draft: "Draft",
      review_requested: "Review Requested",
      review_completed: "Review Completed",
      inspection: "Inbound Pending",
      completed: "Completed",
      rejected: "Rejected",
      pending: "Pending",
      active: "Active",
      inactive: "Inactive",
    },
    detailLabels: {
      status: "Status",
      from: "Before",
      to: "After",
      actor: "Actor",
      user: "User",
      role: "Role",
      target: "Target",
      workOrderId: "Work Order",
      fileName: "File Name",
      partnerName: "Partner",
      source: "Data Source",
      type: "Type",
      memo: "Memo",
      message: "Message",
      name: "Name",
      title: "Title",
      quantity: "Quantity",
      reason: "Reason",
    },
    targetTypes: {
      workorder: "Work Order",
      partner: "Partner",
      file: "File",
      settings: "Settings",
      user: "User",
    },
    systemActor: "System",
    summaries: {
      WORKORDER_CREATED: "Work order created",
      STATUS_CHANGED: "Status changed",
      FILE_UPLOADED: "File uploaded",
      FILE_DELETED: "File deleted",
      PARTNER_UPDATED: "Partner updated",
      SETTINGS_CHANGED: "Settings changed",
      PARTNER_CREATED: "Partner created",
      PARTNER_DELETED: "Partner deleted",
    },
    unknownLabel: "Needs Review",
  },
  topbar: {
    personalSettingsDescription:
      "Personal settings only change language and theme.",
    actions: {
      home: "Home",
      personalSettings: "Personal settings",
      adminSettings: "Settings",
      logout: "Log out",
      openWorkorder: "Work orders",
    },
    summaries: {
      adminMain: "Operations, status flow, and today checks",
      storage: "Documents/designs · Trash · Storage usage",
      partners: "Partners, factories, and outsourcing vendors",
      dashboard: "Work orders, partners, and file usage",
      settings: "Standards, storage policy, and log events",
      members: "Member invitations, roles, and permission design",
      history: "Status changes and key activity records",
    },
  },
  dashboardPage: {
    title: "Statistics",
    description:
      "Period work · partners · file usage · production stage statistics",
    workorderFlowTitle: "Work Order Status",
    dbSourceDescription: "Status volume based on DB data",
    dbNotConfiguredDescription:
      "No database connection is configured, so real data is shown as zero.",
    dbErrorDescription:
      "Database lookup failed, so real data is shown as zero.",
    currentMonth: "This month",
    partnersTitle: "Partner Distribution",
    partnerCountSuffix: "items",
    workorderCountSuffix: "orders",
    fileUsageTitle: "File usage",
    emptyFlowLabel: "No work order status data for this month.",
    periodTitle: "Period",
    keyMetricsTitle: "Key metrics",
    partnerDonutTitle: "Partner distribution",
    fileDonutTitle: "File usage",
    attachmentTrashTitle: "Attachments / Trash",
    productionRoundTitle: "Production round ratio",
    factoryProductionTitle: "Production by factory",
    categoryDistributionTitle: "Category distribution by stage",
    cumulativeNoticeTitle: "Cumulative basis",
    cumulativeNoticeDescription:
      "Cumulative view is separated so production round records can remain useful as a statistics axis even after work items are removed later.",
    monthlyNoticeTitle: "Monthly basis",
    monthlyNoticeDescription:
      "Review completed, delayed inbound, and defect flows are shown as operational indicators for the selected month.",
    customPeriodInvalidOrder:
      "End date must be the same as or later than the start date.",
    customPeriodFutureBlocked: "Future dates cannot be selected.",
    categoryDepthFirst: "Primary",
    categoryDepthSecond: "Item",
    selectedCategoryFallback: "Selected item",
    categoryDetailTitleFirst: "Top 5 items in {label}",
    categoryDetailTitleSecond: "Top 5 details in {label}",
    categoryDetailEmptyFirst: "No item data for the selected primary category.",
    categoryDetailEmptySecond: "No detail data for the selected item.",
    factoryTooltipProduction: "{label} · production {count}",
    factoryTooltipDelay: "Delay {count} / {target}",
    factoryTooltipDelayExamples: "Delayed work orders: {items}",
    factoryTooltipDelayNone: "Delayed work orders: none",
    factoryTooltipQuality: "Quality issue candidates {count} / {target}",
    factoryTooltipQualityExamples: "Quality issue candidates: {items}",
    factoryTooltipQualityNone: "Quality issue candidates: none",
    statsOverviewEyebrow: "Current overview",
    statsOverviewTitle: "Operational cumulative metrics",
    statsOverviewDescription:
      "Review cumulative production, delay, quality, and storage usage for the current company first.",
    statsAnalysisEyebrow: "Analysis",
    statsAnalysisDescription:
      "Switch between production mix, partner performance, and period flow with tabs.",
    selectedPeriodBadgeLabel: "Selected period",
    currentProducedLabel: "Cumulative production",
    currentReorderDescription: "Reorders {count}",
    currentDelayRateLabel: "Cumulative delay rate",
    currentQualityRateLabel: "Cumulative inspection/defect rate",
    currentStorageUsageLabel: "Current storage usage",
    currentRateBasis: "{count} / {target}",
    currentRateBasisTargetSuffix: "basis",
    usedSuffix: "used",
    periodAnalysisEyebrow: "Period analysis",
    periodAnalysisTitle: "Period analysis",
    customStartDateLabel: "Start date",
    customEndDateLabel: "End date",
    customReset: "Reset",
    customApply: "Apply custom range",
    customApplyShort: "Apply",
    customClear: "Clear",
    customDone: "Done",
    customDateRangeSelected: "Selected range: {start} - {end}",
    customDateRangeEmpty: "Select a start and end date from the calendar.",
    customDateRangeCalendarAria: "Select statistics date range",

    periodSummaryTitle: "Period summary",
    periodSummaryCompletedLabel: "Completed work orders",
    periodSummaryCompletedDescription:
      "Work orders completed in the selected period",
    periodSummaryReorderLabel: "Reorders",
    periodSummaryReorderDescription:
      "Reorder work orders in the selected period",
    periodSummaryDefectLabel: "Defective work orders",
    periodSummaryDefectDescription:
      "Work orders with one or more defects recorded",
    dateSelectYear: "Year",
    dateSelectMonth: "Month",
    dateSelectDay: "Day",
    workflowEyebrow: "Workflow",
    workflowAnalysisTitle: "Workflow analysis",
    periodTopEyebrow: "Period top 5",
    periodTopCompletedTitle: "Top 5 by order quantity",
    periodTopReorderTitle: "Top 5 by reorder round",
    periodTopDefectTitle: "Top 5 defective work orders",
    periodTopCompletedEmpty: "No order quantity data.",
    periodTopReorderEmpty: "No reorder round data.",
    periodTopDefectEmpty: "No defective work order data.",
    periodTopCompletedBasis:
      "Based on total order quantity for completed work orders",
    periodTopReorderBasis:
      "Based on the highest reorder round in each reorder group",
    periodTopDefectBasis:
      "Based on work orders with at least one defect or rework signal",
    quantityCountSuffix: "pcs",
    reorderRoundSuffix: "round",
    reorderTopEyebrow: "Reorder top 5",
    reorderTopTitle: "Top reorder rounds by period",
    reorderEmpty: "No reorder data.",
    productionMixEyebrow: "Production mix",
    productionMixTitle: "Production type mix",
    productionMixEmpty: "No production type data.",
    currentBasis: "Current basis",
    selectedItemLabel: "Selected item",
    factoryPerformanceTitle: "Factory performance",
    factoryPerformanceEmpty: "No partner performance data.",
    delayQualityEyebrow: "Delay / quality",
    delayQualityTitle: "Factory delay and inspection metrics",
    statsSectionProductionLabel: "Production mix",
    statsSectionProductionDescription: "Production types and top items",
    statsSectionFactoryLabel: "Partner performance",
    statsSectionFactoryDescription:
      "Production, delay, and inspection by partner",
    statsSectionPeriodLabel: "Period analysis",
    statsSectionPeriodDescription: "Period reorder and summary metrics",
    factoryColumn: "Factory",
    delayRateColumn: "Delay rate",
    qualityRateColumn: "Inspection/defect rate",
  },
  settings: {
    hub: {
      eyebrow: "Admin settings",
    },
    accountRequest: {
      open: "Write request",
      description:
        "Describe the requested change and reason. It will be submitted for system-admin review.",
      placeholder:
        "Example: The business name changed. Enter the before/after information and reason.",
      validation:
        "Enter at least 10 characters. This is submitted as a review request and is not applied immediately.",
      submit: "Submit request",
      submitted:
        "The request has been submitted and will be reviewed by the system admin.",
      failed: "Could not submit the request. Try again later.",
    },
    billing: {
      emptyTitle: "Could not load billing information.",
      emptyDescription:
        "No settings data is available for the current signed-in company, or you do not have access.",
    },
  },
  settingsForm: {
    title: "Organization Settings",
    sampleCompanyName: "Sample customer",
    planLabel: "Plan: Basic",
    joinedPending: "Join date pending",
    updatedPending: "Recent setting pending",
    updatedPrefix: "Recently set ",
    saveFailed: "Could not save settings.",
    refreshLabel: "Refresh settings information",
    badges: {
      idle: "Settings",
      saving: "Saving",
      saved: "Saved",
      error: "Save failed",
    },
    summaryCards: {
      status: "Operation status",
      statusValue: "DB connected",
      joinedAt: "Joined",
      age: "Usage period",
      members: "Members",
      memberValue: "1 admin",
    },
    themeTitle: "Theme",
    themeCurrentPrefix: "Current ",
    languageTitle: "Language",
    languageCurrentPrefix: "Current ",
    organization: {
      badge: "Organization settings",
      title: "Company operation settings",
      description:
        "This area manages company-wide file, storage, notification, master-data, and member permission policies. Personal language and color preferences are changed in Personal Settings.",
      scopeTitle: "Organization setting scope",
      scopeDescription:
        "Only company-level settings that a customer admin manages remain on this screen.",
      summaryUnits: { gb: "GB", days: " days", percent: "%", count: "" },
      summaryCards: {
        "storage-limit": { label: "Storage limit" },
        "trash-retention": { label: "Trash retention" },
        "warning-threshold": { label: "Usage warning" },
        "notification-events": { label: "Notifications" },
      },
      scopes: {
        "file-policy": {
          title: "File policy",
          description:
            "Rules for upload, delete request, and trash retention flows.",
        },
        "storage-policy": {
          title: "Storage policy",
          description:
            "Storage limits, warning thresholds, and whether trash counts toward usage.",
        },
        "notification-policy": {
          title: "Notification policy",
          description:
            "Organization-level alerts such as review requests, order readiness, and storage warnings.",
        },
        standards: {
          title: "Master data",
          description:
            "Shared standards used by work orders, such as units, product types, and outsourcing processes.",
        },
        "member-permissions": {
          title: "Member permissions",
          description:
            "A later area for controlling which cards and features members can access by permission code.",
        },
      },
      statusLabels: { active: "Active", fixed: "Fixed", planned: "Planned" },
      personalSettings: {
        title: "Personal settings are separate",
        description:
          "Language, color, screen density, and default home are per-user preferences, not company-wide policy.",
        note: "Customer admins and members change language and theme from the personal settings modal opened by the top user icon. The modal structure can later move to DB-backed user settings.",
        actionLabel: "Open personal settings",
      },
    },
  },
  userAccessPreview: {
    title: "User / Permission Test Structure",
    description:
      "A preparation panel for checking whether the DB user structure and current permission policy match before real login is connected.",
    sourceStates: {
      "db-connected": "Live user query",
      "db-prepared": "User structure prepared",
      unavailable: "User query unavailable",
    },
    userCountLabel: "Users",
    testUsersTitle: "Users by role",
    readOnlyBadge: "Read only",
    manageRolesButton: "Manage roles",
    roleModal: {
      title: "User Role Management",
      description:
        "A test modal for checking role-based permissions from Settings before real login is connected.",
      sectionTitle: "Role change test",
      sectionDescription:
        "Changing a role recalculates permission badges through the central role policy. This step only validates the screen and does not save to DB yet.",
      previewBadge: "Permission preview",
      resetButton: "Reset",
      closeButton: "Confirm",
    },
    permissionLabels: {
      canAssignRoles: "Role admin",
      canEditInventory: "Inventory edit",
      canSeeCostSections: "Cost view",
    },
    checklistTitle: "Migration checklist",
    checklist: {
      "users-table": "users table SQL prepared",
      "company-users-table": "company_users role mapping SQL prepared",
      "role-policy": "Central role / permission policy connected",
      "db-user-query": "Query users and roles from DB",
      "login-adapter": "Real login adapter connected",
    },
    status: { ready: "Ready", pending: "Pending" },
    nextStep:
      "Next, connect this structure to the role management modal and real login flow.",
  },
  notificationSection: {
    items: {
      created: {
        label: "Work order created",
        description: "Notify when a new work order is created.",
      },
      updated: {
        label: "Basic info updated",
        description: "Notify when basic information is saved or updated.",
      },
      status_changed: {
        label: "Status changed",
        description:
          "Notify when stages such as Draft, Review requested, or Inspection change.",
      },
      materials_changed: {
        label: "Fabric / trim changed",
        description:
          "Notify when production composition such as materials, trims, or unit cost changes.",
      },
      outsourcing_changed: {
        label: "Outsourcing changed",
        description:
          "Notify when outsourcing processes are added, edited, or removed.",
      },
      stock_changed: {
        label: "Inventory changed",
        description:
          "Notify when inventory quantities change through inbound, deduction, or adjustment.",
      },
      comment_added: {
        label: "Memo added",
        description: "Notify when work memos or replies are added.",
      },
    },
    title: "Notification Event Settings",
    description:
      "Only the state is stored for now. Actual delivery is not connected yet.",
    badge: "Test",
    toggleOn: "ON",
    toggleOff: "OFF",
  },
  partnerMaster: {
    page: {
      title: "Partner / Factory Management",
      description:
        "Primary partner types are managed as factory, fabric, and subsidiary, while outsourcing and process connections are handled as separate attributes.",
      moveToAdminMain: "Admin Home",
      moveToWorkspace: "Open Workspace",
    },
    header: {
      eyebrow: "Partner network",
      title: "Partner / Factory Management",
      description:
        "Manage partners, fabric vendors, and material vendors in one screen. Select a row to edit details.",
      manageProcesses: "Manage Outsourcing Processes",
      createPartner: "Add partner",
    },
    typeLabels: {
      all: "All",
      factory: "Factory",
      material_vendor: "Fabric",
      subsidiary_vendor: "Subsidiary",
      outsourcing_vendor: "Outsourcing",
    },
    summaryCards: {
      ariaLabel: "Partner summary",
      total: {
        label: "Total partners",
        helper: "Registered partners",
        filteredHelper: "Current filter of {total} total",
      },
      active: {
        label: "Active",
        helper: "Inactive {inactive}",
      },
      factory: {
        label: "Factories",
        helper: "Production vendors",
      },
      materials: {
        label: "Fabric & materials",
        helper: "Fabric {fabric} · subsidiary {subsidiary}",
      },
      outsourcing: {
        label: "Outsourcing",
        helper: "Linked processes {processes}",
      },
    },
    filters: {
      searchLabel: "Search",
      searchPlaceholder:
        "Search by name, contact, phone, memo, or outsourcing process",
      summaryLabel: "Summary",
      summaryDescription:
        "Partner records are master data used directly in work orders, so keep active vendors clean and operationally selectable.",
      typeLabel: "Type",
      statusLabel: "Status",
      statusOptions: {
        all: "All",
        active: "Active",
        inactive: "Inactive",
      },
      currentListPrefix: "Current list",
      currentListSuffix: "items",
      searchResultSuffix: " · filtered by search",
      usageSummary: "Active {active} · Inactive {inactive}",
    },
    list: {
      columns: {
        name: "Name",
        contact: "Contact",
        phone: "Phone",
        email: "Email",
        type: "Type",
        status: "Status",
        updatedAt: "Updated",
        actions: "Actions",
      },
      empty: "No partners match the selected filters.",
      inactiveBadge: "Inactive",
      contactMissing: "No contact",
      phoneMissing: "No phone",
      memoMissing: "No memo",
      active: "Active",
      inactive: "Inactive",
      noBaseType: "No base type",
      typeMissing: "No type information",
      edit: "Edit",
      loading: "Loading partner list.",
    },
    form: {
      createTitle: "Add Partner / Factory",
      editTitle: "Edit Partner / Factory",
      description:
        "Manage partner name, contact, phone, primary trade type, and outsourcing settings in the partner master.",
      cancel: "Cancel",
      save: "Save",
      sections: {
        basic: "Basic Information",
        category: "Category",
        memo: "Memo",
      },
      typeLabels: {
        factory: "Factory",
        material_vendor: "Fabric",
        subsidiary_vendor: "Subsidiary",
        outsourcing_vendor: "Outsourcing",
      },
      labels: {
        name: "Name",
        active: "Usage",
        contactName: "Contact",
        phone: "Phone",
        email: "Email",
        baseTypes: "Primary trade type",
        outsourcing: "Outsourcing",
        outsourcingProcesses: "Outsourcing processes",
        memo: "Memo",
      },
      placeholders: {
        name: "Enter partner name",
        contactName: "Enter contact name",
        phone: "000-0000-0000",
        email: "Enter email",
        memo: "Enter partner memo",
      },
      usageActive: "Active",
      usageInactive: "Inactive",
      usageSrLabel: "Partner active status",
      saveFailed: "Could not save. Check the database connection.",
      outsourcingDescription:
        "If this partner is an outsourcing vendor, connect processes so work orders can filter it directly.",
      outsourcingActive: "Outsourcing enabled",
      outsourcingInactive: "Outsourcing disabled",
      outsourcingSrLabel: "Outsourcing enabled",
      manageProcesses: "Manage Outsourcing Processes",
      outsourcingProcessDescription:
        "Choose a process from the left list and move it to the selected list on the right.",
      noAvailableProcesses: "No available processes to add.",
      noAssignedProcesses: "No selected processes.",
      addSelectedProcess: "Add selected process to the right",
      removeSelectedProcess: "Remove selected process to the left",
    },
    processManagement: {
      title: "Manage Outsourcing Processes",
      description:
        "Add outsourcing processes, move them between active/inactive, then save to apply changes.",
      resetDefaults: "Reset Defaults",
      close: "Close",
      save: "Save",
      newProcessLabel: "New outsourcing process",
      newProcessPlaceholder: "Enter process name",
      add: "Add",
      displayName: "Label",
      active: "Active",
      inactive: "Inactive",
      delete: "Delete",
      usageSrLabelSuffix: " active status",
      moveUpSuffix: " move up",
      moveDownSuffix: " move down",
      addSectionTitle: "Add Outsourcing Process",
      usageSectionTitle: "Outsourcing Process Usage",
      inactiveListTitle: "Inactive outsourcing processes",
      activeListTitle: "Active outsourcing processes",
      inactiveEmpty: "No inactive outsourcing processes.",
      activeEmpty: "No active outsourcing processes.",
      activateSelected: "Mark selected outsourcing process as active",
      deactivateSelected: "Mark selected outsourcing process as inactive",
    },
    confirm: {
      deleteProcessTitle: "Delete Outsourcing Process",
      deleteProcessDescription:
        "Deleting this also removes the process from partners currently using it.",
      cancel: "Cancel",
      confirmDelete: "Delete",
      deleteProcessBody: 'Delete outsourcing process "{label}"?',
      deleteProcessMissing: "The process to delete could not be found.",
    },
  },
  statsUi: {
    flowBuckets: {
      writing: "Writing",
      review: "Review",
      order: "Order",
      inbound: "Inbound",
      completed: "Completed",
    },
    partnerBuckets: {
      factory: "Factory",
      fabric: "Fabric",
      subsidiary: "Subsidiary",
      outsourcing: "Outsourcing",
    },
    fileUsage: {
      total: "Total usage",
      active: "Attachments",
      trash: "Trash",
      quotaLabel: "5.0GB",
    },
    summaries: {
      totalWorkorders: {
        label: "Total work orders",
        description: "Total work orders from DB",
      },
      partnerCount: { label: "Partners", description: "Active partner count" },
      fileUsage: {
        label: "File usage",
        description: "Current attachment usage",
      },
      completedInPeriod: {
        label: "Completed work orders",
        description: "Completed within the selected period",
      },
    },
    countSuffix: "items",
    flowCountSuffix: "items",
    unknownLabel: "Uncategorized",
    productionRounds: {
      first: "Primary",
      second: "Secondary",
      thirdOrMore: "Tertiary",
    },
    periods: {
      sevenDays: "7 days",
      fifteenDays: "15 days",
      thirtyDays: "30 days",
      monthly: "This month",
      all: "Cumulative",
      custom: "Custom",
    },
    metrics: {
      reviewWaiting: {
        label: "Review waiting",
        description: "Work before order that needs admin review",
      },
      inspectionWaiting: {
        label: "Inspection waiting",
        description: "Work that needs inbound inspection",
      },
      inboundDelayed: {
        label: "Inbound delayed",
        description: "Inspection status lasting more than 24 hours",
      },
      defectCount: {
        label: "Defects",
        description: "Work marked as rework or defect",
      },
    },
  },
  standards: {
    common: {
      resetDefaults: "Reset defaults",
      save: "Save",
      saving: "Saving",
      add: "Add",
      active: "Active",
      inactive: "Inactive",
      manage: "Manage",
      readOnly: "Read only",
      inUseSuffix: " active",
    },
    section: {
      policyTitle: "Policy Management",
      standardTitle: "Standards Management",
      saveProcessFailed: "Save failed. Check the database connection.",
      saveUnitFailed: "Unit save failed. Check the database connection.",
      saveItemFailed: "Item save failed. Check the database connection.",
      logEventsTitle: "Log Events",
    },
    actions: {
      notifications: {
        title: "Notification Policy",
        description: "Review, order, storage, and purge results",
      },
      logs: {
        title: "Log Events",
        description: "Work order change record events",
      },
      filePolicy: {
        title: "Storage Policy",
        description: "Capacity, trash, and purge rules",
      },
      items: { title: "Product Types" },
      units: { title: "Unit Standards" },
      processes: { title: "Outsourcing Process Types" },
    },
    units: {
      title: "Unit Standards",
      addTitle: "Add Unit",
      usageTitle: "Unit Usage",
      nameRequired: "Enter a unit name and code.",
      duplicate: "This unit is already registered.",
      namePlaceholder: "Unit name, e.g. piece",
      codePlaceholder: "Code, e.g. piece",
    },
    itemCategories: {
      title: "Product Types",
      addTitle: "Add Product Type",
      usageTitle: "Product Type Usage",
      countSuffix: "items",
      active: "Active",
      inactive: "Inactive",
      nameRequired: "Enter an item name to add.",
      selectLevel1: "Select a level 1 item first.",
      selectLevel2: "Select a level 2 item first.",
      duplicate: "This item name is already registered.",
      level1Placeholder: "Add level 1 item",
      level2Placeholder: "Add level 2 under selected level 1",
      level3Placeholder: "Add level 3 under selected level 2",
      level1Title: "Level 1",
      level2Title: "Level 2",
      level3Title: "Level 3",
      level1Empty: "No level 1 items.",
      level2Empty: "No level 2 items under the selected level 1.",
      level3Empty: "No level 3 items under the selected level 2.",
    },
    notificationPolicy: {
      title: "Notification Policy",
      loadFailed: "Could not load notification policy.",
      saveFailed: "Could not save notification policy.",
      items: {
        reviewRequestEnabled: "Review request",
        orderReadyEnabled: "Order ready",
        storageWarningEnabled: "Storage warning",
        purgeResultEnabled: "Purge result",
      },
    },
    filePolicy: {
      title: "File Policy",
      loadFailed: "Could not load file policy.",
      saveFailed: "Could not save file policy.",
      deleteMode: "Delete mode",
      deleteModeDescription:
        "Choose whether deleted files move to trash or are removed immediately.",
      fixedTrashPolicyDescription:
        "Deleted files move to trash and can be restored for 30 days.",
      softDelete: "Trash",
      hardDelete: "Immediate delete",
      includeTrashInUsage: "Include trash usage",
      includeTrashDescription:
        "Choose whether files waiting for purge count toward storage usage.",
      includeTrashActive: "Included",
      includeTrashInactive: "Excluded",
      retentionDays: "Deleted file retention period",
      retentionDescription:
        "Period before trash files become purge candidates.",
      retentionDisabledDescription:
        "Immediate delete mode does not use a deleted file retention period.",
      disabled: "Disabled",
      storageLimit: "Default storage limit (GB)",
      warningThreshold: "Storage caution threshold (%)",
      dangerThresholdDescription:
        "Danger is calculated 10% above the caution threshold.",
      storageStatus: "Storage status",
      storageStatusLabels: {
        normal: "Normal",
        caution: "Caution",
        danger: "Risk",
      },
      storageStatusDescriptions: {
        normal: "Under {caution}% usage",
        caution: "{caution}% to under {danger}% usage",
        danger: "{danger}% or higher, or over limit",
      },
      daySuffix: "days",
    },
  },
  companyOnboarding: {
    eyebrow: "Company onboarding",
    title: "Enter company information",
    description:
      "Enter company information and administrator contact details before using the customer admin workspace. The admin workspace remains blocked until this profile is completed.",
    logout: "Log out",
    requiredNoticeTitle: "Required company information is missing.",
    requiredNoticeDescription:
      "After saving the company name, business name, address, admin name, and phone number, the company moves to system approval pending status.",
    saved:
      "Company information has been saved. The workspace becomes available after system admin approval.",
    saving: "Saving",
    submit: "Save and request approval",
    addressApiNote:
      "After selecting a search result, enter the address detail manually. If search is unavailable, postal code and address can still be entered manually.",
    addressSearch: {
      label: "Road-name address search",
      placeholder: "Enter a road name, building name, or lot number",
      description:
        "Searches the official road-name address API and fills postal code, road address, and jibun address.",
      button: "Search address",
      loading: "Searching",
      empty:
        "No address results found. Try another keyword or enter the address manually.",
      postalCodeLabel: "Postal code",
      errors: {
        keywordRequired: "Enter a search keyword.",
        notConfigured:
          "The road-name address API key is not configured. Use manual entry instead.",
        failed:
          "Address search failed. Try again later or enter the address manually.",
        providerRejected:
          "The road-name address API key or registered URL could not be verified. Use manual entry instead.",
        upstreamFailed:
          "Could not connect to the road-name address search server. Try again later or enter the address manually.",
        responseInvalid:
          "The road-name address response could not be verified. Use manual entry instead.",
      },
    },
    sections: {
      company: "Company information",
      address: "Company address",
      files: "Company files",
      admin: "Administrator and plan",
    },
    fields: {
      companyName: "Company name",
      companyEnglishName: "Company English name",
      businessName: "Business name",
      businessRegistrationNumber: "Business registration number",
      postalCode: "Postal code",
      roadAddress: "Road address",
      jibunAddress: "Jibun address",
      addressDetail: "Address detail",
      addressExtra: "Address extra",
      adminName: "Administrator name",
      adminPhone: "Administrator phone",
      requestedPlanCode: "Requested plan",
    },
    placeholders: {
      companyName: "e.g. CHWJ Company",
      companyEnglishName: "e.g. CHWJ STUDIO",
      businessName: "e.g. AirWing",
      businessRegistrationNumber: "e.g. 123-45-67890",
      postalCode: "e.g. 58328",
      roadAddress: "e.g. 125 Green-ro, Naju-si",
      jibunAddress: "e.g. Bitgaram-dong, Naju-si",
      addressDetail: "e.g. Unit 205-2202",
      addressExtra: "e.g. Bitgaram-dong",
      adminName: "e.g. Wonjae Choi",
      adminPhone: "e.g. 010-1234-5678",
    },
    planOptions: {
      basic: "Basic",
      standard: "Standard",
      pro: "Pro",
      trial: "Free trial · 7 days",
    },
    planReadOnlyDescription:
      "The default trial plan is applied automatically during initial company registration. Plan changes are requested after approval from settings.",
    fileUploads: {
      select: "Select file",
      replace: "Replace",
      delete: "Delete",
      uploading: "The selected file will upload when you submit for approval.",
      deleting: "Deleting file.",
      uploadedAt: "Uploaded at",
      confirmReplace:
        "Delete the current file and replace it with the new file?",
      confirmDelete: "Delete the uploaded file?",
      saveBlocked: "You cannot submit while file processing is in progress.",
      note: "Company logo and business registration files are optional. Selected files upload to R2 together with company information only when you submit for approval.",
      logo: {
        label: "Company logo",
        description:
          "JPG, PNG, and WEBP files are supported. The maximum size is 5 MB.",
        empty: "No company logo has been uploaded.",
      },
      businessLicense: {
        label: "Business registration certificate",
        description:
          "JPG, PNG, WEBP, and PDF files are supported. The maximum size is 10 MB.",
        empty: "No business registration certificate has been uploaded.",
      },
    },
    loading: {
      title: "Checking company information status.",
      description:
        "The admin workspace is temporarily blocked while the required onboarding status is checked.",
    },
    pending: {
      title: "Waiting for approval.",
      description:
        "Company information has been submitted. The workspace will become available after a system administrator reviews and approves the company.",
    },
    trialExpired: {
      title: "The free trial has ended.",
      description:
        "Select a plan or ask the system administrator to extend access. Members should contact the customer administrator.",
      action: "View plans",
    },
    errors: {
      requiredFields: "Check the required fields",
      load: "Failed to load company information.",
      save: "Failed to save company information. Check required fields.",
      fileRequired: "Select a file to upload.",
      fileTypeRequired: "Select an upload file type.",
      fileTypeUnsupported: "This upload file type is not supported.",
      fileMimeTypeUnsupported: "This file format is not supported.",
      fileSizeUnsupported: "The file exceeds the allowed size.",
      fileUploadNotConfigured: "File upload is not configured.",
      fileUploadFailed: "Failed to upload the file.",
      fileDeleteFailed: "Failed to delete the file.",
      fileNotFound: "File not found.",
    },
  },
  servicePausedPage: {
    eyebrow: "WAFL ACCESS",
    sessionRequired: {
      title: "Sign-in is required.",
      description:
        "To use the workspace, sign in again with an invitation link or a registered account.",
      notice:
        "If a new Google account enters directly without an invitation link, onboarding cannot continue. Ask the company admin or system admin for an invitation link.",
    },
    profileRequiredAdmin: {
      title: "Company information is required.",
      description:
        "The company admin must submit company details and required files before requesting approval.",
      notice:
        "Company details are not finalized in DB/R2 until the approval request is submitted. Return to the input screen and submit the required information.",
    },
    profileRequiredMember: {
      title: "This account is not ready for workspace access.",
      description:
        "Regular members cannot submit company information or request company approval.",
      notice:
        "Ask the company admin to check the company approval status and member approval status.",
    },
    approvalPendingAdmin: {
      title: "Company approval is pending.",
      description:
        "Company information has been submitted and is waiting for system-admin review.",
      notice:
        "Core workspace screens such as work orders, storage, and member management are unavailable before approval.",
    },
    approvalPendingMember: {
      title: "Company or member approval is pending.",
      description:
        "Regular members cannot use the workspace while approval is pending.",
      notice:
        "Ask the company admin to check the approval status. After approval, sign in again to enter the workspace.",
    },
    rejectedAdmin: {
      title: "The company request was rejected.",
      description:
        "The system admin rejected the company request or requested resubmission.",
      notice:
        "Check the rejection reason and request resubmission from the system admin. Workspace features are unavailable on this screen.",
    },
    rejectedMember: {
      title: "The company request has not been approved.",
      description:
        "Because the company request was rejected, member accounts cannot use the workspace.",
      notice: "Ask the company admin to check the company approval status.",
    },
    subscriptionAdmin: {
      title: "Plan or service status needs review.",
      description:
        "Workspace access is restricted because the free trial ended or the billing/subscription status needs review.",
      notice:
        "Company admins can check the current status on the subscription screen and request service reactivation from the system admin.",
    },
    subscriptionMember: {
      title: "Service access is paused.",
      description:
        "Regular member workspace access is restricted because the free trial ended or the billing status needs review.",
      notice:
        "Regular members cannot change plans. Ask the company admin to check the service status.",
    },
    unknown: {
      title: "Access status needs review.",
      description:
        "The company status for this account could not be determined clearly.",
      notice:
        "If the same screen appears after signing in again, contact the company admin or system admin.",
    },
    labels: {
      company: "Company",
      account: "Account",
      status: "Status",
    },
    actions: {
      logout: "Log out",
      goAdmin: "Go to company information",
      goSubscription: "Go to subscription",
      goLogin: "Go to sign-in",
    },
    statusLabels: {
      session_required: "Sign-in required",
      profile_required: "Company information required",
      approval_pending: "Approval pending",
      rejected: "Rejected",
      subscription_blocked: "Access restricted",
      unknown: "Review needed",
    },
  },
  subscriptionPage: {
    shellTitle: "Subscription",
    shellDescription: "Review free-trial expiration and subscription status.",
    eyebrow: "WAFL SUBSCRIPTION",
    title: "Plan selection and service status",
    description:
      "Companies whose free trial has ended or whose access status needs review can request plan activation through the system administrator until payment integration is connected.",
    status: {
      unknown: "Company status needs review",
      trialExpired: "Free trial expired",
      pastDue: "Payment review needed",
      canceled: "Service canceled",
      active: "Active",
      trialing: "Free trial active",
    },
    statusDescription:
      "Company admins can review the current status and available plans here. Payment integration will be added in a later step.",
    primaryActionLabel: "Request plan activation from system admin",
    secondaryActionLabel: "Log out",
    memberNoticeTitle: "Member screen notice",
    memberNoticeDescription:
      "Regular members cannot change plans, so they only see a service-paused notice asking them to contact the company admin.",
    metricLabels: {
      currentStatus: "Current status",
      trialStartedAt: "Trial started",
      trialEndsAt: "Trial ends",
    },
    metricDescriptions: {
      currentStatus:
        "Calculated from company subscription_status and trial_ends_at.",
      trialStartedAt: "The free-trial start timestamp set at approval.",
      trialEndsAt:
        "Core workspace access is restricted after this time passes.",
    },
    unsetDateLabel: "Not set",
    planStatus: {
      active: "Available",
      preparing: "Preparing",
    },
    planDescription:
      "Until payment integration is connected, the system admin handles plan changes and service reactivation.",
    storageLabel: "Storage",
    memberLabel: " members",
    freePriceLabel: "Free",
    monthlyPriceSuffix: " KRW / month",
    policyNotes: [
      "This step does not connect payment APIs; it only organizes screen routing and guidance.",
      "Company admins move to the subscription screen, while members move to the service-paused screen.",
      "The next step will block core API requests using the same trial-expiration status.",
    ],
  },
} as const;
