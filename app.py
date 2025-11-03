from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# "Base de datos" en memoria
procesos = []

# ========== RUTA PRINCIPAL ==========
@app.route("/")
def index():
    return render_template('index.html')

# ========== AGREGAR PROCESO CON VALIDACION ==========
@app.route("/agregar", methods=["POST"])
def agregar():
    try:
        datos = request.json
    
        
        # Validaciones 
        if not datos:
            return jsonify({"error": "Datos vacios"}), 400
        
        if 'nombre' not in datos or not datos['nombre']:
            return jsonify({"error": "El nombre es requerido"}), 400
        
        if 'llegada' not in datos:
            return jsonify({"error": "El tiempo de llegada es requerido"}), 400
        
        if 'duracion' not in datos:
            return jsonify({"error": "La duracion es requerida"}), 400
        
        nombre = datos['nombre']
        
        # VERIFICAR SI EL NOMBRE YA EXISTE
        for proceso in procesos:
            if proceso['nombre'] == nombre:
                return jsonify({"error": f"Ya existe un proceso con el nombre '{nombre}'"}), 400
        
        # Crear nuevo proceso
        nuevo_proceso = {
            'nombre': nombre,
            'llegada': int(datos['llegada']),
            'duracion': int(datos['duracion']),
            'algoritmo': datos.get('algoritmo'),
            'color': datos.get('color')
        }
        
        # Agregar campos opcionales
        if 'prioridad' in datos:
            nuevo_proceso['prioridad'] = int(datos['prioridad'])
        
        if 'quantum' in datos:
            nuevo_proceso['quantum'] = int(datos['quantum'])
        
        procesos.append(nuevo_proceso)
        
        return jsonify({"mensaje": f"Proceso {nombre} agregado exitosamente"})
        
    except Exception as e:
        print(f"Error al agregar proceso: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500


# ========== OBTENER PROCESOS ==========
@app.route("/procesos", methods=["GET"])
def obtener_procesos():
    return jsonify(procesos)


# ========== ELIMINAR POR NOMBRE ==========
@app.route("/eliminar/<string:nombre>", methods=["DELETE"])
def eliminar_proceso(nombre):
    global procesos
    
    
    for proceso in procesos:
        if proceso['nombre'] == nombre:
            procesos.remove(proceso)
            print(f"Proceso {nombre} eliminado. Procesos restantes: {len(procesos)}")
            return jsonify({"mensaje": f"Proceso {nombre} eliminado"})
    
    print(f"Proceso {nombre} no encontrado")
    return jsonify({"error": "Proceso no encontrado"}), 404


# ========== REINICIAR TODOS ==========
@app.route("/reiniciar", methods=["POST"])
def reiniciar():
    global procesos
    cantidad = len(procesos)
    procesos.clear()
    return jsonify({"mensaje": f"Se eliminaron {cantidad} procesos"})






# ======= SIMULACION =========

simulacion_estado = {
    'en_ejecucion': False,
    'tiempo_actual': 0,
    'procesos_pendientes': [],
    'procesos_completados': [],
    'gantt_data': [],
    'proceso_actual': None
}

@app.route("/iniciar-simulacion", methods=["POST"])
def iniciar_simulacion():
    global simulacion_estado
    
    datos = request.json
    algoritmo = datos.get('algoritmo', 'fcfs')
    
    # Reiniciar estado
    simulacion_estado = {
        'en_ejecucion': True,
        'tiempo_actual': 0,
        'procesos_pendientes': procesos.copy(),  # Copia de los procesos
        'procesos_completados': [],
        'gantt_data': [],
        'proceso_actual': None,
        'algoritmo': algoritmo
    }
    
    # Inicializar procesos pendientes
    for proceso in simulacion_estado['procesos_pendientes']:
        proceso['tiempo_restante'] = proceso['duracion']
        proceso['tiempo_inicio'] = None
        proceso['tiempo_final'] = None
        proceso['tiempo_espera'] = 0
    
    return jsonify({"mensaje": "Simulación iniciada", "estado": simulacion_estado})

@app.route("/paso-simulacion", methods=["POST"])
def paso_simulacion():
    global simulacion_estado
    
    if not simulacion_estado['en_ejecucion']:
        return jsonify({"error": "Simulación no iniciada"}), 400
    
    # Ejecutar un paso de simulacion
    algoritmo = simulacion_estado['algoritmo']
    proceso_ejecutando = None
    
    if algoritmo == 'fcfs':
        proceso_ejecutando = paso_fcfs()
    
    # Actualizar estado
    simulacion_estado['tiempo_actual'] += 1
    simulacion_estado['proceso_actual'] = proceso_ejecutando
    
    # Verificar si termino la simulacion
    terminado = len(simulacion_estado['procesos_completados']) == len(procesos)
    
    return jsonify({
        "estado": simulacion_estado,
        "terminado": terminado,
        "proceso_actual": proceso_ejecutando
    })

@app.route("/detener-simulacion", methods=["POST"])
def detener_simulacion():
    global simulacion_estado
    simulacion_estado['en_ejecucion'] = False
    return jsonify({"mensaje": "Simulación detenida"})

# Algoritmo FCFS paso a paso
def paso_fcfs():
    tiempo_actual = simulacion_estado['tiempo_actual']
    
    # Buscar procesos que han llegado y no han terminado
    procesos_listos = [
        p for p in simulacion_estado['procesos_pendientes'] 
        if p['llegada'] <= tiempo_actual and p['tiempo_restante'] > 0
    ]
    
    if not procesos_listos:
        # No hay procesos listos en este momento
        simulacion_estado['gantt_data'].append({
            'proceso': None,
            'inicio': tiempo_actual,
            'fin': tiempo_actual + 1
        })
        return None
    
    # Ordenar por tiempo de llegada (FCFS)
    procesos_listos.sort(key=lambda x: x['llegada'])
    proceso_actual = procesos_listos[0]
    
    # Registrar inicio si es la primera vez
    if proceso_actual['tiempo_inicio'] is None:
        proceso_actual['tiempo_inicio'] = tiempo_actual
    
    # Ejecutar el proceso por 1 unidad de tiempo
    proceso_actual['tiempo_restante'] -= 1
    
    # Registrar en Gantt
    simulacion_estado['gantt_data'].append({
        'proceso': proceso_actual['nombre'],
        'inicio': tiempo_actual,
        'fin': tiempo_actual + 1,
        'color': proceso_actual['color']
    })
    
    # Verificar si el proceso terminó
    if proceso_actual['tiempo_restante'] == 0:
        proceso_actual['tiempo_final'] = tiempo_actual + 1
        proceso_actual['tiempo_espera'] = (
            proceso_actual['tiempo_final'] - 
            proceso_actual['llegada'] - 
            proceso_actual['duracion']
        )
        
        # Mover a completados
        simulacion_estado['procesos_completados'].append(proceso_actual)
        simulacion_estado['procesos_pendientes'].remove(proceso_actual)
    
    return proceso_actual['nombre']




if __name__ == '__main__':
    app.run(debug=True)