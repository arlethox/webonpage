function guardar() {
  const saldoInicio = parseFloat(document.getElementById("saldoinicio")?.value) || 0;
  const efectivo = parseFloat(document.getElementById("efectivo")?.value) || 0;
  const tarjeta = parseFloat(document.getElementById("tarjeta")?.value) || 0;
  const dolares = parseFloat(document.getElementById("dolares")?.value) || 0;
  const responsable = document.getElementById("responsable")?.value.trim() || "Sin nombre";

  const fecha = new Date().toISOString().split("T")[0]; // formato yyyy-mm-dd
  const total = efectivo + tarjeta;

  // separar responsables por coma, pero evitar vacíos
  const responsablesArray = responsable
    .split(",")
    .map(r => r.trim())
    .filter(r => r !== "");

  const empleados = responsablesArray.length > 0 ? responsablesArray.length : 1;
  const pagoPorEmpleado = total / empleados;

  const nuevoRegistro = {
    fecha,
    saldoInicio,
    efectivo,
    tarjeta,
    dolares,
    total,
    empleados,
    responsables: responsablesArray,
    pagoPorEmpleado: pagoPorEmpleado.toFixed(2)
  };

  try {
    const historial = JSON.parse(localStorage.getItem("historialIngresos")) || [];
    historial.push(nuevoRegistro);
    localStorage.setItem("historialIngresos", JSON.stringify(historial));
    alert("Información guardada correctamente.");
    document.querySelectorAll("input").forEach(input => (input.value = ""));
  } catch (error) {
    console.error("Error al guardar:", error);
    alert("Hubo un error al guardar la información. Revisa la consola.");
  }
}
