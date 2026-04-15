let currentEditingTaskId = null;
let currentTask = null;
let descriptionEditor = null;

const pageEl = document.getElementById("projectBoardPage");
const projectId = pageEl ? pageEl.dataset.projectId : null;
const isOwner = pageEl ? pageEl.dataset.isOwner === "true" : false;

const modal = document.getElementById("taskModal");
const titleInput = document.getElementById("modalTaskTitle");
const descTextarea = document.getElementById("modalTaskDesc");

function showFlex(el) {
  if (!el) return;
  el.classList.remove("hidden");
  el.classList.add("flex");
}

function hideFlex(el) {
  if (!el) return;
  el.classList.add("hidden");
  el.classList.remove("flex");
}

if (descTextarea && window.ClassicEditor) {
  ClassicEditor.create(descTextarea, {
    toolbar: ["bold", "italic", "link", "bulletedList", "numberedList", "undo", "redo"],
  })
    .then((editor) => {
      descriptionEditor = editor;
    })
    .catch((error) => {
      console.error("CKEditor init error:", error);
    });
}

function openInviteModal() {
  const modalEl = document.getElementById("inviteModal");
  showFlex(modalEl);
}

function closeInviteModal() {
  const modalEl = document.getElementById("inviteModal");
  hideFlex(modalEl);
}

function initInviteMemberForm() {
  const inviteForm = document.getElementById("inviteMemberForm");
  if (!inviteForm || !projectId) return;

  inviteForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const emailInput = inviteForm.querySelector('input[name="email"]');
    const email = emailInput ? emailInput.value.trim() : "";

    if (!email) {
      alert("Vui lòng nhập email");
      return;
    }

    try {
      const response = await fetch("/api/projects/" + projectId + "/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Mời thành viên thất bại");
        return;
      }

      alert("Mời thành công");
      closeInviteModal();
      location.reload();
    } catch (error) {
      alert("Có lỗi khi mời thành viên");
    }
  });
}

async function updateMemberRole(memberId, role) {
  let confirmed = true;

  if (role === "delete") {
    confirmed = confirm("Bạn có chắc muốn xóa thành viên này khỏi project?");
  }

  if (role === "owner") {
    confirmed = confirm("Bạn có chắc muốn chuyển quyền owner cho thành viên này?");
  }

  if (!confirmed) {
    location.reload();
    return;
  }

  try {
    const response = await fetch("/api/projects/" + projectId + "/members/" + memberId + "/role", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ role }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Cập nhật quyền thất bại");
      location.reload();
      return;
    }

    location.reload();
  } catch (error) {
    alert("Có lỗi khi cập nhật quyền");
    location.reload();
  }
}

function initSortableLists() {
  if (!window.Sortable) return;

  const lists = document.querySelectorAll(".task-list");
  lists.forEach((list) => {
    new Sortable(list, {
      group: "kanban",
      animation: 150,
      ghostClass: "ghost-card",
      onEnd: async function (evt) {
        const taskId = evt.item.getAttribute("data-id");
        const newStatus = evt.to.id;

        if (!taskId || evt.from === evt.to) return;

        try {
          await fetch("/api/tasks/update-status", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId, newStatus }),
          });
        } catch (e) {
          console.error("Lỗi cập nhật trạng thái");
        }
      },
    });
  });
}

