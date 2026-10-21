// TaskFlow uses an in-memory JavaScript array. Refreshing the page clears tasks.
const tasks = [];
let nextTaskId = 1;
let currentFilter = "all";
let editingTaskId = null;

const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const searchInput = document.querySelector("#search-input");
const totalCount = document.querySelector("#total-count");
const pendingCount = document.querySelector("#pending-count");
const completedCount = document.querySelector("#completed-count");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyMessage = document.querySelector("#empty-message");
const formMessage = document.querySelector("#form-message");
const listSummary = document.querySelector("#list-summary");
const clearCompletedButton = document.querySelector("#clear-completed");
const editDialog = document.querySelector("#edit-dialog");
const editForm = document.querySelector("#edit-form");
const editInput = document.querySelector("#edit-input");
const cancelEditButton = document.querySelector("#cancel-edit");

document.querySelector("#today-label").textContent = new Date().toLocaleDateString(undefined, {
  weekday: "short", month: "short", day: "numeric"
});

function showMessage(message, type = "error") {
  formMessage.textContent = message;
  formMessage.classList.toggle("success", type === "success");
}

function addTask(title) {
  tasks.unshift({ id: nextTaskId++, title, completed: false, createdAt: new Date() });
  renderTasks();
  showMessage("Task added successfully.", "success");
}

function toggleTask(taskId) {
  const task = tasks.find(item => item.id === taskId);
  if (!task) return;
  task.completed = !task.completed;
  renderTasks();
}

function deleteTask(taskId) {
  const index = tasks.findIndex(item => item.id === taskId);
  if (index === -1) return;
  tasks.splice(index, 1);
  renderTasks();
  showMessage("Task deleted.", "success");
}

function openEditDialog(taskId) {
  const task = tasks.find(item => item.id === taskId);
  if (!task) return;
  editingTaskId = taskId;
  editInput.value = task.title;
  editDialog.showModal();
  editInput.focus();
}

function getVisibleTasks() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  return tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm);
    const matchesFilter = currentFilter === "all" ||
      (currentFilter === "pending" && !task.completed) ||
      (currentFilter === "completed" && task.completed);
    return matchesSearch && matchesFilter;
  });
}

function createTaskElement(task) {
  const item = document.createElement("li");
  item.className = `task-item${task.completed ? " completed" : ""}`;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-check";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label", `Mark ${task.title} as ${task.completed ? "pending" : "completed"}`);
  checkbox.addEventListener("change", () => toggleTask(task.id));

  const content = document.createElement("div");
  content.className = "task-content";
  const title = document.createElement("span");
  title.className = "task-title";
  title.textContent = task.title;
  const date = document.createElement("span");
  date.className = "task-date";
  date.textContent = `Added ${task.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  content.append(title, date);

  const actions = document.createElement("div");
  actions.className = "task-actions";
  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "icon-button";
  editButton.textContent = "✎";
  editButton.title = "Edit task";
  editButton.setAttribute("aria-label", `Edit ${task.title}`);
  editButton.addEventListener("click", () => openEditDialog(task.id));

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "icon-button delete";
  deleteButton.textContent = "×";
  deleteButton.title = "Delete task";
  deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
  deleteButton.addEventListener("click", () => deleteTask(task.id));
  actions.append(editButton, deleteButton);
  item.append(checkbox, content, actions);
  return item;
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();
  taskList.replaceChildren();
  visibleTasks.forEach(task => taskList.appendChild(createTaskElement(task)));

  const completed = tasks.filter(task => task.completed).length;
  totalCount.textContent = tasks.length;
  pendingCount.textContent = tasks.length - completed;
  completedCount.textContent = completed;

  emptyState.hidden = visibleTasks.length > 0;
  if (tasks.length === 0) {
    emptyTitle.textContent = "A fresh start";
    emptyMessage.textContent = "Add your first task above and make today count.";
  } else if (visibleTasks.length === 0) {
    emptyTitle.textContent = "No matching tasks";
    emptyMessage.textContent = "Try another search or choose a different filter.";
  }

  listSummary.textContent = `${visibleTasks.length} of ${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} shown`;
  clearCompletedButton.disabled = completed === 0;
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title) {
    showMessage("Please enter a task before adding it.");
    taskInput.focus();
    return;
  }
  addTask(title);
  taskForm.reset();
  taskInput.focus();
});

searchInput.addEventListener("input", renderTasks);

document.querySelectorAll("[data-filter]").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach(filterButton => {
      const active = filterButton === button;
      filterButton.classList.toggle("active", active);
      filterButton.setAttribute("aria-pressed", String(active));
    });
    renderTasks();
  });
});

editForm.addEventListener("submit", event => {
  event.preventDefault();
  const newTitle = editInput.value.trim();
  if (!newTitle) { editInput.focus(); return; }
  const task = tasks.find(item => item.id === editingTaskId);
  if (task) {
    task.title = newTitle;
    renderTasks();
    showMessage("Task updated successfully.", "success");
  }
  editDialog.close();
});

cancelEditButton.addEventListener("click", () => editDialog.close());
editDialog.addEventListener("close", () => { editingTaskId = null; });

clearCompletedButton.addEventListener("click", () => {
  const remainingTasks = tasks.filter(task => !task.completed);
  tasks.splice(0, tasks.length, ...remainingTasks);
  renderTasks();
  showMessage("Completed tasks cleared.", "success");
});

renderTasks();
