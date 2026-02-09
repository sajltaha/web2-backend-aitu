const API_BASE = '/api';

let currentUser = null;
let tasks = [];
let editingTaskId = null;

const userInfo = document.getElementById('userInfo');
const userEmail = document.getElementById('userEmail');
const userRole = document.getElementById('userRole');
const authButtons = document.getElementById('authButtons');
const logoutBtn = document.getElementById('logoutBtn');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const authModal = document.getElementById('authModal');
const modalTitle = document.getElementById('modalTitle');
const authForm = document.getElementById('authForm');
const registerFields = document.getElementById('registerFields');
const firstNameInput = document.getElementById('firstNameInput');
const lastNameInput = document.getElementById('lastNameInput');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const authError = document.getElementById('authError');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const closeModal = document.querySelector('.close');
const taskFormSection = document.getElementById('taskFormSection');
const taskForm = document.getElementById('taskForm');
const editingId = document.getElementById('editingId');
const titleInput = document.getElementById('titleInput');
const descriptionInput = document.getElementById('descriptionInput');
const statusSelect = document.getElementById('statusSelect');
const prioritySelect = document.getElementById('prioritySelect');
const assigneeSelect = document.getElementById('assigneeSelect');
const dueDateInput = document.getElementById('dueDateInput');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const formTitle = document.getElementById('formTitle');
const tasksList = document.getElementById('tasksList');
const loadingMessage = document.getElementById('loadingMessage');
const emptyMessage = document.getElementById('emptyMessage');
const adminHint = document.getElementById('adminHint');
const notification = document.getElementById('notification');
const superAdminSection = document.getElementById('superAdminSection');
const usersList = document.getElementById('usersList');
const filtersForm = document.getElementById('filtersForm');
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');
const filterPriority = document.getElementById('filterPriority');
const myTasksOnly = document.getElementById('myTasksOnly');
const resetFilters = document.getElementById('resetFilters');

const filters = {
    search: '',
    status: '',
    priority: '',
    mine: false
};

let users = [];

function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
}

function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function setUser(user) {
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
    } else {
        localStorage.removeItem('user');
    }
}

function getAuthHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

async function apiRequest(url, options = {}) {
    const headers = getAuthHeaders();
    
    try {
        const response = await fetch(`${API_BASE}${url}`, {
            ...options,
            headers: {
                ...headers,
                ...options.headers
            }
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            if (response.status === 401) {
                logout();
                showNotification('The session has expired. Please login again.', 'error');
            }
            throw new Error(data.message || `Error ${response.status}`);
        }

        return data;
    } catch (error) {
        throw error;
    }
}

function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getUserLabel(user) {
    if (!user) return 'Unknown';
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return name || user.email || 'Unknown';
}

async function loadUsers() {
    try {
        const data = await apiRequest('/users');
        users = Array.isArray(data) ? data : [];
        renderAssigneeOptions();
        renderUsersAdmin();
    } catch (error) {
        users = [];
        renderAssigneeOptions();
        renderUsersAdmin();
        showNotification('Failed to load users: ' + error.message, 'error');
    }
}

function renderAssigneeOptions() {
    const currentValue = assigneeSelect.value;
    const options = ['<option value="">Unassigned</option>']
        .concat(
            users.map(user => {
                const label = escapeHtml(user.fullName || `${user.firstName} ${user.lastName}`.trim() || user.email);
                return `<option value="${user.id}">${label}</option>`;
            })
        )
        .join('');
    assigneeSelect.innerHTML = options;

    if (currentValue) {
        assigneeSelect.value = currentValue;
    }
}

function renderUsersAdmin() {
    if (!currentUser || currentUser.role !== 'superadmin') {
        usersList.innerHTML = '';
        return;
    }

    if (!users.length) {
        usersList.innerHTML = '<div class="empty-message">No users found</div>';
        return;
    }

    usersList.innerHTML = users.map(user => {
        const label = escapeHtml(user.fullName || `${user.firstName} ${user.lastName}`.trim() || user.email);
        const role = user.role;
        const isSuperAdmin = role === 'superadmin';

        return `
            <div class="user-item">
                <div class="user-meta">
                    <strong>${label}</strong>
                    <span>${escapeHtml(user.email)}</span>
                </div>
                <div class="user-actions">
                    <select ${isSuperAdmin ? 'disabled' : ''} onchange="updateUserRole('${user.id}', this.value)">
                        <option value="user" ${role === 'user' ? 'selected' : ''}>User</option>
                        <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                    <button class="btn-danger btn-sm" ${isSuperAdmin ? 'disabled' : ''} onclick="deleteUser('${user.id}', '${label}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

window.updateUserRole = async function(userId, role) {
    if (!currentUser || currentUser.role !== 'superadmin') {
        showNotification('Only super admins can change roles', 'error');
        return;
    }

    try {
        await apiRequest(`/users/${userId}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role })
        });

        showNotification('Role updated', 'success');
        loadUsers();
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
        loadUsers();
    }
};

