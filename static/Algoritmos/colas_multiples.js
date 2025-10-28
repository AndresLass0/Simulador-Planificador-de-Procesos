function simularColasMultiples() {
    console.log("Iniciando simulación de Colas Múltiples...");
    
    // Obtener los procesos de la tabla
    let procesos = getProcesosFromTable();
    if (procesos.length === 0) {
        alert("Por favor, agrega al menos un proceso antes de simular.");
        return;
    }

    // Q1 (Alta Prioridad): Prioridad 1-3 (Usará Round Robin, Quantum=2)
    // Q2 (Media Prioridad): Prioridad 4-6 (Usará SJF No Apropiativo)
    // Q3 (Baja Prioridad): Prioridad 7+ (Usará FCFS)
    
    let qAlta = [];
    let qMedia = [];
    let qBaja = [];
    const QUANTUM_ALTA = 2; // Quantum para la cola de Round Robin

    let tiempoActual = 0;
    let terminados = 0;
    let gantt = []; // Guardará el diagrama de Gantt
    
    // Copia de procesos que irán llegando
    let enEspera = [...procesos].sort((a, b) => a.llegada - b.llegada);
    let procesosCompletados = []; // Para los resultados finales

    // Bucle principal de la simulación
    while (terminados < procesos.length) {
        
        // 1. Mover procesos de 'enEspera' a las colas de listos si ya llegaron
        while (enEspera.length > 0 && enEspera[0].llegada <= tiempoActual) {
            let p = enEspera.shift(); // Saca el proceso que acaba de llegar
            if (p.prioridad <= 3) {
                qAlta.push(p);
            } else if (p.prioridad <= 6) {
                qMedia.push(p);
            } else {
                qBaja.push(p);
            }
        }

        let pEjecutar = null;

        // 2. Elegir proceso a ejecutar (Prioridad estricta entre colas)
        if (qAlta.length > 0) {
            // --- Cola de Alta Prioridad (Round Robin) ---
            pEjecutar = qAlta.shift();
            let tiempoEjecutado = Math.min(QUANTUM_ALTA, pEjecutar.restante);
            
            gantt.push({ id: pEjecutar.id, start: tiempoActual, end: tiempoActual + tiempoEjecutado });
            pEjecutar.restante -= tiempoEjecutado;
            tiempoActual += tiempoEjecutado;

            // Volver a revisar llegadas *durante* la ejecución de este quantum
             while (enEspera.length > 0 && enEspera[0].llegada <= tiempoActual) {
                let p = enEspera.shift();
                if (p.prioridad <= 3) qAlta.push(p);
                else if (p.prioridad <= 6) qMedia.push(p);
                else qBaja.push(p);
            }

            if (pEjecutar.restante > 0) {
                qAlta.push(pEjecutar); // Devolver a la cola RR si no terminó
            } else {
                terminados++;
                pEjecutar.tiempoRetorno = tiempoActual - pEjecutar.llegada;
                pEjecutar.tiempoEspera = pEjecutar.tiempoRetorno - pEjecutar.duracion;
                procesosCompletados.push(pEjecutar);
            }
        
        } else if (qMedia.length > 0) {
            // --- Cola de Media Prioridad (SJF No Apropiativo) ---
            qMedia.sort((a, b) => a.restante - b.restante); // Ordenar por SJF
            pEjecutar = qMedia.shift(); 

            let tiempoEjecutado = pEjecutar.restante; 
            gantt.push({ id: pEjecutar.id, start: tiempoActual, end: tiempoActual + tiempoEjecutado });
            pEjecutar.restante = 0;
            tiempoActual += tiempoEjecutado;
            
            terminados++;
            pEjecutar.tiempoRetorno = tiempoActual - pEjecutar.llegada;
            pEjecutar.tiempoEspera = pEjecutar.tiempoRetorno - pEjecutar.duracion;
            procesosCompletados.push(pEjecutar);

        } else if (qBaja.length > 0) {
            // --- Cola de Baja Prioridad (FCFS) ---
            pEjecutar = qBaja.shift(); 

            let tiempoEjecutado = pEjecutar.restante;
            gantt.push({ id: pEjecutar.id, start: tiempoActual, end: tiempoActual + tiempoEjecutado });
            pEjecutar.restante = 0;
            tiempoActual += tiempoEjecutado;
            
            terminados++;
            pEjecutar.tiempoRetorno = tiempoActual - pEjecutar.llegada;
            pEjecutar.tiempoEspera = pEjecutar.tiempoRetorno - pEjecutar.duracion;
            procesosCompletados.push(pEjecutar);

        } else {
            // --- CPU Ocioso ---
            if (enEspera.length > 0) {
                if(tiempoActual < enEspera[0].llegada) {
                  gantt.push({ id: "Ocioso", start: tiempoActual, end: enEspera[0].llegada });
                  tiempoActual = enEspera[0].llegada;
                }
            } else {
                break; 
            }
        }
    }

    // 3. Mostrar resultados
    mostrarResultados(gantt, procesosCompletados);
}



