// Configuración inicial
const porcentajes = {
    'Gastos operativos': 0.30,
    'Inversión y mejoras': 0.15,
    'Deudas o proveedores': 0.05,
    'Sueldos': 0.10,
    'Socio 1': 0.20,
    'Socio 2': 0.20
};

let ultimoResultado = [];
let chartInstance = null;
let registrosAcumulados = JSON.parse(localStorage.getItem('registrosAcumulados')) || [];

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el elemento existe antes de modificarlo
    const fechaElement = document.getElementById("fechaActual");
    if (fechaElement) {
        fechaElement.textContent = `Fecha: ${new Date().toLocaleDateString()}`;
    }
    
    cargarDatosPrevios();
    
    // Configurar event listeners para los botones
    document.getElementById('btnCalcular')?.addEventListener('click', calcular);
    document.getElementById('btnPDF')?.addEventListener('click', descargarPDF);
    document.getElementById('btnExcel')?.addEventListener('click', descargarExcel);
});

// Función para formatear moneda
function formatoMoneda(valor) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(valor);
}

// Cargar datos anteriores
function cargarDatosPrevios() {
    const datos = localStorage.getItem('ultimoCalculo');
    if (datos) {
        try {
            const { efectivo, tarjeta, empleados } = JSON.parse(datos);
            document.getElementById('efectivo').value = efectivo || '';
            document.getElementById('tarjeta').value = tarjeta || '';
            document.getElementById('empleados').value = empleados || '';
        } catch (e) {
            console.error("Error al cargar datos previos:", e);
        }
    }
}

// Función principal de cálculo
function calcular() {
    // Verificar si el elemento de resultados existe
    const resultadosDiv = document.getElementById("resultados");
    if (!resultadosDiv) {
        console.error("Elemento 'resultados' no encontrado");
        return;
    }

    // Obtener valores de los inputs
    const efectivo = parseFloat(document.getElementById("efectivo")?.value) || 0;
    const tarjeta = parseFloat(document.getElementById("tarjeta")?.value) || 0;
    const empleados = parseInt(document.getElementById("empleados")?.value) || 0;

    // Limpiar resultados y estilos de error
    resultadosDiv.innerHTML = "";
    document.querySelectorAll("input").forEach(input => input.classList.remove("border-red-500"));

    // Validación de inputs
    const errores = [];
    if (isNaN(efectivo) || efectivo < 0) errores.push("Efectivo");
    if (isNaN(tarjeta) || tarjeta < 0) errores.push("Tarjeta");
    if (isNaN(empleados) || empleados <= 0) errores.push("Empleados");

    if (errores.length > 0) {
        resultadosDiv.innerHTML = `
            <div class="p-3 bg-red-100 text-red-700 rounded-lg">
                <p class="font-semibold">Error en los siguientes campos:</p>
                <ul class="list-disc pl-5 mt-1">
                    ${errores.map(e => `<li>${e}</li>`).join("")}
                </ul>
            </div>
        `;
        errores.forEach(campo => {
            const id = campo.toLowerCase();
            document.getElementById(id)?.classList.add("border-red-500");
        });
        return;
    }

    // Calcular venta total
    const venta = efectivo + tarjeta;
    ultimoResultado = [];

    // Mostrar resultados
    resultadosDiv.innerHTML += `
        <div class="p-4 bg-gray-50 rounded-lg mb-4">
            <div class="flex justify-between font-semibold text-lg mb-1">
                <span>Total Efectivo</span>
                <span>${formatoMoneda(efectivo)}</span>
            </div>
            <div class="flex justify-between font-semibold text-lg mb-1">
                <span>Total Tarjeta</span>
                <span>${formatoMoneda(tarjeta)}</span>
            </div>
            <div class="flex justify-between font-semibold text-lg text-green-600 mt-2 pt-2 border-t">
                <span>Venta Total</span>
                <span>${formatoMoneda(venta)}</span>
            </div>
        </div>
        <h3 class="font-bold text-lg mt-4 mb-2">Distribución:</h3>
    `;

    // Calcular distribución
    for (const [categoria, porcentaje] of Object.entries(porcentajes)) {
        let monto = venta * porcentaje;
        if (categoria === 'Sueldos') {
            resultadosDiv.innerHTML += `
                <div class="flex justify-between font-semibold bg-gray-50 p-2 rounded-lg">
                    <span>${categoria} (${(porcentaje * 100).toFixed(0)}%)</span>
                    <span>${formatoMoneda(monto)}</span>
                </div>
                <div class="ml-4 text-sm text-gray-500 mb-2">
                    (${empleados} empleados: ${formatoMoneda(monto / empleados)} c/u)
                </div>
            `;
        } else {
            resultadosDiv.innerHTML += `
                <div class="flex justify-between p-2 hover:bg-gray-50 rounded-lg">
                    <span>${categoria} (${(porcentaje * 100).toFixed(0)}%)</span>
                    <span>${formatoMoneda(monto)}</span>
                </div>
            `;
        }
        ultimoResultado.push({ categoria, monto });
    }

    // Guardar datos para exportación
    ultimoResultado.unshift(
        { categoria: 'Efectivo', monto: efectivo },
        { categoria: 'Tarjeta', monto: tarjeta },
        { categoria: 'Venta total', monto: venta },
        { categoria: 'Empleados', monto: empleados }
    );

    // Guardar en localStorage
    localStorage.setItem('ultimoCalculo', JSON.stringify({
        efectivo,
        tarjeta,
        empleados
    }));

    // Mostrar gráfico
    mostrarGrafico(venta);
        
    const registro = {
        fecha: new Date().toLocaleDateString(),
        efectivo: efectivo,
        tarjeta: tarjeta,
        empleados: empleados,
        total: venta,
        pagoEmpleado: (venta * porcentajes['Sueldos']) / empleados
    };

    let registros = JSON.parse(localStorage.getItem('registros')) || [];
    registros.push(registro);
    localStorage.setItem('registros', JSON.stringify(registros));
}

