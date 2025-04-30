let employees = JSON.parse(localStorage.getItem('employees')) || [];

function openModal() {
    document.getElementById('modal').style.display = 'flex';
    document.getElementById('employeeForm').reset();
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function addEmployee() {
    const name = document.getElementById('employeeName').value.trim();
    const firstSurname = document.getElementById('firstSurname').value.trim();
    const secondSurname = document.getElementById('secondSurname').value.trim();
    const id = document.getElementById('employeeId').value.trim();
    const insurance = document.getElementById('insurance').value.trim();
    const birthDay = parseInt(document.getElementById('birthDay').value);
    const birthMonth = parseInt(document.getElementById('birthMonth').value);
    const birthYear = parseInt(document.getElementById('birthYear').value);

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
    if (employees.some(employee => employee.id === id)) {
        alert('¡El número de identificación ya existe!');
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

    const employee = { name, firstSurname, secondSurname, id, insurance, birthDay, birthMonth, birthYear };
    employees.push(employee);
    saveAndRender();
    alert('¡Empleado guardado exitosamente!');
    closeModal();
}

function removeEmployee(id) {
    employees = employees.filter(employee => employee.id !== id);
    saveAndRender();
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
            <td>${employee.name}</td>
            <td>${employee.firstSurname}</td>
            <td>${employee.secondSurname || '-'}</td>
            <td>${employee.id}</td>
            <td>${employee.insurance}</td>
            <td>${birthDate}</td>
            <td><button class="remove-btn" onclick="removeEmployee('${employee.id}')">Eliminar</button></td>
        `;
        tableBody.appendChild(row);
    });
}

// Inicializar renderizado de la tabla
renderTable();