window.deleteUser = async function(userId, label) {
    if (!currentUser || currentUser.role !== 'superadmin') {
        showNotification('Only super admins can delete users', 'error');
        return;
    }

    if (!confirm(`Delete user ${label}?`)) {
        return;
    }

    try {
        await apiRequest(`/users/${userId}`, {
            method: 'DELETE'
        });
        showNotification('User deleted', 'success');
        loadUsers();
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
        loadUsers();
    }
};

function buildTasksUrl() {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    const base = filters.mine ? '/tasks/mine' : '/tasks';
    const query = params.toString();
    return query ? `${base}?${query}` : base;
}

function updateUI() {
    currentUser = getUser();
    
    if (currentUser) {
        userInfo.style.display = 'flex';
        authButtons.style.display = 'none';
        userEmail.textContent = currentUser.email;
        userRole.textContent = currentUser.role;
        userRole.className = `badge ${currentUser.role}`;
        
        if (currentUser.role === 'admin') {
            taskFormSection.style.display = 'block';
            adminHint.style.display = 'none';
            loadUsers();
            superAdminSection.style.display = 'none';
        } else if (currentUser.role === 'superadmin') {
            taskFormSection.style.display = 'block';
            adminHint.style.display = 'none';
            loadUsers();
            superAdminSection.style.display = 'block';
        } else {
            taskFormSection.style.display = 'none';
            adminHint.textContent = 'Log in as an administrator to create tasks. You can change the status of tasks and leave comments.';
            adminHint.style.display = 'inline';
            superAdminSection.style.display = 'none';
        }
    } else {
        userInfo.style.display = 'none';
        authButtons.style.display = 'flex';
        taskFormSection.style.display = 'none';
        adminHint.style.display = 'inline';
        myTasksOnly.checked = false;
        filters.mine = false;
        users = [];
        assigneeSelect.innerHTML = '<option value="">Unassigned</option>';
        superAdminSection.style.display = 'none';
        usersList.innerHTML = '';
    }
    
    loadTasks();
}

function openAuthModal(isRegister = false) {
    authModal.classList.add('show');
    authModal.style.display = 'flex';
    
    if (isRegister) {
        modalTitle.textContent = 'Registration';
        authSubmitBtn.textContent = 'Register';
        registerFields.style.display = 'block';
        firstNameInput.required = true;
        lastNameInput.required = true;
    } else {
        modalTitle.textContent = 'Entrance';
        authSubmitBtn.textContent = 'Login';
        registerFields.style.display = 'none';
        firstNameInput.required = false;
        lastNameInput.required = false;
    }
    
    authError.textContent = '';
    authForm.reset();
}

function closeAuthModal() {
    authModal.classList.remove('show');
    authModal.style.display = 'none';
    authForm.reset();
    authError.textContent = '';
}

