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

    showFlex(modal);
  } catch (e) {
    alert("Lỗi lấy chi tiết task");
  }
}

function closeModal() {
  hideFlex(modal);
  currentEditingTaskId = null;
  currentTask = null;
  hideEditDesc();
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

  if (!confirm("Bạn có chắc muốn xóa thẻ này vĩnh viễn?")) return;

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
    const createdAt = new Date(currentTask.createdAt);
    const minDate = createdAt.toISOString().split("T")[0];
    dateInput.min = minDate;

    if (currentTask.deadline) {
      const date = new Date(currentTask.deadline);
      dateInput.value = date.toISOString().split("T")[0];

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
window.saveDeadline = saveDeadline;