function getProcesosFromTable() {
    const filas = document.querySelectorAll("#tabla-procesos tbody tr");
    const procesos = [];
    filas.forEach(fila => {
        procesos.push({
            id: fila.children[0].textContent,
            llegada: parseInt(fila.children[1].textContent),
            duracion: parseInt(fila.children[2].textContent),
            prioridad: parseInt(fila.children[3].textContent),
            restante: parseInt(fila.children[2].textContent), // Tiempo restante
            tiempoEspera: 0,
            tiempoRetorno: 0
        });
    });
    return procesos;
}


function mostrarResultados(gantt, procesos) {
    console.log("Mostrando resultados:", gantt, procesos);
    
    // --- Renderizar Diagrama de Gantt ---
    const ganttContainer = document.getElementById("gantt-chart");
    ganttContainer.innerHTML = ""; // Limpiar
    
    const totalTime = gantt[gantt.length - 1].end;
    
    gantt.forEach(bloque => {
        const duracion = bloque.end - bloque.start;
        const ancho = (duracion / totalTime) * 100;
        
        const divBloque = document.createElement("div");
        divBloque.className = "gantt-bloque";
        divBloque.style.width = `${ancho}%`;
        divBloque.textContent = bloque.id;
        
        if(bloque.id !== "Ocioso") {
           let hash = 0;
           for (let i = 0; i < bloque.id.length; i++) {
                hash = bloque.id.charCodeAt(i) + ((hash << 5) - hash);
           }
           let color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
           divBloque.style.backgroundColor = "#" + "000000".substring(0, 6 - color.length) + color;
        } else {
           divBloque.style.backgroundColor = "#ccc"; 
           divBloque.style.color = "#000";
        }
        ganttContainer.appendChild(divBloque);
    });

    // --- Renderizar Tabla de Tiempos ---
    const tablaResultadosBody = document.querySelector("#tabla-resultados tbody");
    tablaResultadosBody.innerHTML = ""; // Limpiar
    
    procesos.sort((a, b) => a.id.localeCompare(b.id)); 
    
    let tiempoEsperaPromedio = 0;
    let tiempoRetornoPromedio = 0;

    procesos.forEach(p => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${p.id}</td>
            <td>${p.tiempoRetorno}</td>
            <td>${p.tiempoEspera}</td>
        `;
        tablaResultadosBody.appendChild(fila);
        
        tiempoEsperaPromedio += p.tiempoEspera;
        tiempoRetornoPromedio += p.tiempoRetorno;
    });

    // Añadir fila de promedios
    tiempoEsperaPromedio /= procesos.length;
    tiempoRetornoPromedio /= procesos.length;
    
    const filaPromedio = document.createElement("tr");
    filaPromedio.style.fontWeight = "bold";
    filaPromedio.innerHTML = `
        <td>Promedio</td>
        <td>${tiempoRetornoPromedio.toFixed(2)}</td>
        <td>${tiempoEsperaPromedio.toFixed(2)}</td>
    `;
    tablaResultadosBody.appendChild(filaPromedio);
}