async function handleAuth(isRegister = false) {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();

    if (!email || !password || (isRegister && (!firstName || !lastName))) {
        authError.textContent = 'Fill in all fields';
        return;
    }

    if (password.length < 6) {
        authError.textContent = 'The password must be at least 6 characters';
        return;
    }

    try {
        authSubmitBtn.disabled = true;
        authError.textContent = '';

        const body = { email, password };
        if (isRegister) {
            body.firstName = firstName;
            body.lastName = lastName;
        }

        const data = await apiRequest('/auth/' + (isRegister ? 'register' : 'login'), {
            method: 'POST',
            body: JSON.stringify(body)
        });

        setToken(data.token);
        setUser(data.user);
        
        showNotification(
            isRegister ? 'Registration successful!' : 'Login completed!',
            'success'
        );
        
        closeAuthModal();
        updateUI();
    } catch (error) {
        authError.textContent = error.message || 'Authorization error';
    } finally {
        authSubmitBtn.disabled = false;
    }
}

function logout() {
    setToken(null);
    setUser(null);
    currentUser = null;
    editingTaskId = null;
    clearTaskForm();
    updateUI();
    showNotification('You are logged out', 'info');
}

async function loadTasks() {
    try {
        loadingMessage.style.display = 'block';
        emptyMessage.style.display = 'none';
        tasksList.innerHTML = '';

        const data = await apiRequest(buildTasksUrl());
        tasks = Array.isArray(data) ? data : (data.items || []);
        
        loadingMessage.style.display = 'none';
        
        if (tasks.length === 0) {
            emptyMessage.style.display = 'block';
        } else {
            renderTasks();
        }
    } catch (error) {
        loadingMessage.style.display = 'none';
        showNotification('Error loading tasks: ' + error.message, 'error');
    }
}

function renderTasks() {
    tasksList.innerHTML = '';
    
    tasks.forEach(task => {
        const taskEl = createTaskElement(task);
        tasksList.appendChild(taskEl);
    });
}

function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'task-item';
    div.dataset.taskId = task._id;

    const statusLabels = {
        'todo': 'To do',
        'in_progress': 'In progress',
        'done': 'Done'
    };

    const priorityLabels = {
        'low': 'Low',
        'medium': 'Medium',
        'high': 'High'
    };

    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin');
    const isAuthenticated = !!currentUser;
    const assigneeLabel = task.assignee ? escapeHtml(getUserLabel(task.assignee)) : 'Unassigned';
    const creatorLabel = task.creator ? escapeHtml(getUserLabel(task.creator)) : 'Unknown';
    const dueDateLabel = task.dueDate ? new Date(task.dueDate).toLocaleDateString('ru-RU') : 'No due date';
    const updatedByLabel = task.updatedBy ? escapeHtml(getUserLabel(task.updatedBy)) : creatorLabel;
    const updatedAtLabel = task.updatedAt ? new Date(task.updatedAt).toLocaleString('ru-RU') : new Date(task.createdAt).toLocaleString('ru-RU');
    
    const adminActions = isAdmin ? `
        <div class="task-actions">
            <button class="btn-primary" onclick="editTask('${task._id}')">Edit</button>
            <button class="btn-danger" onclick="deleteTask('${task._id}')">Delete</button>
        </div>
    ` : '';
    
    const statusActions = isAuthenticated ? `
        <div class="status-actions">
            <label>Change status:</label>
            <select class="status-select" onchange="changeTaskStatus('${task._id}', this.value)" data-task-id="${task._id}">
                <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To do</option>
                <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In progress</option>
                <option value="done" ${task.status === 'done' ? 'selected' : ''}>Done</option>
            </select>
        </div>
    ` : '';

    div.innerHTML = `
        <div class="task-header">
            <div>
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-description">${escapeHtml(task.description)}</div>
            </div>
        </div>
        <div class="task-meta">
            <span class="meta-badge status-${task.status}">${statusLabels[task.status]}</span>
            <span class="meta-badge priority-${task.priority}">${priorityLabels[task.priority]}</span>
            <span class="meta-badge">Assignee: ${assigneeLabel}</span>
            <span class="meta-badge">Due: ${dueDateLabel}</span>
        </div>
        ${adminActions}
        ${statusActions}
        <div class="comments-section" id="comments-${task._id}">
            <div class="comments-header">
                <strong>Comments</strong>
                ${isAuthenticated ? `<button class="btn-primary btn-sm" onclick="showCommentForm('${task._id}')">Add</button>` : ''}
            </div>
            <div class="comments-list" id="comments-list-${task._id}">
                <div class="loading">Loading...</div>
            </div>
            ${isAuthenticated ? `
                <form class="comment-form" id="comment-form-${task._id}" style="display: none;" onsubmit="submitComment(event, '${task._id}')">
                    <input type="text" placeholder="Write comment..." required>
                    <button type="submit" class="btn-primary">Submit</button>
                    <button type="button" class="btn-secondary" onclick="hideCommentForm('${task._id}')">Cancel</button>
                </form>
            ` : ''}
        </div>
        <div class="task-footer">
            Created: ${new Date(task.createdAt).toLocaleString('ru-RU')} · By: ${creatorLabel}
            <br>
            Last update: ${updatedAtLabel} · By: ${updatedByLabel}
        </div>
    `;

    loadComments(task._id);

    return div;
}

