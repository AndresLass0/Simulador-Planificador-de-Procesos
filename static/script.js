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
            <button class="boton-eliminar-proceso" data-indice="${indice}">Eliminar</button>
        `;
      contenedorProcesos.appendChild(elementoProceso);
    });

    contenedorProcesos.querySelectorAll('.boton-eliminar-proceso').forEach(boton => {
      boton.addEventListener('click', (e) => {
        listaProcesos.splice(e.target.dataset.indice, 1);
        dibujarListaProcesos();
      });
    });
  }

  function iniciarSimulacion() {
    if (listaProcesos.length === 0 || simulacionCorriendo) return;
    simulacionCorriendo = true;
    intervaloSimulacion = setInterval(pasoDeSimulacion, 700);
  }

  function pasoDeSimulacion() {
    // se anaden los procesos nuevos a las colas
    listaProcesos.forEach(p => {
      if (p.llegada === tiempoActual) {
        // para MLQ y otros, todos empiezan en la de alta prioridad
        colaAltaPrioridad.push(p);
      }
    });

    // eleccionamos el próximo proceso
    seleccionarProximoProceso();

    dibujarEnGantt(procesoEnEjecucion);

    if (procesoEnEjecucion) {
      procesoEnEjecucion.tiempoRestante--;
      quantumCounter++;

      if (procesoEnEjecucion.tiempoRestante === 0) {
        finalizarProceso(procesoEnEjecucion);
        procesoEnEjecucion = null;
      }
    }

  }

  function seleccionarProximoProceso() {
    const algoritmo = selectorAlgoritmo.value;
    const quantum = parseInt(document.getElementById('quantum').value);
    let debeCambiar = false;

    const esDeColaAlta = algoritmo === 'rr' || (algoritmo === 'mlq' && procesoEnEjecucion && !procesoEnEjecucion.haSidoDegradado);

    if (esDeColaAlta && quantumCounter >= quantum) {
      if (procesoEnEjecucion.tiempoRestante > 0) {
        if (algoritmo === 'mlq') {
          procesoEnEjecucion.haSidoDegradado = true;
          colaBajaPrioridad.push(procesoEnEjecucion);
        } else {
          colaAltaPrioridad.push(procesoEnEjecucion);
        }
      }
      procesoEnEjecucion = null;
      debeCambiar = true;
    }

    // para algoritmos apropiativos (srtf y prioridad)
    if (algoritmo === 'srtf' || algoritmo === 'priority') {
      let colaUnificada = [...colaAltaPrioridad, ...colaBajaPrioridad];
      if (colaUnificada.length > 0) {
        colaUnificada.sort((a, b) => algoritmo === 'srtf' ? a.tiempoRestante - b.tiempoRestante : a.prioridad - b.prioridad);
        if (procesoEnEjecucion !== colaUnificada[0]) {
          procesoEnEjecucion = colaUnificada[0];
          quantumCounter = 0;
        }
      }
      return;
    }

    // para seleccionar nuevo proceso si la CPU esta libre
    if (procesoEnEjecucion === null) {
      if (algoritmo === 'mlq') {
        if (colaAltaPrioridad.length > 0) {
          procesoEnEjecucion = colaAltaPrioridad.shift();
        } else if (colaBajaPrioridad.length > 0) {
          procesoEnEjecucion = colaBajaPrioridad.shift();
        }
      } else { // para fcfs, sjf, rr
        let colaListos = colaAltaPrioridad;
        if (colaListos.length > 0) {
          if (algoritmo === 'sjf') {
            colaListos.sort((a, b) => a.duracion - b.duracion);
          }
          procesoEnEjecucion = colaListos.shift();
        }
      }
      quantumCounter = 0;
    }
  }

  function finalizarProceso(proceso) {
    proceso.tiempoFinalizacion = tiempoActual + 1;
    proceso.tiempoRetorno = proceso.tiempoFinalizacion - proceso.llegada;
    proceso.tiempoEspera = proceso.tiempoRetorno - proceso.duracion;

    let indiceEnColaAlta = colaAltaPrioridad.findIndex(p => p.id === proceso.id);
    if (indiceEnColaAlta > -1) colaAltaPrioridad.splice(indiceEnColaAlta, 1);

    let indiceEnColaBaja = colaBajaPrioridad.findIndex(p => p.id === proceso.id);
    if (indiceEnColaBaja > -1) colaBajaPrioridad.splice(indiceEnColaBaja, 1);
  }

  function dibujarEnGantt(proceso) {
    const bloque = document.createElement('div');
    bloque.className = 'bloque-gantt';
    if (proceso) {
      bloque.style.backgroundColor = proceso.color;
      bloque.innerText = proceso.nombre;
    } else {
      bloque.style.backgroundColor = '#E0E0E0';
    }
    cuerpoGantt.appendChild(bloque);
    cuerpoGantt.parentElement.scrollLeft = cuerpoGantt.parentElement.scrollWidth;
  }

  

  gestionarCamposAlgoritmo();
});