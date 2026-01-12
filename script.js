
// --- DOM Elements ---
const dueInput = document.getElementById("dueInput");
const priorityInput = document.getElementById("priorityInput");
const categoryInput = document.getElementById("categoryInput");
const totalTasksEl = document.getElementById("totalTasks");
const completedTasksEl = document.getElementById("completedTasks");
const pendingTasksEl = document.getElementById("pendingTasks");
const clearAllBtn = document.getElementById("clearAllBtn");
const searchInput = document.getElementById("searchInput");
const filterBtns = document.querySelectorAll(".filter-btn");
const darkModeToggle = document.getElementById("darkModeToggle");

let tasks = [];
let filter = "all";
let searchText = "";
let dragSrcId = null;

// --- Clock ---
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockDisplay.textContent = `${hours}:${minutes}:${seconds}`;
}
updateClock();
setInterval(updateClock, 1000);

// --- Add Task ---
addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") addTask();
});
dueInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") addTask();
});

function addTask() {
    const text = taskInput.value.trim();
    const due = dueInput.value ? dueInput.value : null;
    const priority = priorityInput.value;
    const category = categoryInput.value;
    if (text === "") {
        alert("Please enter a task!");
        return;
    }
    const newTask = {
        id: Date.now(),
        text,
        completed: false,
        due,
        priority,
        category
    };
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    taskInput.value = "";
    dueInput.value = "";
    priorityInput.value = "Medium";
    categoryInput.value = "Personal";
    taskInput.focus();
}

// --- Render Tasks ---
function renderTasks() {
    taskList.innerHTML = "";
    let filtered = tasks.filter(task => {
        if (searchText && !task.text.toLowerCase().includes(searchText.toLowerCase())) return false;
        if (filter === "completed" && !task.completed) return false;
        if (filter === "pending" && task.completed) return false;
        if (filter === "high" && task.priority !== "High") return false;
        return true;
    });
    filtered.forEach((task, idx) => {
        const li = document.createElement("li");
        li.className = (task.completed ? "completed " : "") + `priority-${task.priority}`;
        li.setAttribute("data-id", task.id);
        li.setAttribute("draggable", "true");

        // Drag events
        li.ondragstart = function(e) {
            dragSrcId = task.id;
            li.classList.add("dragging");
        };
        li.ondragend = function(e) {
            li.classList.remove("dragging");
        };
        li.ondragover = function(e) {
            e.preventDefault();
            li.classList.add("drag-over");
        };
        li.ondragleave = function(e) {
            li.classList.remove("drag-over");
        };
        li.ondrop = function(e) {
            e.preventDefault();
            li.classList.remove("drag-over");
            if (dragSrcId && dragSrcId !== task.id) {
                reorderTasks(dragSrcId, task.id);
            }
        };

        // Task text span (for editing)
        const textSpan = document.createElement("span");
        textSpan.textContent = task.text;
        textSpan.className = "task-text";
        li.appendChild(textSpan);

        // Category label
        const catLabel = document.createElement("span");
        catLabel.className = "category-label";
        catLabel.textContent = task.category;
        li.appendChild(catLabel);

        // Due date label
        if (task.due) {
            const dueLabel = document.createElement("span");
            dueLabel.className = "due-label";
            dueLabel.textContent = formatDueDate(task.due);
            li.appendChild(dueLabel);
        }

        // Edit button
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.className = "edit-btn";
        li.appendChild(editBtn);

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "X";
        deleteBtn.className = "delete-btn";
        li.appendChild(deleteBtn);

        // Double-click to edit
        textSpan.ondblclick = function() {
            startEditTask(task.id, textSpan);
        };
        editBtn.onclick = function() {
            startEditTask(task.id, textSpan);
        };

        // Complete toggle
        li.onclick = function(e) {
            if (e.target === deleteBtn || e.target === editBtn || e.target === textSpan) return;
            toggleComplete(task.id);
        };

        // Delete
        deleteBtn.onclick = function(e) {
            e.stopPropagation();
            deleteTask(task.id);
        };

        taskList.appendChild(li);
    });
    updateCounters();
}

function formatDueDate(dt) {
    try {
        const d = new Date(dt);
        return d.toLocaleString();
    } catch {
        return dt;
    }
}

function startEditTask(id, textSpan) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const input = document.createElement("input");
    input.type = "text";
    input.value = task.text;
    input.className = "edit-input";
    textSpan.replaceWith(input);
    input.focus();
    input.select();
    input.onblur = finishEdit;
    input.onkeydown = function(e) {
        if (e.key === "Enter") finishEdit();
        if (e.key === "Escape") cancelEdit();
    };
    function finishEdit() {
        const newText = input.value.trim();
        if (newText) {
            task.text = newText;
            saveTasks();
            renderTasks();
        } else {
            cancelEdit();
        }
    }
    function cancelEdit() {
        renderTasks();
    }
}

function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

function reorderTasks(srcId, destId) {
    const srcIdx = tasks.findIndex(t => t.id === srcId);
    const destIdx = tasks.findIndex(t => t.id === destId);
    if (srcIdx === -1 || destIdx === -1) return;
    const [moved] = tasks.splice(srcIdx, 1);
    tasks.splice(destIdx, 0, moved);
    saveTasks();
    renderTasks();
}

// --- Counters ---
function updateCounters() {
    totalTasksEl.textContent = `Total: ${tasks.length}`;
    const completed = tasks.filter(t => t.completed).length;
    completedTasksEl.textContent = `Completed: ${completed}`;
    pendingTasksEl.textContent = `Pending: ${tasks.length - completed}`;
}

// --- Clear All ---
clearAllBtn.addEventListener("click", function() {
    if (confirm("Are you sure you want to delete all tasks?")) {
        tasks = [];
        saveTasks();
        renderTasks();
    }
});

// --- Search & Filter ---
searchInput.addEventListener("input", function() {
    searchText = searchInput.value;
    renderTasks();
});
filterBtns.forEach(btn => {
    btn.addEventListener("click", function() {
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        filter = btn.getAttribute("data-filter");
        renderTasks();
    });
});

// --- Dark Mode ---
function setDarkMode(on) {
    if (on) {
        document.body.classList.add("dark-mode");
        localStorage.setItem("darkMode", "1");
        darkModeToggle.textContent = "☀️";
    } else {
        document.body.classList.remove("dark-mode");
        localStorage.setItem("darkMode", "0");
        darkModeToggle.textContent = "🌙";
    }
}
darkModeToggle.addEventListener("click", function() {
    setDarkMode(!document.body.classList.contains("dark-mode"));
});
if (localStorage.getItem("darkMode") === "1") setDarkMode(true);

// --- Storage ---
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}
function loadTasks() {
    const data = localStorage.getItem("tasks");
    if (data) {
        try {
            tasks = JSON.parse(data);
        } catch {
            tasks = [];
        }
    } else {
        tasks = [];
    }
}

// --- Initial load ---
loadTasks();
renderTasks();
// Set default filter button
filterBtns[0].classList.add("active");