async function openTaskDetail(taskId) {
  currentEditingTaskId = taskId;

  try {
    const response = await fetch("/api/tasks/" + taskId);
    const result = await response.json();
    const task = result.data || result;

    currentTask = task;

    if (titleInput) {
      titleInput.value = task.title || "";
    }

    if (descriptionEditor) {
      descriptionEditor.setData(task.description || "");
    } else if (descTextarea) {
      descTextarea.value = task.description || "";
    }

    const txtDesc = document.getElementById("txtDesc");
    if (txtDesc) {
      txtDesc.innerHTML = task.description || "Thêm mô tả chi tiết hơn...";
    }

    const modalColumnName = document.getElementById("modalColumnName");
    if (modalColumnName) {
      modalColumnName.innerText = task.listId ? task.listId.title : "Unknown";
    }

    const btnDateText = document.getElementById("btnDateText");
    const modalDeadlineText = document.getElementById("modalDeadlineText");

    if (task.deadline) {
      if (btnDateText) btnDateText.innerText = "Sửa ngày";
      if (modalDeadlineText) {
        const deadlineDate = new Date(task.deadline);
        modalDeadlineText.innerText = "Ngày hết hạn: " + deadlineDate.toLocaleDateString("vi-VN");
        modalDeadlineText.classList.remove("hidden");
      }
    } else {
      if (btnDateText) btnDateText.innerText = "Ngày";
      if (modalDeadlineText) {
        modalDeadlineText.classList.add("hidden");
      }
    }

    const assigneeListEl = document.getElementById("modalAssigneeList");
    if (assigneeListEl) {
      if (task.assignee && task.assignee.length) {
        assigneeListEl.innerHTML = task.assignee
          .map((user) => {
            const initials = user.fullname ? user.fullname.charAt(0).toUpperCase() : "?";
            const avatar = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname || "?")}`;
            return `
              <div class="relative group">
                <img src="${avatar}" alt="${user.fullname || "Assignee"}" title="${user.fullname || "Assignee"}" class="w-10 h-10 rounded-full object-cover border border-gray-200" />
                <div class="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs rounded-md px-2 py-1 whitespace-nowrap">
                  ${user.fullname || "Không tên"}
                </div>
              </div>
            `;
          })
          .join("");
      } else {
        assigneeListEl.innerHTML = '<span class="text-sm text-gray-500">Chưa có thành viên được gán</span>';
      }
    }

    showFlex(modal);
  } catch (e) {
    alert("Lỗi lấy chi tiết task");
  }
}

function closeModal() {
  hideFlex(modal);
  closeAssignPopup();
  currentEditingTaskId = null;
  currentTask = null;
  hideEditDesc();
}

let assignMemberList = [];

function openAssignPopup(event) {
  if (event) event.stopPropagation();
  if (!currentEditingTaskId) return;
  fetchProjectMembers();
}

function closeAssignPopup() {
  const popup = document.getElementById("assignMemberPopup");
  if (popup) hideFlex(popup);
  const searchInput = document.getElementById("assignSearchInput");
  if (searchInput) searchInput.value = "";
}

async function fetchProjectMembers() {
  const popup = document.getElementById("assignMemberPopup");
  const listEl = document.getElementById("assignMemberList");
  if (!popup || !listEl) return;

  const projectIdToUse = currentTask && currentTask.listId && currentTask.listId.projectId ? currentTask.listId.projectId : projectId;
  if (!projectIdToUse) {
    alert("Không xác định được project để lấy thành viên");
    return;
  }

  try {
    const response = await fetch(`/api/projects/${projectIdToUse}/members`, {
      headers: {
        Accept: "application/json",
      },
    });
    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Không thể tải danh sách thành viên");
      return;
    }

    assignMemberList = result.data || [];
    renderAssignMembers(assignMemberList);
    showFlex(popup);
  } catch (e) {
    alert("Lỗi khi tải danh sách thành viên");
  }
}

function renderAssignMembers(items) {
  const listEl = document.getElementById("assignMemberList");
  if (!listEl) return;

  if (!items.length) {
    listEl.innerHTML = '<div class="p-4 text-sm text-gray-500">Không tìm thấy thành viên</div>';
    return;
  }

  listEl.innerHTML = items
    .map((member) => {
      const user = member.user || {};
      const name = user.fullname || "Không tên";
      const email = user.email || "";
      return `
        <button type="button" onclick="assignMemberToTask('${user._id}')" class="w-full text-left p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center uppercase">${name.charAt(0) || "?"}</div>
            <div class="flex-1">
              <div class="font-semibold text-gray-900">${name}</div>
              <div class="text-sm text-gray-500">${email}</div>
            </div>
            <div class="text-xs text-gray-400">${member.role || "member"}</div>
          </div>
        </button>
      `;
    })
    .join("");
}

function filterAssignMembers() {
  const value = (document.getElementById("assignSearchInput")?.value || "").trim().toLowerCase();
  if (!value) {
    renderAssignMembers(assignMemberList);
    return;
  }

  const filtered = assignMemberList.filter((member) => {
    const user = member.user || {};
    const fullname = (user.fullname || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    return fullname.includes(value) || email.includes(value);
  });

  renderAssignMembers(filtered);
}

async function assignMemberToTask(userId) {
  if (!currentEditingTaskId || !userId) return;

  try {
    const response = await fetch(`/api/tasks/${currentEditingTaskId}/assignees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    const result = await response.json();
    if (!response.ok) {
      alert(result.message || "Gán thành viên thất bại");
      return;
    }

    alert(result.message);
    closeAssignPopup();
    openTaskDetail(currentEditingTaskId);
  } catch (e) {
    alert("Lỗi khi gán thành viên");
  }
}

function toggleEditDesc() {
  const descView = document.getElementById("descView");
  const descEdit = document.getElementById("descEdit");

  if (descView) descView.classList.add("hidden");
  if (descEdit) descEdit.classList.remove("hidden");

  if (descriptionEditor) {
    descriptionEditor.editing.view.focus();
  } else if (descTextarea) {
    descTextarea.focus();
  }
}

function hideEditDesc() {
  const descView = document.getElementById("descView");
  const descEdit = document.getElementById("descEdit");

  if (descView) descView.classList.remove("hidden");
  if (descEdit) descEdit.classList.add("hidden");
}

function toLocalDateInputString(date) {
  const localDate = new Date(date);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function cancelEditDesc() {
  const originalDesc = currentTask && currentTask.description ? currentTask.description : "";

  if (descriptionEditor) {
    descriptionEditor.setData(originalDesc);
  } else if (descTextarea) {
    descTextarea.value = originalDesc;
  }

  hideEditDesc();
}

async function saveDescription() {
  if (!currentEditingTaskId) return;

  const newDesc = descriptionEditor ? descriptionEditor.getData() : descTextarea ? descTextarea.value : "";

  try {
    const response = await fetch("/api/tasks/" + currentEditingTaskId + "/description", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: newDesc }),
    });

    if (response.ok) {
      const txtDesc = document.getElementById("txtDesc");
      if (txtDesc) {
        txtDesc.innerHTML = newDesc || "Thêm mô tả chi tiết hơn...";
      }
      if (currentTask) currentTask.description = newDesc;
      hideEditDesc();
    } else {
      alert("Lỗi lưu mô tả");
    }
  } catch (e) {
    alert("Lỗi lưu mô tả");
  }
}

