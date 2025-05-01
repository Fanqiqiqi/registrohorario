let records = JSON.parse(localStorage.getItem('timeRecords')) || [];
let currentFilteredRecords = records; // Track filtered records

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

// 验证 DD/MM/YYYY 格式的日期
function isValidDateFormat(dateStr) {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regex.test(dateStr)) return false;
    const [, day, month, year] = dateStr.match(regex);
    const date = new Date(`${year}-${month}-${day}`);
    return date.getDate() == day && date.getMonth() + 1 == month && date.getFullYear() == year;
}

// 将 DD/MM/YYYY 转换为 YYYY-MM-DD
function convertToISODate(dateStr) {
    if (!isValidDateFormat(dateStr)) return null;
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// 将 YYYY-MM-DD 转换为 DD/MM/YYYY
function formatToDDMMYYYY(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

function checkIn() {
    const employee = document.getElementById('employeeSelect').value;
    const dateInput = document.getElementById('dateInput').value;
    const dateStr = formatToDDMMYYYY(dateInput);
    if (!employee) {
        alert('¡Por favor selecciona un empleado!');
        return;
    }
    if (!dateInput || !isValidDateFormat(dateStr)) {
        alert('¡Por favor introduce una fecha válida en formato DD/MM/YYYY!');
        return;
    }

    // 检查是否有未完成（没有 checkOut）的 checkIn 记录
    const hasPendingCheckIn = records.some(
        r => r.type === 'checkIn' && 
             r.employee === employee && 
             r.date === dateInput && 
             !r.hasCheckOut
    );

    if (hasPendingCheckIn) {
        alert('¡Este empleado ya tiene un registro de entrada pendiente para esta fecha! Por favor registra la salida primero.');
        return;
    }

    const now = new Date();
    const record = {
        type: 'checkIn',
        employee,
        date: dateInput,
        time: now.toLocaleString('es-ES'),
        timestamp: now.toISOString(),
        recordId: Date.now()
    };

    records.push(record);
    saveAndRender();
}

function checkOut() {
    const employee = document.getElementById('employeeSelect').value;
    const dateInput = document.getElementById('dateInput').value;
    const dateStr = formatToDDMMYYYY(dateInput);
    if (!employee) {
        alert('¡Por favor selecciona un empleado!');
        return;
    }
    if (!dateInput || !isValidDateFormat(dateStr)) {
        alert('¡Por favor introduce una fecha válida en formato DD/MM/YYYY!');
        return;
    }

    // 检查是否存在任何 checkIn 记录
    const hasCheckIn = records.some(
        r => r.type === 'checkIn' && 
             r.employee === employee && 
             r.date === dateInput
    );

    if (!hasCheckIn) {
        alert('¡Este empleado no tiene un registro de entrada para esta fecha! Por favor registra la entrada primero.');
        return;
    }

    // 检查是否存在未完成的 checkIn 记录
    const lastCheckIn = records
        .filter(r => r.type === 'checkIn' && r.employee === employee && r.date === dateInput && !r.hasCheckOut)
        .pop();

    if (!lastCheckIn) {
        alert('¡Este empleado no tiene un registro de entrada pendiente para esta fecha! Todas las entradas ya tienen salida registrada.');
        return;
    }

    const now = new Date();
    const checkOutRecord = {
        type: 'checkOut',
        employee,
        date: dateInput,
        time: now.toLocaleString('es-ES'),
        timestamp: now.toISOString(),
        duration: calculateDuration(lastCheckIn.timestamp, now.toISOString()),
        recordId: lastCheckIn.recordId
    };

    lastCheckIn.hasCheckOut = true;
    records.push(checkOutRecord);
    saveAndRender();
}

function calculateDuration(checkInTimestamp, checkOutTimestamp) {
    const start = new Date(checkInTimestamp);
    const end = new Date(checkOutTimestamp);
    const diffMs = end - start;
    if (isNaN(diffMs)) {
        return 'Error en cálculo';
    }
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    return `${hours} horas ${minutes} minutos ${seconds} segundos`;
}

function saveAndRender() {
    localStorage.setItem('timeRecords', JSON.stringify(records));
    renderTable();
}

function renderTable(filteredRecords = records) {
    currentFilteredRecords = filteredRecords; // Update filtered records
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    const groupedRecords = {};

    filteredRecords.forEach(record => {
        const key = `${record.employee}-${record.date}-${record.recordId}`;
        if (!groupedRecords[key]) {
            groupedRecords[key] = [];
        }
        groupedRecords[key].push(record);
    });

    Object.values(groupedRecords).forEach(group => {
        const checkIn = group.find(r => r.type === 'checkIn');
        const checkOut = group.find(r => r.type === 'checkOut');
        if (checkIn) {
            const row = document.createElement('tr');
            const formattedDate = formatToDDMMYYYY(checkIn.date);
            const checkInTime = checkIn.time.split(', ')[1] || checkIn.time;
            const checkOutTime = checkOut ? (checkOut.time.split(', ')[1] || checkOut.time) : '-';
            const duration = checkOut ? checkOut.duration : '-';
            row.innerHTML = `
                <td>${checkIn.employee}</td>
                <td>${formattedDate}</td>
                <td>${checkInTime}</td>
                <td>${checkOutTime}</td>
                <td>${duration}</td>
            `;
            tableBody.appendChild(row);
        }
    });
}

function toggleFilterSidebar() {
    const sidebar = document.getElementById('filterSidebar');
    sidebar.classList.toggle('active');
}

function applyFilter() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const employee = document.getElementById('filterEmployeeSelect').value;

    let filteredRecords = records;

    if (startDate || endDate) {
        const startDateStr = startDate ? formatToDDMMYYYY(startDate) : '';
        const endDateStr = endDate ? formatToDDMMYYYY(endDate) : '';
        if (startDate && !isValidDateFormat(startDateStr)) {
            alert('¡Por favor introduce una fecha inicial válida en formato DD/MM/YYYY!');
            return;
        }
        if (endDate && !isValidDateFormat(endDateStr)) {
            alert('¡Por favor introduce una fecha final válida en formato DD/MM/YYYY!');
            return;
        }

        filteredRecords = filteredRecords.filter(record => {
            const recordDate = new Date(record.date);
            const start = startDate ? new Date(startDate) : new Date('1970-01-01');
            const end = endDate ? new Date(endDate) : new Date('9999-12-31');
            return recordDate >= start && recordDate <= end;
        });
    }

    if (employee) {
        filteredRecords = filteredRecords.filter(record => record.employee === employee);
    }

    renderTable(filteredRecords);
}

function resetFilter() {
    const today = new Date();
    const defaultDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    document.getElementById('startDate').value = defaultDate;
    document.getElementById('endDate').value = defaultDate;
    document.getElementById('filterEmployeeSelect').value = '';
    renderTable();
}

function downloadPDF() {
    console.log('downloadPDF function called'); // Debug log
    if (!window.jspdf || !window.jspdf.jsPDF) {
        console.error('jsPDF is not loaded');
        alert('Error: No se pudo cargar la biblioteca para generar PDF. Por favor, intenta de nuevo.');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const employees = JSON.parse(localStorage.getItem('employees')) || [];
        let yOffset = 20;

        // Header
        doc.setFontSize(16);
        doc.text('Informe de Registro de Tiempo', 105, yOffset, { align: 'center' });
        yOffset += 10;
        doc.setFontSize(12);
        doc.text(`Fecha de Generación: ${new Date().toLocaleDateString('es-ES')}`, 105, yOffset, { align: 'center' });
        yOffset += 20;

        // Group records by employee
        const groupedByEmployee = {};
        currentFilteredRecords.forEach(record => {
            const key = `${record.employee}-${record.date}-${record.recordId}`;
            if (!groupedByEmployee[record.employee]) {
                groupedByEmployee[record.employee] = [];
            }
            groupedByEmployee[record.employee].push(record);
        });

        // Generate PDF content for each employee
        for (const [employeeName, records] of Object.entries(groupedByEmployee)) {
            const employee = employees.find(emp => {
                const fullName = `${emp.name} ${emp.firstSurname}${emp.secondSurname ? ' ' + emp.secondSurname : ''}`;
                return fullName === employeeName;
            });

            // Employee Details
            doc.setFontSize(14);
            doc.text(`Nombre: ${employeeName}`, 10, yOffset);
            yOffset += 7;
            doc.setFontSize(12);
            doc.text(`Número de Identificación: ${employee ? employee.id : '-'}`, 10, yOffset);
            yOffset += 7;
            doc.text(`Número de Seguro: ${employee ? employee.insurance : '-'}`, 10, yOffset);
            yOffset += 10;

            // Table Header
            const headers = ['Fecha', 'Hora de Entrada', 'Hora de Salida', 'Duración'];
            const data = [];
            const groupedRecords = {};
            records.forEach(record => {
                const key = `${record.employee}-${record.date}-${record.recordId}`;
                if (!groupedRecords[key]) {
                    groupedRecords[key] = [];
                }
                groupedRecords[key].push(record);
            });

            Object.values(groupedRecords).forEach(group => {
                const checkIn = group.find(r => r.type === 'checkIn');
                const checkOut = group.find(r => r.type === 'checkOut');
                if (checkIn) {
                    const formattedDate = formatToDDMMYYYY(checkIn.date);
                    const checkInTime = checkIn.time.split(', ')[1] || checkIn.time;
                    const checkOutTime = checkOut ? (checkOut.time.split(', ')[1] || checkOut.time) : '-';
                    const duration = checkOut ? checkOut.duration : '-';
                    data.push([formattedDate, checkInTime, checkOutTime, duration]);
                }
            });

            // Render Table
            if (typeof doc.autoTable === 'function') {
                doc.autoTable({
                    head: [headers],
                    body: data,
                    startY: yOffset,
                    Khoa: { fontSize: 10 },
                    headStyles: { fillColor: [0, 123, 255] },
                    margin: { top: 10 }
                });
                yOffset = doc.lastAutoTable.finalY + 20;
            } else {
                console.error('autoTable plugin is not loaded');
                doc.text('Error: No se pudo generar la tabla.', 10, yOffset);
                yOffset += 10;
            }

            // Add page break if not the last employee
            if (Object.keys(groupedByEmployee).pop() !== employeeName) {
                doc.addPage();
                yOffset = 20;
            }
        }

        // Save PDF
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        doc.save(`TimeRecords_${timestamp}.pdf`);
        console.log('PDF generated and saved');
    } catch (error) {
        console.error('Error in downloadPDF:', error);
        alert('Error al generar el PDF: ' + error.message);
    }
}

function printRecords() {
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    const tableBody = document.getElementById('tableBody');
    const rows = tableBody.getElementsByTagName('tr');
    let htmlContent = `
        <html>
        <head>
            <title>Informe de Registro de Tiempo</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    color: #333;
                }
                .print-container {
                    max-width: 800px;
                    margin: 0 auto;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                    color: #2c3e50;
                }
                .employee-details {
                    margin-bottom: 20px;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                .employee-details p {
                    margin: 5px 0;
                    font-size: 16px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th, td {
                    padding: 12px;
                    text-align: left;
                    border: 1px solid #ddd;
                }
                th {
                    background-color: #007bff;
                    color: white;
                    font-weight: bold;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                @media print {
                    body {
                        margin: 0;
                    }
                    .print-container {
                        width: 100%;
                    }
                    table {
                        page-break-inside: auto;
                    }
                    tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-container">
                <div class="header">
                    <h1>Informe de Registro de Tiempo</h1>
                    <p>Fecha de Generación: ${new Date().toLocaleDateString('es-ES')}</p>
                </div>
    `;

    const groupedByEmployee = {};
    Array.from(rows).forEach(row => {
        const cells = row.getElementsByTagName('td');
        const employeeName = cells[0].textContent;
        if (!groupedByEmployee[employeeName]) {
            groupedByEmployee[employeeName] = [];
        }
        groupedByEmployee[employeeName].push({
            date: cells[1].textContent,
            checkIn: cells[2].textContent,
            checkOut: cells[3].textContent,
            duration: cells[4].textContent
        });
    });

    for (const [employeeName, records] of Object.entries(groupedByEmployee)) {
        const employee = employees.find(emp => {
            const fullName = `${emp.name} ${emp.firstSurname}${emp.secondSurname ? ' ' + emp.secondSurname : ''}`;
            return fullName === employeeName;
        });

        htmlContent += `
            <div class="employee-details">
                <p><strong>Nombre:</strong> ${employeeName}</p>
                <p><strong>Número de Identificación:</strong> ${employee ? employee.id : '-'}</p>
                <p><strong>Número de Seguro:</strong> ${employee ? employee.insurance : '-'}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Hora de Entrada</th>
                        <th>Hora de Salida</th>
                        <th>Duración del Trabajo</th>
                    </tr>
                </thead>
                <tbody>
        `;

        records.forEach(record => {
            htmlContent += `
                <tr>
                    <td>${record.date}</td>
                    <td>${record.checkIn}</td>
                    <td>${record.checkOut}</td>
                    <td>${record.duration}</td>
                </tr>
            `;
        });

        htmlContent += `
                </tbody>
            </table>
            <div style="page-break-after: always;"></div>
        `;
    }

    htmlContent += `
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

// Set default date to today in YYYY-MM-DD format for all date inputs
const today = new Date();
const defaultDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
document.getElementById('dateInput').value = defaultDate;
document.getElementById('startDate').value = defaultDate;
document.getElementById('endDate').value = defaultDate;

// Initialize rendering and dropdown
renderTable();
populateEmployeeDropdown();