async function loadComments(taskId) {
    try {
        const comments = await apiRequest(`/comments/task/${taskId}`);
        const commentsList = document.getElementById(`comments-list-${taskId}`);
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<div class="empty-message">No comments</div>';
        } else {
            commentsList.innerHTML = comments.map(comment => `
                <div class="comment-item comment-${comment.author?.role || 'user'}">
                    <div class="comment-content">${escapeHtml(comment.content)}</div>
                    <div class="comment-meta">
                        <span>${comment.author ? escapeHtml(getUserLabel(comment.author)) : 'Unknown'}</span>
                        <span>${new Date(comment.createdAt).toLocaleString('ru-RU')}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        const commentsList = document.getElementById(`comments-list-${taskId}`);
        commentsList.innerHTML = '<div class="error-message">Error loading comments</div>';
    }
}

window.showCommentForm = function(taskId) {
    const form = document.getElementById(`comment-form-${taskId}`);
    form.style.display = 'flex';
    form.querySelector('input').focus();
};

window.hideCommentForm = function(taskId) {
    const form = document.getElementById(`comment-form-${taskId}`);
    form.style.display = 'none';
    form.reset();
};

window.submitComment = async function(event, taskId) {
    event.preventDefault();
    
    if (!currentUser) {
        showNotification('Login to leave a comment', 'error');
        return;
    }

    const form = event.target;
    const input = form.querySelector('input');
    const content = input.value.trim();

    if (!content) {
        showNotification('Enter comment text', 'error');
        return;
    }

    try {
        await apiRequest('/comments', {
            method: 'POST',
            body: JSON.stringify({
                content,
                taskId
            })
        });

        showNotification('Comment added', 'success');
        form.reset();
        hideCommentForm(taskId);
        loadComments(taskId);
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

window.changeTaskStatus = async function(taskId, newStatus) {
    if (!currentUser) {
        showNotification('Login to change task status', 'error');
        loadTasks();
        return;
    }

    try {
        await apiRequest(`/tasks/${taskId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({
                status: newStatus
            })
        });

        showNotification('Task status updated', 'success');
        loadTasks();
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
        loadTasks();
    }
};

function clearTaskForm() {
    editingId.value = '';
    taskForm.reset();
    statusSelect.value = 'todo';
    prioritySelect.value = 'medium';
    assigneeSelect.value = '';
    dueDateInput.value = '';
    submitBtn.textContent = 'Create';
    formTitle.textContent = 'Create task';
    cancelBtn.style.display = 'none';
    editingTaskId = null;
}