async function deleteTask(taskId) {
  if (!taskId) return;

  if (!confirm("Bạn có muốn lưu trữ thẻ này không?")) return;

  try {
    const response = await fetch("/api/tasks/" + taskId, {
      method: "DELETE",
    });

    if (response.ok) {
      const el = document.querySelector('[data-id="' + taskId + '"]');
      if (el) el.remove();
      closeModal();
    } else {
      alert("Lỗi xóa");
    }
  } catch (e) {
    alert("Lỗi xóa");
  }
}

function initCommentUI() {
  const txtComment = document.getElementById("txtComment");
  const btnComment = document.getElementById("btnComment");

  if (!txtComment || !btnComment) return;

  txtComment.addEventListener("input", (e) => {
    if (e.target.value.trim().length > 0) {
      btnComment.disabled = false;
      btnComment.classList.add("bg-blue-600", "text-white");
      btnComment.classList.remove("cursor-not-allowed");
    } else {
      btnComment.disabled = true;
      btnComment.classList.remove("bg-blue-600", "text-white");
      btnComment.classList.add("cursor-not-allowed");
    }
  });
}

function openDatePicker() {
  const dateInput = document.getElementById("dateInput");
  const currentDeadlineText = document.getElementById("currentDeadlineText");
  const picker = document.getElementById("datePickerModal");

  if (!dateInput || !picker) return;

  if (currentTask) {
    const today = new Date();
    const minDate = toLocalDateInputString(today);
    dateInput.min = minDate;

    if (currentTask.deadline) {
      const date = new Date(currentTask.deadline);
      dateInput.value = toLocalDateInputString(date);

      if (currentDeadlineText) {
        currentDeadlineText.textContent = "Hiện tại: " + date.toLocaleDateString("vi-VN");
        currentDeadlineText.classList.remove("hidden");
      }
    } else {
      dateInput.value = minDate;
      if (currentDeadlineText) currentDeadlineText.classList.add("hidden");
    }
  } else {
    dateInput.value = "";
    dateInput.removeAttribute("min");
    if (currentDeadlineText) currentDeadlineText.classList.add("hidden");
  }

  showFlex(picker);
}

function closeDatePicker() {
  const picker = document.getElementById("datePickerModal");
  hideFlex(picker);
}

async function saveDeadline() {
  const dateInput = document.getElementById("dateInput");
  if (!dateInput || !currentEditingTaskId) return;

  const deadline = dateInput.value;
  if (!deadline) return;

  try {
    const response = await fetch("/api/tasks/" + currentEditingTaskId + "/deadline", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deadline }),
    });

    if (response.ok) {
      closeDatePicker();
      location.reload();
    } else {
      alert("Lỗi lưu ngày");
    }
  } catch (e) {
    alert("Lỗi lưu ngày");
  }
}

