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
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const roleSelect = document.getElementById('roleSelect');
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
const assigneeInput = document.getElementById('assigneeInput');
const dueDateInput = document.getElementById('dueDateInput');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const formTitle = document.getElementById('formTitle');
const tasksList = document.getElementById('tasksList');
const loadingMessage = document.getElementById('loadingMessage');
const emptyMessage = document.getElementById('emptyMessage');
const adminHint = document.getElementById('adminHint');
const notification = document.getElementById('notification');
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
        } else {
            taskFormSection.style.display = 'none';
            adminHint.textContent = 'Log in as an administrator to create tasks. You can change the status of tasks and leave comments.';
            adminHint.style.display = 'inline';
        }
    } else {
        userInfo.style.display = 'none';
        authButtons.style.display = 'flex';
        taskFormSection.style.display = 'none';
        adminHint.style.display = 'inline';
        myTasksOnly.checked = false;
        filters.mine = false;
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
    } else {
        modalTitle.textContent = 'Entrance';
        authSubmitBtn.textContent = 'Login';
        registerFields.style.display = 'none';
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
    const role = roleSelect.value;

    if (!email || !password) {
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
            body.role = role;
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

    const isAdmin = currentUser && currentUser.role === 'admin';
    const isAuthenticated = !!currentUser;
    const assigneeLabel = task.assignee?.email ? escapeHtml(task.assignee.email) : 'Unassigned';
    const creatorLabel = task.creator?.email ? escapeHtml(task.creator.email) : 'Unknown';
    const dueDateLabel = task.dueDate ? new Date(task.dueDate).toLocaleDateString('ru-RU') : 'No due date';
    
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
                <div class="comment-item">
                    <div class="comment-content">${escapeHtml(comment.content)}</div>
                    <div class="comment-meta">
                        <span>${comment.author?.email || 'Unknown'}</span>
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
    assigneeInput.value = '';
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
    
    if (currentUser.role !== 'admin') {
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
    assigneeInput.value = task.assignee?.email || '';
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
    
    if (currentUser.role !== 'admin') {
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
    
    if (currentUser.role !== 'admin') {
        showNotification('Only administrators can create and edit tasks', 'error');
        return;
    }

    const taskData = {
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        status: statusSelect.value,
        priority: prioritySelect.value
    };

    const assigneeEmail = assigneeInput.value.trim();
    if (assigneeEmail) {
        taskData.assigneeEmail = assigneeEmail;
    } else if (editingId.value) {
        taskData.assigneeEmail = '';
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