// Mostrar gráfico circular
function mostrarGrafico(ventaTotal) {
    const canvas = document.getElementById('graficoReparto');
    if (!canvas) {
        console.error("Canvas 'graficoReparto' no encontrado");
        return;
    }

    const ctx = canvas.getContext('2d');
    if (chartInstance) {
        chartInstance.destroy();
    }

    const labels = Object.keys(porcentajes);
    const data = labels.map(label => ventaTotal * porcentajes[label]);

    chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = (value / ventaTotal * 100).toFixed(1);
                            return `${label}: ${formatoMoneda(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Función para descargar Excel
function descargarExcel() {
    if (ultimoResultado.length === 0) {
        alert("Primero realice un cálculo");
        return;
    }

    // Verificar si la librería está disponible
    if (typeof XLSX === 'undefined') {
        alert("La librería para exportar a Excel no está disponible");
        return;
    }

    // Crear libro de Excel
    const workbook = XLSX.utils.book_new();
    
    // Crear hoja de cálculo con los datos
    const datosExcel = [
        ['Concepto', 'Monto'],
        ...ultimoResultado.map(item => [item.categoria, item.monto])
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(datosExcel);
    
    // Añadir hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reparto Diario");
    
    // Generar archivo Excel
    XLSX.writeFile(workbook, `reparto_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Función para descargar PDF
async function descargarPDF() {
    if (ultimoResultado.length === 0) {
        alert("Primero realice un cálculo");
        return;
    }

    try {
        // Verificar si jsPDF está disponible
        if (typeof window.jspdf === 'undefined') {
            // Cargar jsPDF dinámicamente
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                script.onload = resolve;
                script.onerror = () => reject(new Error("Error al cargar jsPDF"));
                document.head.appendChild(script);
            });
        }

        // Esperar un momento para asegurar que la librería esté lista
        await new Promise(resolve => setTimeout(resolve, 100));

        // Usar la versión UMD de jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Configuración inicial
        const margin = 15;
        let yPos = margin;
        const pageWidth = doc.internal.pageSize.getWidth();

        // Encabezado
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text("Reporte de Reparto Diario", pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        // Resumen de ventas
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Resumen de Ventas", margin, yPos);
        yPos += 10;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        // Datos principales
        const datosPrincipales = ultimoResultado.slice(0, 4);
        datosPrincipales.forEach(item => {
            doc.text(`${item.categoria}:`, margin, yPos);
            doc.text(formatoMoneda(item.monto), pageWidth - margin, yPos, { align: 'right' });
            yPos += 8;
        });

        // Espacio antes de la distribución
        yPos += 5;

        // Distribución de ingresos
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Distribución de Ingresos", margin, yPos);
        yPos += 10;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        // Datos de distribución
        const datosDistribucion = ultimoResultado.slice(4);
        datosDistribucion.forEach(item => {
            const porcentaje = porcentajes[item.categoria] ? `(${(porcentajes[item.categoria]*100).toFixed(0)}%)` : '';
            doc.text(`${item.categoria} ${porcentaje}:`, margin, yPos);
            doc.text(formatoMoneda(item.monto), pageWidth - margin, yPos, { align: 'right' });
            yPos += 8;
            
            // Verificar si necesitamos una nueva página
            if (yPos > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage();
                yPos = margin;
            }
        });

        // Pie de página
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("Generado por Papelería WEB ON - Sistema de Reparto", 
                pageWidth / 2, 
                doc.internal.pageSize.getHeight() - 10, 
                { align: 'center' });

        // Guardar el PDF
        doc.save(`reparto_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
        console.error("Error al generar el PDF:", error);
        alert("Ocurrió un error al generar el PDF: " + error.message);
    }
}