function initTitleAutoSave() {
  if (!titleInput) return;

  titleInput.addEventListener("blur", async () => {
    if (!currentEditingTaskId) return;

    const newTitle = titleInput.value.trim();
    if (!newTitle) return;

    try {
      const response = await fetch("/api/tasks/" + currentEditingTaskId + "/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        const taskCardTitle = document.querySelector('[data-id="' + currentEditingTaskId + '"] .task-title');
        if (taskCardTitle) taskCardTitle.innerText = newTitle;
      }
    } catch (e) {
      console.error("Lỗi lưu tiêu đề");
    }
  });
}

function initDateButton() {
  const btnDate = document.getElementById("btnDate");
  if (!btnDate) return;

  btnDate.addEventListener("click", openDatePicker);
}

function initBoard() {
  initSortableLists();
  initCommentUI();
  initTitleAutoSave();
  initDateButton();
  initInviteMemberForm();
}

initBoard();

window.openInviteModal = openInviteModal;
window.closeInviteModal = closeInviteModal;
window.updateMemberRole = updateMemberRole;
window.openTaskDetail = openTaskDetail;
window.closeModal = closeModal;
window.toggleEditDesc = toggleEditDesc;
window.cancelEditDesc = cancelEditDesc;
window.saveDescription = saveDescription;
window.deleteTask = deleteTask;
window.openDatePicker = openDatePicker;
window.closeDatePicker = closeDatePicker;
window.openTrashModal = openTrashModal;
window.closeTrashModal = closeTrashModal;

function openTrashModal() {
  const modal = document.getElementById("trashModal");
  if (modal) showFlex(modal);
  loadDeletedTasks();
}

function closeTrashModal() {
  const modal = document.getElementById("trashModal");
  if (modal) hideFlex(modal);
}

async function loadDeletedTasks() {
  const listEl = document.getElementById("trashTaskList");
  if (!listEl) return;

  try {
    const response = await fetch(`/api/tasks/deleted?projectId=${projectId}`, {
      headers: {
        Accept: "application/json",
      },
    });
    const result = await response.json();

    if (!response.ok) {
      listEl.innerHTML = `<div class="p-4 text-sm text-red-500 text-center">${result.message || "Không thể tải danh sách task đã xóa"}</div>`;
      return;
    }

    const tasks = result.data || [];
    renderDeletedTasks(tasks);
  } catch (e) {
    listEl.innerHTML = '<div class="p-4 text-sm text-red-500 text-center">Lỗi khi tải danh sách task đã xóa</div>';
  }
}

function renderDeletedTasks(tasks) {
  const listEl = document.getElementById("trashTaskList");
  if (!listEl) return;

  if (!tasks.length) {
    listEl.innerHTML = '<div class="p-4 text-sm text-gray-500 text-center">Không có task đã xóa</div>';
    return;
  }

  listEl.innerHTML = tasks
    .map((task) => {
      const assignees = task.assignee || [];
      const assigneeNames = assignees.map(a => a.fullname || "Unknown").join(", ");
      return `
        <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h4 class="font-semibold text-gray-900">${task.title}</h4>
              <p class="text-sm text-gray-600 mt-1">${task.description || "Không có mô tả"}</p>
              <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>Ưu tiên: ${task.priority || "Medium"}</span>
                ${task.deadline ? `<span>Deadline: ${new Date(task.deadline).toLocaleDateString("vi-VN")}</span>` : ""}
                ${assigneeNames ? `<span>Assignee: ${assigneeNames}</span>` : ""}
              </div>
            </div>
            <button
              type="button"
              onclick="restoreTask('${task._id}')"
              class="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition"
            >
              Khôi phục
            </button>
            <button
              type="button"
              onclick="permanentDeleteTask('${task._id}')"
              class="ml-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition"
            >
              Xóa vĩnh viễn
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

async function restoreTask(taskId) {
  if (!confirm("Bạn có chắc muốn khôi phục task này?")) return;

  try {
    const response = await fetch(`/api/tasks/${taskId}/restore`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const result = await response.json();
    if (!response.ok) {
      alert(result.message || "Khôi phục task thất bại");
      return;
    }

    alert("Khôi phục task thành công");
    location.reload(); // Reload the list
  } catch (e) {
    alert("Lỗi khi khôi phục task");
  }
}

async function permanentDeleteTask(taskId) {
  if (!confirm("Bạn có chắc muốn xóa vĩnh viễn task này? Hành động này không thể hoàn tác!")) return;

  try {
    const response = await fetch(`/api/tasks/${taskId}/permanent`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });

    const result = await response.json();
    if (!response.ok) {
      alert(result.message || "Xóa vĩnh viễn task thất bại");
      return;
    }

    alert("Xóa vĩnh viễn task thành công");
    loadDeletedTasks(); // Reload the list
  } catch (e) {
    alert("Lỗi khi xóa vĩnh viễn task");
  }
}