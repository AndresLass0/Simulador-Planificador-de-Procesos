document.addEventListener("DOMContentLoaded", () => {

  const tabla = document.querySelector("#tabla-procesos tbody");

  // === AGREGAR ===
  document.getElementById("agregar").addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = e.target.id.value;
    const llegada = e.target.llegada.value;
    const duracion = e.target.duracion.value;
    const prioridad = e.target.prioridad.value;

    if (!id || !llegada || !duracion || !prioridad) {
        alert("Ups!, Por favor, completa todos los campos antes de agregar el proceso.");
        return; // Evita que siga ejecutando
    }


    // Crear fila nueva
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <th>${id}</th>
      <th>${llegada}</th>
      <th>${duracion}</th>
      <th>${prioridad}</th>
    `;

    tabla.appendChild(fila);
    actualizarSelectIDs();

    // Limpiar inputs
    e.target.reset();

    // Enviar a backend
    await fetch("/agregar_proceso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, llegada, duracion, prioridad })
    });

    
  });

  // === ELIMINAR ===
  document.getElementById("eliminar").addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = e.target.id.value;

    if (!id) {
        alert("Ups!, Por favor, completa todos los campos antes de eliminar el proceso.");
        return; // Evita que siga ejecutando
    }

    const filas = tabla.querySelectorAll("tr");
    for (const fila of filas) {
      if (fila.children[0].textContent === id) {
        fila.remove();
        break;
      }
    }

    actualizarSelectIDs();
    // Limpiar input
    e.target.reset();

    // Enviar al backend
    await fetch("/eliminar_proceso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
  });

  // === MODIFICAR ===
  document.getElementById("modificar").addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = e.target.id.value; // viene del <select>
    const llegada = e.target.llegada.value;
    const duracion = e.target.duracion.value;
    const prioridad = e.target.prioridad.value;

    if (!id) {
        alert("Selecciona un proceso para modificar.");
        return;
    }

    // Buscar fila y modificarla
    const filas = document.querySelectorAll("#tabla-procesos tbody tr");
    for (const fila of filas) {
        if (fila.children[0].textContent === id) {
        if (llegada) fila.children[1].textContent = llegada;
        if (duracion) fila.children[2].textContent = duracion;
        if (prioridad) fila.children[3].textContent = prioridad;
        break;
        }
    }

    // Limpiar formulario
    e.target.reset();

    // Enviar al backend
    await fetch("/modificar_proceso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, llegada, duracion, prioridad })
    }); 

    });



    // Esto es que los botones cambien segun la seleccion

    const botones = document.querySelectorAll('.botones');

    botones.forEach(boton => {
    boton.addEventListener('click', () => {
    
      botones.forEach(b => b.classList.remove('seleccionado'));

      boton.classList.add('seleccionado');

      console.log("Algoritmo seleccionado:", boton.textContent.trim());
    });
  });

  // === INICIAR ===
  document.getElementById("boton-aceptar").addEventListener("click", () => {
    const seleccionado = document.querySelector(".botones.seleccionado");

    if (!seleccionado) {
      alert("Por favor, selecciona un algoritmo antes de iniciar.");
      return;
    }

    const algoritmo = seleccionado.textContent.trim();

    // Dependiendo del texto, redirigir a una página distinta
    switch (algoritmo) {
      case "First Come, First Served":
        window.location.href = "/fcfs";
        break;
      case "Shorest Job First":
        window.location.href = "/sjf";
        break;
      case "Por Prioridad":
        window.location.href = "/prioridad";
        break;
      case "Round Robin":
        window.location.href = "/rr";
        break;
      case "Colas Multiples de Nivel":
        window.location.href = "/colas";
        break;
      default:
        alert("Algoritmo no reconocido.");
    }
  });

});

function actualizarSelectIDs() {
  const select = document.getElementById("select-id");
  const filas = document.querySelectorAll("#tabla-procesos tbody tr");

  // Limpia las opciones previas
  select.innerHTML = '<option value="">-- Selecciona un proceso --</option>';

  // Agrega una opcion por cada fila existente
  filas.forEach(fila => {
    const id = fila.children[0].textContent;
    const option = document.createElement("option");
    option.value = id;
    option.textContent = id;
    select.appendChild(option);
  });
}
