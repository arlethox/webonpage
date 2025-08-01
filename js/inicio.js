function guardar() {
  const saldoInicio = parseFloat(document.getElementById("saldoinicio")?.value) || 0;
  const efectivo = parseFloat(document.getElementById("efectivo")?.value) || 0;
  const tarjeta = parseFloat(document.getElementById("tarjeta")?.value) || 0;
  const dolares = parseFloat(document.getElementById("dolares")?.value) || 0;
  const responsable = document.getElementById("responsable")?.value.trim() || "Sin nombre";

  const fecha = new Date().toISOString().split("T")[0];
  const total = efectivo + tarjeta;

  const responsablesArray = responsable
    .split(",")
    .map(r => r.trim())
    .filter(r => r !== "");

  const empleados = responsablesArray.length > 0 ? responsablesArray.length : 1;
  const pagoPorEmpleado = total / empleados;

  const nuevoIngreso = {
    tipo: "ingreso",
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

  fetch("https://script.google.com/macros/s/AKfycbwvoPFDMIv-LVw8g4QA9lBE4pWnxa9mlczFT3S4F8WZXCkElQlY56nz2O2rReo7vkUI/exec", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(nuevoIngreso) // o datosSalida según corresponda
  })
  .then(res => res.json())
  .then(respuesta => {
    if (respuesta.resultado === "OK") {
      alert("Guardado correctamente");
    } else {
      alert("Error: " + (respuesta.mensaje || "desconocido"));
    }
  })
  .catch(error => {
    console.error("Error:", error);
    alert("Error al guardar. Revisa la consola.");
  });
}
function guardarSalida() {
  const fecha = document.getElementById("fechaSalida")?.value;
  const forma = document.getElementById("formaSalida")?.value;
  const concepto = document.getElementById("conceptoSalida")?.value.trim();
  const cantidad = parseFloat(document.getElementById("cantidadSalida")?.value) || 0;
  const responsable = document.getElementById("responsableSalida")?.value.trim() || "Sin nombre";

  if (!fecha || !forma || !concepto || cantidad <= 0) {
    alert("Por favor completa todos los campos correctamente.");
    return;
  }

  const datosSalida = {
    tipo: "salida",  // 👈 AGREGA ESTE CAMPO
    fecha,
    forma,
    concepto,
    cantidad,
    responsable
  };

  fetch("https://script.google.com/macros/s/AKfycbwvoPFDMIv-LVw8g4QA9lBE4pWnxa9mlczFT3S4F8WZXCkElQlY56nz2O2rReo7vkUI/exec", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(datosSalida) // o datosSalida según corresponda
  })
  .then(res => res.json())
  .then(respuesta => {
    if (respuesta.resultado === "OK") {
      alert("Guardado correctamente");
    } else {
      alert("Error: " + (respuesta.mensaje || "desconocido"));
    }
  })
  .catch(error => {
    console.error("Error:", error);
    alert("Error al guardar. Revisa la consola.");
  });
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type"
    });
}