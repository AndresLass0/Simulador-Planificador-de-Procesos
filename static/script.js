document.addEventListener("DOMContentLoaded", () => {
  const selectorAlgoritmo = document.getElementById("algoritmos");
  const campoQuantum = document.getElementById("agregar-quantum");
  const campoPrioridad = document.getElementById("agregar-prioridad");
  const botonAgregarProceso = document.getElementById("boton-agregar-proceso");
  const contenedorProcesos = document.getElementById("procesos-container");

  const botonIniciar = document.getElementById("boton-iniciar");
  const botonPausar = document.getElementById("boton-parar");
  const botonReiniciar = document.getElementById("boton-reiniciar");

  const cuerpoGantt = document.getElementById("cuerpo-gantt");
  const cuerpoTablaResultados = document.getElementById("cuerpo-tabla-resultados");
  const elEsperaPromedio = document.getElementById("espera-promedio");
  const elRetornoPromedio = document.getElementById("retorno-promedio");

  let listaProcesos = [];
  let intervaloSimulacion;
  let tiempoActual = 0;
  let simulacionCorriendo = false;
  let contadorIdProceso = 1;

  let procesoEnEjecucion = null;
  let quantumCounter = 0;

  let colaAltaPrioridad = [];
  let colaBajaPrioridad = [];

  //eventos  
  selectorAlgoritmo.addEventListener("change", gestionarCamposAlgoritmo);
  botonAgregarProceso.addEventListener("click", agregarProceso);
  botonIniciar.addEventListener("click", iniciarSimulacion);
  botonPausar.addEventListener("click", pausarSimulacion);
  botonReiniciar.addEventListener("click", reiniciarSimulacion);

  function gestionarCamposAlgoritmo() {
    const esRR = selectorAlgoritmo.value === 'rr';
    const esMLQ = selectorAlgoritmo.value === 'mlq';
    campoQuantum.style.display = esRR || esMLQ ? 'block' : 'none';
    campoPrioridad.style.display = selectorAlgoritmo.value === 'priority' ? 'block' : 'none';
    dibujarListaProcesos();
  }

  function agregarProceso() {
    const nombre = document.getElementById("input-id-proceso").value || `P${contadorIdProceso}`;
    const color = document.getElementById("color-input").value;
    const llegada = parseInt(document.getElementById("input-llegada-proceso").value);
    const duracion = parseInt(document.getElementById("input-duracion-proceso").value);
    const prioridad = parseInt(document.getElementById("prioridad").value);

    if (isNaN(duracion) || duracion <= 0) {
      alert('La duración debe ser un número mayor a 0.');
      return;
    }

    const proceso = {
      id: contadorIdProceso,
      nombre, color, llegada, duracion, prioridad,
      tiempoRestante: duracion,
      haSidoDegradado: false
    };
    listaProcesos.push(proceso);
    contadorIdProceso++;
    dibujarListaProcesos();
    document.getElementById("input-id-proceso").value = '';
  }

  function dibujarListaProcesos() {
    contenedorProcesos.innerHTML = '';
    listaProcesos.forEach((proceso, indice) => {
      const elementoProceso = document.createElement('div');
      elementoProceso.className = 'elemento-proceso';

      const prioridadInfo = selectorAlgoritmo.value === 'priority' ?
        `<span class="info-detalle">Prioridad: ${proceso.prioridad}</span>` : '';

      elementoProceso.innerHTML = `
            <div class="info-proceso">
                <div class="color-dot" style="background-color: ${proceso.color};"></div>
                <div class="texto-info">
                    <strong>${proceso.nombre}</strong>
                    <span class="info-detalle">Llegada: ${proceso.llegada}</span>
                    <span class="info-detalle">Duración: ${proceso.duracion}</span>
                    ${prioridadInfo}
                </div>
            </div>
            <button class="boton-eliminar-proceso" data-indice="${indice}">Eliminar</button>`;
      contenedorProcesos.appendChild(elementoProceso);
    });

    contenedorProcesos.querySelectorAll('.boton-eliminar-proceso').forEach(boton => {
      boton.addEventListener('click', (e) => {
        listaProcesos.splice(e.target.dataset.indice, 1);
        dibujarListaProcesos();
      });
    });
  }

  gestionarCamposAlgoritmo();

});