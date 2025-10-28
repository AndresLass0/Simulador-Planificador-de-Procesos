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
      return;
    }

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <th>${id}</th>
      <th>${llegada}</th>
      <th>${duracion}</th>
      <th>${prioridad}</th>
    `;

    tabla.appendChild(fila);
    actualizarSelectIDs();
    e.target.reset();

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
      return;
    }

    const filas = tabla.querySelectorAll("tr");
    for (const fila of filas) {
      if (fila.children[0].textContent === id) {
        fila.remove();
        break;
      }
    }

    actualizarSelectIDs();
    e.target.reset();

    await fetch("/eliminar_proceso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
  });

  // === MODIFICAR ===
  document.getElementById("modificar").addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = e.target.id.value;
    const llegada = e.target.llegada.value;
    const duracion = e.target.duracion.value;
    const prioridad = e.target.prioridad.value;

    if (!id) {
      alert("Selecciona un proceso para modificar.");
      return;
    }

    const filas = document.querySelectorAll("#tabla-procesos tbody tr");
    for (const fila of filas) {
      if (fila.children[0].textContent === id) {
        if (llegada) fila.children[1].textContent = llegada;
        if (duracion) fila.children[2].textContent = duracion;
        if (prioridad) fila.children[3].textContent = prioridad;
        break;
      }
    }

    e.target.reset();

    await fetch("/modificar_proceso", {
<<<<<<< Updated upstream
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, llegada, duracion, prioridad })
    }); 

=======
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, llegada, duracion, prioridad }) // Corregido de 'rafaga'
>>>>>>> Stashed changes
    });
  });


  // CONEXION DE BOTONES
  document.getElementById("btn-colas-multiples")
    .addEventListener("click", simularColasMultiples);
  document.getElementById("btn-round-robin")
    .addEventListener("click", simularRoundRobin);
  
}); 


function actualizarSelectIDs() {
  const select = document.getElementById("select-id");
  const filas = document.querySelectorAll("#tabla-procesos tbody tr");

  select.innerHTML = '<option value="">-- Selecciona un proceso --</option>';

  filas.forEach(fila => {
    const id = fila.children[0].textContent;
    const option = document.createElement("option");
    option.value = id;
    option.textContent = id;
    select.appendChild(option);
  });
}