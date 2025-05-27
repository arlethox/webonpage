// Variable global para la instancia del gráfico
let graficoIngresos = null;

document.addEventListener('DOMContentLoaded', function() {
    // Mostrar fecha actual
    document.getElementById('fechaActual').textContent = `Fecha: ${formatearFecha(new Date())}`;
    
    // Configurar eventos
    configurarEventos();
    
    // Cargar y mostrar datos iniciales
    cargarYMostrarDatos();
});

function configurarEventos() {
    // Botón Filtrar
    document.getElementById('btnFiltrar')?.addEventListener('click', function() {
        const fechaInput = document.getElementById('filtroFecha').value;
        if (fechaInput) {
            const fechaFiltro = formatearFecha(new Date(fechaInput));
            filtrarDatosPorFecha(fechaFiltro);
        } else {
            alert('Por favor selecciona una fecha para filtrar');
        }
    });

    // Botón Limpiar Filtros
    document.getElementById('btnLimpiar')?.addEventListener('click', function() {
        document.getElementById('filtroFecha').value = '';
        cargarYMostrarDatos();
    });

    // Botón Exportar
    document.getElementById('btnExportar')?.addEventListener('click', exportarDatos);
    
    // Botón Borrar Seleccionados
    document.getElementById('btnBorrarSeleccionados')?.addEventListener('click', borrarRegistrosSeleccionados);
    
    // Checkbox Seleccionar Todos
    document.getElementById('seleccionarTodos')?.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('#tablaHistorial input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
}

function cargarYMostrarDatos() {
    const registros = obtenerRegistros();
    mostrarGrafica(registros);
    mostrarTabla(registros);
    mostrarEstadisticas(registros);
}

function obtenerRegistros() {
    try {
        const registros = JSON.parse(localStorage.getItem('registros')) || [];
        console.log('Registros obtenidos:', registros); // Para depuración
        
        // Ordenar por fecha (más reciente primero)
        return registros.sort((a, b) => {
            return new Date(convertirFechaParaOrdenar(b.fecha)) - new Date(convertirFechaParaOrdenar(a.fecha));
        });
    } catch (error) {
        console.error('Error al obtener registros:', error);
        return [];
    }
}

function convertirFechaParaOrdenar(fechaStr) {
    if (!fechaStr) return '0';
    const partes = fechaStr.split('/');
    if (partes.length !== 3) return '0';
    return `${partes[1]}/${partes[0]}/${partes[2]}`; // MM/DD/YYYY
}

function formatearFecha(fecha) {
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const año = fecha.getFullYear();
    return `${dia}/${mes}/${año}`; // DD/MM/YYYY
}

function filtrarDatosPorFecha(fecha) {
    const registros = obtenerRegistros();
    const registrosFiltrados = registros.filter(r => r.fecha === fecha);
    
    if (registrosFiltrados.length === 0) {
        alert('No hay registros para la fecha seleccionada');
        return;
    }
    
    mostrarGrafica(registrosFiltrados);
    mostrarTabla(registrosFiltrados);
    mostrarEstadisticas(registrosFiltrados);
}

function mostrarGrafica(registros) {
    const ctx = document.getElementById('graficaIngresos')?.getContext('2d');
    if (!ctx) {
        console.error('No se encontró el elemento canvas para la gráfica');
        return;
    }
    
    // Destruir gráfico anterior si existe
    if (graficoIngresos) {
        graficoIngresos.destroy();
    }
    
    // Limitar a últimos 7 registros para mejor visualización
    const datosMostrar = registros.slice(0, 7).reverse();
    
    graficoIngresos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: datosMostrar.map(r => r.fecha),
            datasets: [
                {
                    label: 'Efectivo',
                    data: datosMostrar.map(r => r.efectivo),
                    backgroundColor: '#10B981',
                    borderColor: '#047857',
                    borderWidth: 1
                },
                {
                    label: 'Tarjeta',
                    data: datosMostrar.map(r => r.tarjeta),
                    backgroundColor: '#3B82F6',
                    borderColor: '#1D4ED8',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Ingresos por día',
                    font: { size: 16 }
                },
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: $${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

function mostrarTabla(registros) {
    const tabla = document.getElementById('tablaHistorial');
    if (!tabla) {
        console.error('No se encontró el elemento de la tabla');
        return;
    }
    
    tabla.innerHTML = ''; // Limpiar tabla
    
    if (registros.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="8" class="px-4 py-4 text-center text-gray-500">
                    No hay registros de repartos aún. Realice un cálculo en la página de Reparto.
                </td>
            </tr>
        `;
        return;
    }
    
    registros.forEach((registro, index) => {
        const fila = document.createElement('tr');
        fila.dataset.id = index;
        
        fila.innerHTML = `
            <td class="px-4 py-2 border"><input type="checkbox" class="seleccionar-registro"></td>
            <td class="px-4 py-2 border">${registro.fecha || 'N/A'}</td>
            <td class="px-4 py-2 border text-green-700 font-semibold">$${(registro.efectivo || 0).toFixed(2)}</td>
            <td class="px-4 py-2 border text-blue-700 font-semibold">$${(registro.tarjeta || 0).toFixed(2)}</td>
            <td class="px-4 py-2 border">${registro.empleados || 0}</td>
            <td class="px-4 py-2 border font-bold">$${(registro.total || 0).toFixed(2)}</td>
            <td class="px-4 py-2 border">$${(registro.pagoEmpleado || 0).toFixed(2)}</td>
            <td class="px-4 py-2 border">
                <button class="btn-borrar bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded text-xs">
                    Borrar
                </button>
            </td>
        `;
        
        tabla.appendChild(fila);
    });
    
    // Agregar eventos a los botones de borrado
    document.querySelectorAll('.btn-borrar').forEach(btn => {
        btn.addEventListener('click', function() {
            const fila = this.closest('tr');
            const id = parseInt(fila.dataset.id);
            borrarRegistro(id);
        });
    });
}

function mostrarEstadisticas(registros) {
    const totalEfectivo = registros.reduce((sum, r) => sum + (r.efectivo || 0), 0);
    const totalTarjeta = registros.reduce((sum, r) => sum + (r.tarjeta || 0), 0);
    const ventaTotal = registros.reduce((sum, r) => sum + (r.total || 0), 0);
    
    if (document.getElementById('totalEfectivo')) {
        document.getElementById('totalEfectivo').textContent = `$${totalEfectivo.toFixed(2)}`;
    }
    if (document.getElementById('totalTarjeta')) {
        document.getElementById('totalTarjeta').textContent = `$${totalTarjeta.toFixed(2)}`;
    }
    if (document.getElementById('ventaTotal')) {
        document.getElementById('ventaTotal').textContent = `$${ventaTotal.toFixed(2)}`;
    }
}

function borrarRegistro(id) {
    if (!confirm('¿Estás seguro de que quieres borrar este registro?')) {
        return;
    }
    
    const registros = obtenerRegistros();
    registros.splice(id, 1);
    
    // Guardar cambios
    localStorage.setItem('registros', JSON.stringify(registros));
    
    // Recargar la vista
    cargarYMostrarDatos();
    
    // Mostrar notificación
    mostrarNotificacion('Registro borrado correctamente', 'success');
}

function borrarRegistrosSeleccionados() {
    const checkboxes = document.querySelectorAll('#tablaHistorial .seleccionar-registro:checked');
    
    if (checkboxes.length === 0) {
        mostrarNotificacion('No hay registros seleccionados', 'warning');
        return;
    }
    
    if (!confirm(`¿Estás seguro de que quieres borrar los ${checkboxes.length} registros seleccionados?`)) {
        return;
    }
    
    const registros = obtenerRegistros();
    const idsABorrar = [];
    
    // Obtener los IDs de los registros a borrar (en orden inverso)
    checkboxes.forEach(checkbox => {
        const fila = checkbox.closest('tr');
        idsABorrar.unshift(parseInt(fila.dataset.id));
    });
    
    // Borrar registros
    idsABorrar.forEach(id => {
        registros.splice(id, 1);
    });
    
    // Guardar cambios
    localStorage.setItem('registros', JSON.stringify(registros));
    
    // Recargar la vista
    cargarYMostrarDatos();
    
    // Mostrar notificación
    mostrarNotificacion(`${checkboxes.length} registros borrados correctamente`, 'success');
    
    // Desmarcar "Seleccionar todos"
    const selectAll = document.getElementById('seleccionarTodos');
    if (selectAll) {
        selectAll.checked = false;
    }
}

function mostrarNotificacion(mensaje, tipo = 'success') {
    const notificacion = document.createElement('div');
    notificacion.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white ${
        tipo === 'success' ? 'bg-green-500' : 
        tipo === 'error' ? 'bg-red-500' : 
        'bg-yellow-500'
    }`;
    notificacion.textContent = mensaje;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.classList.add('opacity-0', 'transition-opacity', 'duration-500');
        setTimeout(() => {
            document.body.removeChild(notificacion);
        }, 500);
    }, 3000);
}

function exportarDatos() {
    const registros = obtenerRegistros();
    
    if (registros.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    // Crear contenido CSV
    let csv = 'Fecha,Efectivo ($),Tarjeta ($),Empleados,Total ($),Pago por empleado ($)\n';
    
    registros.forEach(registro => {
        csv += `"${registro.fecha || ''}",${registro.efectivo || 0},${registro.tarjeta || 0},${registro.empleados || 0},${registro.total || 0},${registro.pagoEmpleado || 0}\n`;
    });
    
    // Crear y descargar archivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_papeleria_${formatearFecha(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}