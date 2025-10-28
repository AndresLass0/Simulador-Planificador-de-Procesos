function simularRoundRobin() {
    console.log("Iniciando simulación Round Robin...");

    // Obtener los procesos y validar que existan.
    let procesos = getProcesosFromTable();
    if (procesos.length === 0) {
        alert("Por favor, agrega al menos un proceso antes de simular.");
        return;
    }

    // Pedir el Quantum al usuario.
    const quantum = parseInt(prompt("Ingresa el valor del Quantum:", "5"));
    if (isNaN(quantum) || quantum <= 0) {
        alert("El Quantum debe ser un número positivo.");
        return;
    }

    // Preparar variables para la simulación.
    let enEspera = [...procesos].sort((a, b) => a.llegada - b.llegada);
    let listos = [];
    let procesosCompletados = [];
    let gantt = [];
    let tiempoActual = 0;

    // Bucle principal de la simulación.
    while (enEspera.length > 0 || listos.length > 0) {

        // Mover procesos que ya llegaron de la cola de espera a la de listos.
        while (enEspera.length > 0 && enEspera[0].llegada <= tiempoActual) {
            listos.push(enEspera.shift());
        }

        if (listos.length > 0) {
            let p = listos.shift(); // Saca el siguiente proceso de la cola.

            // Ejecutar el proceso por el quantum o lo que le falte.
            const tiempoEjecutado = Math.min(quantum, p.restante);
            gantt.push({ id: p.id, start: tiempoActual, end: tiempoActual + tiempoEjecutado });
            p.restante -= tiempoEjecutado;
            tiempoActual += tiempoEjecutado;

            // IMPORTANTE: Revisar si llegaron nuevos procesos MIENTRAS se ejecutaba este.
            while (enEspera.length > 0 && enEspera[0].llegada <= tiempoActual) {
                listos.push(enEspera.shift());
            }

            if (p.restante > 0) {
                // Si no ha terminado, vuelve al final de la cola de listos.
                listos.push(p); 
            } else {
                // Si terminó, se calculan sus tiempos y se guarda.
                p.tiempoRetorno = tiempoActual - p.llegada;
                p.tiempoEspera = p.tiempoRetorno - p.duracion;
                procesosCompletados.push(p);
            }
        } else {
            // Si no hay procesos listos (CPU Ocioso), avanza el tiempo al próximo en llegar.
            if (enEspera.length > 0) {
                gantt.push({ id: "Ocioso", start: tiempoActual, end: enEspera[0].llegada });
                tiempoActual = enEspera[0].llegada;
            }
        }
    }

    // 5. Mostrar los resultados en la interfaz.
    mostrarResultados(gantt, procesosCompletados);
}