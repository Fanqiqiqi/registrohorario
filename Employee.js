let employees = JSON.parse(localStorage.getItem('employees')) || [];
let currentMode = 'add';
let currentEmployeeId = null;

// Debug: Log initial employees array to verify localStorage state
console.log('Initial employees:', employees);

function openModal(mode, employeeId = null) {
    currentMode = mode;
    currentEmployeeId = employeeId;
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('employeeForm');
    const imagePreview = document.getElementById('imagePreview');
    const noImageText = document.getElementById('noImageText');
    const saveButton = document.getElementById('saveButton');

    form.reset();
    imagePreview.style.display = 'none';
    noImageText.style.display = 'block';

    if (mode === 'edit' && employeeId) {
        const employee = employees.find(emp => emp.id === employeeId);
        if (employee) {
            modalTitle.textContent = 'Editar Empleado';
            document.getElementById('employeeName').value = employee.name;
            document.getElementById('firstSurname').value = employee.firstSurname;
            document.getElementById('secondSurname').value = employee.secondSurname || '';
            document.getElementById('employeeId').value = employee.id;
            document.getElementById('insurance').value = employee.insurance;
            document.getElementById('birthDay').value = employee.birthDay;
            document.getElementById('birthMonth').value = employee.birthMonth;
            document.getElementById('birthYear').value = employee.birthYear;
            if (employee.imageBase64) {
                imagePreview.src = employee.imageBase64;
                imagePreview.style.display = 'block';
                noImageText.style.display = 'none';
            }
            saveButton.textContent = 'Actualizar';
        }
    } else {
        modalTitle.textContent = 'Agregar Nuevo Empleado';
        saveButton.textContent = 'Guardar';
    }

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    currentMode = 'add';
    currentEmployeeId = null;
}

function saveEmployee(event) {
    event.preventDefault();
    const name = document.getElementById('employeeName').value.trim();
    const firstSurname = document.getElementById('firstSurname').value.trim();
    const secondSurname = document.getElementById('secondSurname').value.trim();
    const id = document.getElementById('employeeId').value.trim();
    const insurance = document.getElementById('insurance').value.trim();
    const birthDay = parseInt(document.getElementById('birthDay').value);
    const birthMonth = parseInt(document.getElementById('birthMonth').value);
    const birthYear = parseInt(document.getElementById('birthYear').value);
    const imageFile = document.getElementById('employeeImage').files[0];

    // Debug: Log input values and employees array
    console.log('Saving employee with ID:', id);
    console.log('Current employees:', employees);

    if (!name) {
        alert('¡Por favor ingresa el nombre!');
        return;
    }
    if (!firstSurname) {
        alert('¡Por favor ingresa el primer apellido!');
        return;
    }
    if (!id) {
        alert('¡Por favor ingresa el número de identificación!');
        return;
    }
    if (!insurance) {
        alert('¡Por favor ingresa el número de seguro!');
        return;
    }
    if (!birthDay || birthDay < 1 || birthDay > 31) {
        alert('¡Por favor ingresa un día válido (1-31)!');
        return;
    }
    if (!birthMonth || birthMonth < 1 || birthMonth > 12) {
        alert('¡Por favor ingresa un mes válido (1-12)!');
        return;
    }
    if (!birthYear || birthYear < 1900 || birthYear > 2025) {
        alert('¡Por favor ingresa un año válido (1900-2025)!');
        return;
    }

    const employee = { 
        name, 
        firstSurname, 
        secondSurname, 
        id, 
        insurance, 
        birthDay, 
        birthMonth, 
        birthYear 
    };

    if (currentMode === 'add') {
        // Check for duplicate ID
        if (employees.some(emp => emp.id === id)) {
            alert('¡El número de identificación ya existe!');
            console.log('Duplicate ID found:', id);
            return;
        }
    } else if (currentMode === 'edit') {
        // Allow same ID for the current employee being edited
        if (employees.some(emp => emp.id === id && emp.id !== currentEmployeeId)) {
            alert('¡El número de identificación ya existe!');
            console.log('Duplicate ID found during edit:', id);
            return;
        }
    }

    // Handle image as Base64
    const handleImage = (imageBase64 = '') => {
        employee.imageBase64 = imageBase64;
        if (currentMode === 'edit') {
            const index = employees.findIndex(emp => emp.id === currentEmployeeId);
            employees[index] = employee;
        } else {
            employees.push(employee);
        }
        saveAndRender();
        closeModal();
    };

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            handleImage(e.target.result);
        };
        reader.onerror = function(e) {
            alert('Error al leer la imagen: ' + e.message);
        };
        reader.readAsDataURL(imageFile);
    } else {
        // Preserve existing image in edit mode
        if (currentMode === 'edit') {
            const existingEmployee = employees.find(emp => emp.id === currentEmployeeId);
            handleImage(existingEmployee.imageBase64 || '');
        } else {
            handleImage('');
        }
    }
}

function removeEmployee(id) {
    if (confirm('¿ estás seguro de que deseas eliminar este empleado?')) {
        employees = employees.filter(employee => employee.id !== id);
        saveAndRender();
    }
}

function saveAndRender() {
    try {
        localStorage.setItem('employees', JSON.stringify(employees));
    } catch (e) {
        alert('Error al guardar en localStorage: ' + e.message);
        return;
    }
    renderTable();
}

function renderTable() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    employees.forEach(employee => {
        const row = document.createElement('tr');
        const birthDate = `${employee.birthDay.toString().padStart(2, '0')}/${employee.birthMonth.toString().padStart(2, '0')}/${employee.birthYear}`;
        row.innerHTML = `
            <td><img src="${employee.imageBase64 || 'https://via.placeholder.com/50'}" alt="Foto" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
            <td>${employee.name}</td>
            <td>${employee.firstSurname}</td>
            <td>${employee.secondSurname || '-'}</td>
            <td>${employee.id}</td>
            <td>${employee.insurance}</td>
            <td>${birthDate}</td>
            <td>
                <button class="action-btn edit-btn" onclick="openModal('edit', '${employee.id}')"><i class="fas fa-pencil-alt"></i></button>
                <button class="action-btn remove-btn" onclick="removeEmployee('${employee.id}')"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Preview image when selected
document.addEventListener('DOMContentLoaded', () => {
    // Debug: Clear localStorage for testing (remove this in production)
    // localStorage.removeItem('employees');
    // employees = [];
    // console.log('localStorage cleared, employees:', employees);

    const employeeImageInput = document.getElementById('employeeImage');
    if (employeeImageInput) {
        employeeImageInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            const preview = document.getElementById('imagePreview');
            const noImageText = document.getElementById('noImageText');
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                    noImageText.style.display = 'none';
                };
                reader.readAsDataURL(file);
            } else {
                preview.style.display = 'none';
                noImageText.style.display = 'block';
            }
        });
    }

    const form = document.getElementById('employeeForm');
    if (form) {
        form.addEventListener('submit', saveEmployee);
    }

    renderTable();
});