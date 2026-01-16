const listEl = document.getElementById("list");
const form = document.getElementById("createForm");

const editingIdEl = document.getElementById("editingId");
const titleEl = document.getElementById("title");
const descriptionEl = document.getElementById("description");
const statusEl = document.getElementById("status");
const priorityEl = document.getElementById("priority");

const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");

async function fetchTasks() {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    render(data);
}

function setEditMode(task) {
    editingIdEl.value = task._id;
    titleEl.value = task.title;
    descriptionEl.value = task.description;
    statusEl.value = task.status;
    priorityEl.value = task.priority;

    submitBtn.textContent = "Save changes";
    cancelBtn.style.display = "inline-block";
}

function clearEditMode() {
    editingIdEl.value = "";
    form.reset();
    statusEl.value = "todo";
    priorityEl.value = "medium";

    submitBtn.textContent = "Add task";
    cancelBtn.style.display = "none";
}

cancelBtn.addEventListener("click", () => clearEditMode());

function render(tasks) {
    listEl.innerHTML = "";

    tasks.forEach((t) => {
        const li = document.createElement("li");

        li.innerHTML = `
      <div class="row">
        <strong>${escapeHtml(t.title)}</strong>
        <span class="meta">status: ${t.status}</span>
        <span class="meta">priority: ${t.priority}</span>
      </div>
      <div>${escapeHtml(t.description)}</div>

      <div class="row" style="margin-top:10px;">
        <button data-action="edit" data-id="${t._id}">Edit</button>
        <button data-action="delete" data-id="${t._id}">Delete</button>
      </div>

      <div class="meta">createdAt: ${new Date(t.createdAt).toLocaleString()}</div>
    `;

        listEl.appendChild(li);
    });

    listEl.dataset.tasks = JSON.stringify(tasks);
}

listEl.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === "delete") {
        await fetch(`/api/tasks/${id}`, { method: "DELETE" });
        await fetchTasks();

        if (editingIdEl.value === id) clearEditMode();
        return;
    }

    if (action === "edit") {
        const tasks = JSON.parse(listEl.dataset.tasks || "[]");
        const task = tasks.find((x) => x._id === id);
        if (task) setEditMode(task);
    }
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const body = {
        title: titleEl.value.trim(),
        description: descriptionEl.value.trim(),
        status: statusEl.value,
        priority: priorityEl.value,
    };

    const editingId = editingIdEl.value;

    const url = editingId ? `/api/tasks/${editingId}` : "/api/tasks";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Request failed");
        return;
    }

    clearEditMode();
    await fetchTasks();
});

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

fetchTasks();
