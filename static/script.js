
let unProcesoAgregado = false;
let algoritmoActual;

document.addEventListener("DOMContentLoaded", inicializarEventos);

function inicializarEventos() {
    const algoritmoSelect = document.getElementById('algoritmos');
    algoritmoSelect.addEventListener('change', obtenerAlgoritmoActual);

    obtenerAlgoritmoActual();
    cargarProcesos();

}

function obtenerAlgoritmoActual() {
   // Ver que algoritmo esta escojido
    const algoritmoSelect = document.getElementById('algoritmos');
    const algoritmo = algoritmoSelect.value;

    // Variables a modificar
    const prioridadDiv = document.getElementById('agregar-prioridad');
    const quantumDiv = document.getElementById('agregar-quantum');

    if(!unProcesoAgregado){
      algoritmoActual = algoritmo;

      if(algoritmo === 'rr'){
        quantumDiv.style.display = 'block';  // Mostrar quantum
        prioridadDiv.style.display = 'none'; // Ocultar prioridad
      }else if(algoritmo === 'mlq' || algoritmo === 'priority'){
        prioridadDiv.style.display = 'block'; // Mostrar prioridad
        quantumDiv.style.display = 'none';    // Ocultar quantum
      }else{
        prioridadDiv.style.display = 'none'; // Ocultar prioridad
          quantumDiv.style.display = 'none';    // Ocultar quantum
      }

    }else{
      alert("Ya se agrego un proceso con un algoritmo diferente a este");
    }

    return algoritmoActual;
}


// ===== PROCESOS - 1. Funcion principal de agregar un proceso
function agregarProceso() {

    // Obtiene lo que escribio el usuario
    const nombre = document.getElementById('input-id-proceso').value;
    const llegada = document.getElementById('input-llegada-proceso').value;
    const color = document.getElementById('color-input').value;
    const duracion = document.getElementById('input-duracion-proceso').value;


    if (!nombre || !llegada || !duracion) {
        alert("Completa nombre, llegada y duración");
        return;
    }
    
    // Esto es lo que se va a mandar al python
    
    const datos = {
        nombre: nombre,
        llegada: llegada, 
        color: color,
        duracion: duracion,
        algoritmo: algoritmoActual  // Aqui es el algoritmo que tiene actual
    };

    // Si el algoritmo es priority o mlq, agregar prioridad
    if(algoritmoActual === 'priority' || algoritmoActual === 'mlq'){
        const prioridad = document.getElementById('prioridad').value;
        if(!prioridad){
            alert("Este algoritmo requiere prioridad");
            return;
        }
        datos.prioridad = prioridad;  
    }

    // Si el algoritmo es rr, agregar quantum
    if(algoritmoActual === 'rr'){
        const quantum = document.getElementById('quantum').value;
        if(!quantum){
            alert("Round Robin requiere quantum");
            return;
        }
        datos.quantum = quantum; 
    }

    // Envia a Python
    fetch('/agregar', {
        method: 'POST',  //Le dice que va a agregar algo
        headers: {
            'Content-Type': 'application/json'  
        },    
        body: JSON.stringify(datos)
    })
    .then(response => response.json())  // Cuando Python responda
    .then(resultado => {
        if(resultado.error){
          alert(`Error: ${resultado.error}`)
        }else{
          unProcesoAgregado = true;
          cargarProcesos();

          // Limpiar el formulario
          document.getElementById('input-id-proceso').value = '';
          document.getElementById('input-llegada-proceso').value = '';
          document.getElementById('input-duracion-proceso').value = '';
          document.getElementById('prioridad').value = '';
          document.getElementById('quantum').value = ''; 

          alert(` ${resultado.mensaje}`);
        }
    });


}

// ==== PROCESOS - 2. Cargar los procesos que estan en python
async function cargarProcesos() {
    try {
        const response = await fetch('/procesos');
        const procesos = await response.json();
        
        const container = document.getElementById('procesos-container');

        container.innerHTML = ''; // Limpiar
        
        // Si no hay procesos
        if (procesos.length === 0) {
            container.innerHTML += '<p style="text-align: center; color: gray; padding: 20px;">No hay procesos agregados</p>';
            return;
        }
        procesos.forEach(proceso => {
            const divAuxiliar = mostrarProceso(proceso);
            console.log("al cargar lo datos, el color es: ", proceso.color);  
            container.appendChild(divAuxiliar);
        });
        
    } catch (error) {
        console.error("Error cargando procesos:", error);
    }
}

// ==== PROCESOS - 3. Mostrar un proceso, de los procesos cargados
function mostrarProceso(proceso) {
    // Crear el contenedor principal del proceso
    const divProceso = document.createElement('div');
    divProceso.className = 'proceso-item';
    divProceso.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        margin: 8px 0;
        background-color: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid ${proceso.color};
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    // Parte izquierda
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        flex-grow: 1;
    `;


    // Informacion del proceso
    const textoInfo = document.createElement('div');
    textoInfo.innerHTML = `
        <strong style="font-size: 16px; color: #2c3e50;">${proceso.nombre}</strong><br>
        <small style="color: #7f8c8d;">
            Llegada: ${proceso.llegada} | 
            Duracion: ${proceso.duracion}
            ${proceso.prioridad ? ` | Prioridad: ${proceso.prioridad}` : ''}
            ${proceso.quantum ? ` | Quantum: ${proceso.quantum}` : ''}
        </small>
    `;

    // Boton eliminar
    const botonEliminar = document.createElement('button');
    botonEliminar.textContent = 'Eliminar';
    botonEliminar.style.cssText = `
        width: 120px;
        background-color: #e74c3c;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.3s;
    `;

    botonEliminar.onmouseover = function() {
        this.style.backgroundColor = '#c0392b';
    };
    botonEliminar.onmouseout = function() {
        this.style.backgroundColor = '#e74c3c';
    };

    // Evento para eliminar el proceso
    botonEliminar.addEventListener('click', function() {
        if (confirm(`¿Estas seguro de eliminar el proceso ${proceso.nombre}?`)) {
            eliminarProceso(proceso.nombre);
        }
    });

    // Ensamblar todo
    infoDiv.appendChild(textoInfo);
    
    divProceso.appendChild(infoDiv);
    divProceso.appendChild(botonEliminar);

    return divProceso;
}

// El mismo nombre lo dice xd
async function eliminarProceso(nombre) {
  
    try {
        const response = await fetch(`/eliminar/${nombre}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Recargar la lista
            cargarProcesos();     
        } else {
            alert("Error al eliminar proceso");
            
        }
    } catch (error) {
        console.error("Error:", error);
    }
}