window.editTask = function(taskId) {
    if (!currentUser) {
        showNotification('Login to account', 'error');
        return;
    }
    
    if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
        showNotification('Only administrators can edit tasks completely', 'error');
        return;
    }

    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    editingTaskId = taskId;
    editingId.value = taskId;
    titleInput.value = task.title;
    descriptionInput.value = task.description;
    statusSelect.value = task.status;
    prioritySelect.value = task.priority;
    assigneeSelect.value = task.assignee?._id || '';
    dueDateInput.value = task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '';
    
    submitBtn.textContent = 'Save changes';
    formTitle.textContent = 'Edit task';
    cancelBtn.style.display = 'inline-block';
    
    taskFormSection.scrollIntoView({ behavior: 'smooth' });
};

window.deleteTask = async function(taskId) {
    if (!currentUser) {
        showNotification('Login to account', 'error');
        return;
    }
    
    if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
        showNotification('Only administrators can delete tasks', 'error');
        return;
    }

    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    try {
        await apiRequest(`/tasks/${taskId}`, {
            method: 'DELETE'
        });

        showNotification('Task deleted', 'success');
        
        if (editingTaskId === taskId) {
            clearTaskForm();
        }
        
        loadTasks();
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
};

async function handleTaskSubmit(event) {
    event.preventDefault();

    if (!currentUser) {
        showNotification('Login to account', 'error');
        return;
    }
    
    if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
        showNotification('Only administrators can create and edit tasks', 'error');
        return;
    }

    const taskData = {
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        status: statusSelect.value,
        priority: prioritySelect.value
    };

    const assigneeId = assigneeSelect.value;
    if (assigneeId) {
        taskData.assigneeId = assigneeId;
    } else if (editingId.value) {
        taskData.assigneeId = '';
    }

    const dueDateValue = dueDateInput.value;
    if (dueDateValue) {
        taskData.dueDate = dueDateValue;
    } else if (editingId.value) {
        taskData.dueDate = '';
    }

    if (!taskData.title || !taskData.description) {
        showNotification('Fill in all fields', 'error');
        return;
    }

    try {
        submitBtn.disabled = true;

        const isEditing = editingId.value;
        const url = isEditing ? `/tasks/${editingId.value}` : '/tasks';
        const method = isEditing ? 'PUT' : 'POST';

        await apiRequest(url, {
            method,
            body: JSON.stringify(taskData)
        });

        showNotification(
            isEditing ? 'Task updated' : 'Task created',
            'success'
        );

        clearTaskForm();
        loadTasks();
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
    }
}

function applyFilters() {
    filters.search = searchInput.value.trim();
    filters.status = filterStatus.value;
    filters.priority = filterPriority.value;
    filters.mine = myTasksOnly.checked;

    if (filters.mine && !currentUser) {
        showNotification('Login to view assigned tasks', 'error');
        myTasksOnly.checked = false;
        filters.mine = false;
    }

    loadTasks();
}

function resetFiltersForm() {
    searchInput.value = '';
    filterStatus.value = '';
    filterPriority.value = '';
    myTasksOnly.checked = false;
    filters.search = '';
    filters.status = '';
    filters.priority = '';
    filters.mine = false;
    loadTasks();
}

loginBtn.addEventListener('click', () => openAuthModal(false));
registerBtn.addEventListener('click', () => openAuthModal(true));
logoutBtn.addEventListener('click', logout);
closeModal.addEventListener('click', closeAuthModal);

authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const isRegister = registerFields.style.display !== 'none';
    handleAuth(isRegister);
});

taskForm.addEventListener('submit', handleTaskSubmit);
cancelBtn.addEventListener('click', clearTaskForm);
filtersForm.addEventListener('submit', (e) => {
    e.preventDefault();
    applyFilters();
});
resetFilters.addEventListener('click', resetFiltersForm);

authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
        closeAuthModal();
    }
});

updateUI();
