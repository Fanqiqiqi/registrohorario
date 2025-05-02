let vacations = JSON.parse(localStorage.getItem('vacationRecords')) || [];
let currentMode = 'add';
let currentVacationId = null;

function populateEmployeeDropdown() {
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    const select = document.getElementById('employeeSelect');
    const filterSelect = document.getElementById('filterEmployeeSelect');
    select.innerHTML = '<option value="">Seleccionar Empleado</option>';
    filterSelect.innerHTML = '<option value="">Todos los Empleados</option>';
    employees.forEach(emp => {
        const fullName = `${emp.name} ${emp.firstSurname}${emp.secondSurname ? ' ' + emp.secondSurname : ''}`;
        const option = document.createElement('option');
        option.value = fullName;
        option.text = fullName;
        select.appendChild(option);
        filterSelect.appendChild(option.cloneNode(true));
    });
}

function openModal(mode, vacationId = null) {
    currentMode = mode;
    currentVacationId = vacationId;
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('vacationForm');
    const saveButton = document.getElementById('saveButton');

    form.reset();
    modalTitle.textContent = mode === 'edit' ? 'Editar Vacación' : 'Registrar Nueva Vacación';
    saveButton.textContent = mode === 'edit' ? 'Actualizar' : 'Guardar';

    if (mode === 'edit' && vacationId) {
        const vacation = vacations.find(vac => vac.id === vacationId);
        if (vacation) {
            document.getElementById('employeeSelect').value = vacation.employee;
            document.getElementById('leaveType').value = vacation.leaveType;
            document.getElementById('startDate').value = vacation.startDate;
            document.getElementById('endDate').value = vacation.endDate;
            document.getElementById('notes').value = vacation.notes || '';
            document.getElementById('status').value = vacation.status;
        }
    }

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    currentMode = 'add';
    currentVacationId = null;
}

function calculateDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start + 24 * 60 * 60 * 1000; // Include end date
    if (isNaN(diffMs) || diffMs < 0) {
        return 'Fechas inválidas';
    }
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return `${days} día${days !== 1 ? 's' : ''}`;
}

function saveVacation(event) {
    event.preventDefault();
    const employee = document.getElementById('employeeSelect').value;
    const leaveType = document.getElementById('leaveType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const notes = document.getElementById('notes').value.trim();
    const status = document.getElementById('status').value;

    if (!employee) {
        alert('¡Por favor selecciona un empleado!');
        return;
    }
    if (!leaveType) {
        alert('¡Por favor selecciona un tipo de permiso!');
        return;
    }
    if (!startDate || !endDate) {
        alert('¡Por favor ingresa fechas válidas!');
        return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
        alert('¡La fecha de fin no puede ser anterior a la fecha de inicio!');
        return;
    }

    const vacation = {
        id: currentMode === 'edit' ? currentVacationId : Date.now().toString(),
        employee,
        leaveType,
        startDate,
        endDate,
        duration: calculateDuration(startDate, endDate),
        notes,
        status
    };

    if (currentMode === 'edit') {
        const index = vacations.findIndex(vac => vac.id === currentVacationId);
        vacations[index] = vacation;
    } else {
        vacations.push(vacation);
    }

    saveAndRender();
    closeModal();
}

function removeVacation(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este registro de vacación?')) {
        vacations = vacations.filter(vac => vac.id !== id);
        saveAndRender();
    }
}

function saveAndRender() {
    try {
        localStorage.setItem('vacationRecords', JSON.stringify(vacations));
    } catch (e) {
        alert('Error al guardar en localStorage: ' + e.message);
        return;
    }
    renderTable();
}

function renderTable(filteredVacations = vacations) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    filteredVacations.forEach(vacation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vacation.employee}</td>
            <td>${vacation.leaveType}</td>
            <td>${formatToDDMMYYYY(vacation.startDate)}</td>
            <td>${formatToDDMMYYYY(vacation.endDate)}</td>
            <td>${vacation.duration}</td>
            <td>${vacation.status}</td>
            <td>${vacation.notes || '-'}</td>
            <td>
                <button class="action-btn edit-btn" onclick="openModal('edit', '${vacation.id}')"><i class="fas fa-pencil-alt"></i></button>
                <button class="action-btn remove-btn" onclick="removeVacation('${vacation.id}')"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function formatToDDMMYYYY(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

function toggleFilterSidebar() {
    const sidebar = document.getElementById('filterSidebar');
    sidebar.classList.toggle('active');
}

function applyFilter() {
    const employee = document.getElementById('filterEmployeeSelect').value;
    const leaveType = document.getElementById('filterLeaveType').value;
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;

    let filteredVacations = vacations;

    if (employee) {
        filteredVacations = filteredVacations.filter(vac => vac.employee === employee);
    }
    if (leaveType) {
        filteredVacations = filteredVacations.filter(vac => vac.leaveType === leaveType);
    }
    if (startDate || endDate) {
        filteredVacations = filteredVacations.filter(vac => {
            const vacStart = new Date(vac.startDate);
            const vacEnd = new Date(vac.endDate);
            const filterStart = startDate ? new Date(startDate) : new Date('1970-01-01');
            const filterEnd = endDate ? new Date(endDate) : new Date('9999-12-31');
            return vacStart <= filterEnd && vacEnd >= filterStart;
        });
    }

    renderTable(filteredVacations);
}

function resetFilter() {
    document.getElementById('filterEmployeeSelect').value = '';
    document.getElementById('filterLeaveType').value = '';
    document.getElementById('filterStartDate').value = '';
    document.getElementById('filterEndDate').value = '';
    renderTable();
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('vacationForm');
    if (form) {
        form.addEventListener('submit', saveVacation);
    }
    populateEmployeeDropdown();
    renderTable();
});