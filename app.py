from flask import Flask, request, jsonify, render_template
from functools import total_ordering
import heapq
app = Flask(__name__)

# Arreglo de Procesos
procesos = [] 

# Arreglo de intervalos, para la simulacion de cada algoritmo
procesos_intervalos = []


# COSAS A TENER EN CUENTA
# Cuando se usa en methods GET es para mandar datos del py -> js
# Cuando se usa en methods POST es porque se me llegan datos py <- js, ademas puedo mandar mensajes desde el py

# ========== RUTA PRINCIPAL ==========

@app.route("/")
def index():
    procesos.clear()
    procesos_intervalos.clear()
    algoritmoActual = ""
    return render_template('index.html')

# ========== AGREGAR PROCESO CON VALIDACION ==========
@app.route("/agregar", methods=["POST"])
def agregar():
    try:
        datos = request.json
    
        global procesos, algoritmoActual
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
            "nombre": nombre,
            "duracion": int(datos["duracion"]),
            "llegada": int(datos["llegada"]),
            "color" : datos["color"]
        }

        # Agregar campos opcionales
        if "prioridad" in datos:
            nuevo_proceso["prioridad"] = int(datos["prioridad"])
        
        if "quantum" in datos:
            nuevo_proceso["quantum"] = int(datos["quantum"])

        algoritmoActual = datos["algoritmo"]

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
        if proceso["nombre"] == nombre:
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

    

# ====== SIMULACION =======

@app.route("/simular", methods=["GET"])
def simular():
    global procesos_intervalos, algoritmoActual

    try:
        procesos_intervalos.clear()

        if algoritmoActual == "fcfs":
            fcfs()
        elif algoritmoActual == "sjf":
            sjf()
        elif algoritmoActual == "rr":
            rr()
        elif algoritmoActual == "priority":
            prioridad()

        print("Timeline generado:", procesos_intervalos)  
        return jsonify(procesos_intervalos)
    
    except Exception as e:
        print("Error en simulación:", e)
        return jsonify({"error": str(e)}), 500

#  ========== ALGORITMOS ==========



#First Come, First Served
def fcfs():
    global procesos, procesos_intervalos
    
    if(len(procesos) == 0):
        return
    #print("hola, estoy simuando y tengo: " , len(procesos), " procesos xd")

    #ordenar por llegada
    procesos.sort(key=lambda x: x['llegada'])

    inicio_ax = procesos[0]["llegada"]
    fin_ax = procesos[0]["llegada"] + procesos[0]["duracion"] - 1

    procesos_intervalos.append({
        'nombre': procesos[0]["nombre"],
        'izq': inicio_ax,
        'der': fin_ax,
        'color': procesos[0]["color"]
    })

    for i in range(1, len(procesos)):
        inicio = 0
        fin = 0

        if(procesos[i]["llegada"] <= fin_ax):
            inicio = fin_ax + 1
        else:
            inicio = procesos[i]["llegada"]

        fin = inicio + procesos[i]["duracion"]  - 1

        

        procesos_intervalos.append({
            'nombre': procesos[i]["nombre"],
            'izq': inicio,
            'der': fin,
            'color': procesos[i]["color"]
        }) 

        fin_ax = fin
    
    return

#Shorest Job First
def sjf():
    global procesos, procesos_intervalos
    
    if len(procesos) == 0:
        return
    
    procesos.sort(key=lambda x: x['llegada'])
    
    tiempo_actual = 0
    completados = 0
    i = 0
    cola_prioridad = []
    
    while completados < len(procesos):
        # Agregar procesos que han llegado hasta el tiempo actual
        while i < len(procesos) and procesos[i]["llegada"] <= tiempo_actual:
            heapq.heappush(cola_prioridad, (procesos[i]['duracion'], procesos[i]['llegada'], i))
            i += 1
        
        if len(cola_prioridad) >= 1:
            duracion, llegada, idx = heapq.heappop(cola_prioridad)
            proceso = procesos[idx]
            
            
            
            inicio = tiempo_actual
            fin = inicio + duracion - 1
            
            procesos_intervalos.append({
                'nombre': proceso['nombre'],
                'izq': inicio,
                'der': fin,
                'color': proceso['color']
            })
            
            # Actualizar tiempo_actual despues de terminar el proceso
            tiempo_actual = fin + 1
            completados += 1
            
        else:
            # Saltar al proximo proceso que llega
            if i < len(procesos):
                tiempo_actual = procesos[i]["llegada"]
            else:
                break

#Round Robin
def rr():
    global procesos, procesos_intervalos
    
    if len(procesos) == 0:
        return
    
    quantum = procesos[0]["quantum"]
    procesos.sort(key=lambda x: x['llegada'])
    
    # Crear copia con tiempo restante
    procesos_rr = []
    for p in procesos:
        procesos_rr.append({
            'nombre': p['nombre'],
            'llegada': p['llegada'],
            'duracion': p['duracion'],
            'tiempo_restante': p['duracion'],
            'color': p['color']
        })
    
    tiempo_actual = procesos_rr[0]['llegada']
    cola = []
    i = 0
    completados = 0
    
    while completados < len(procesos_rr):
        # Agregar procesos que ya llegaron
        while i < len(procesos_rr) and procesos_rr[i]['llegada'] <= tiempo_actual:
            cola.append(procesos_rr[i])
            i += 1
        
        if cola:
            proceso_actual = cola.pop(0)
            
            tiempo_ejecucion = min(quantum, proceso_actual['tiempo_restante'])
            inicio = tiempo_actual
            fin = inicio + tiempo_ejecucion - 1
            
            procesos_intervalos.append({
                'nombre': proceso_actual['nombre'],
                'izq': inicio,
                'der': fin,
                'color': proceso_actual['color']
            })
            
            proceso_actual['tiempo_restante'] -= tiempo_ejecucion
            tiempo_actual = fin + 1

            # Primero añadimos los procesos que llegaron durante la ejecucion (no en fin + 1)
            nuevos = []
            while i < len(procesos_rr) and procesos_rr[i]['llegada'] <= fin:
                nuevos.append(procesos_rr[i])
                i += 1

            cola.extend(nuevos)

            # Si no termino, se vuelve a poner al final
            if proceso_actual['tiempo_restante'] > 0:
                cola.append(proceso_actual)

            # Ahora añadimos los que llegaron exactamente al final del quantum (fin + 1)
            while i < len(procesos_rr) and procesos_rr[i]['llegada'] <= tiempo_actual:
                cola.append(procesos_rr[i])
                i += 1

            if proceso_actual['tiempo_restante'] == 0:
                completados += 1

        else:
            # Si la cola esta vacia, avanzamos al siguiente proceso
            if i < len(procesos_rr):
                tiempo_actual = procesos_rr[i]['llegada']
            else:
                break


  
# Por Prioridad
def prioridad():
    global procesos, procesos_intervalos
    
    if len(procesos) == 0:
        return
    
    # Ordenar por llegada inicialmente
    procesos.sort(key=lambda x: x['llegada'])
    procesos_intervalos.clear()
    
    tiempo_actual = 0
    completados = 0
    i = 0
    cola_prioridad = []
    
    while completados < len(procesos):
        # Agregar procesos que han llegado hasta el tiempo actual
        while i < len(procesos) and procesos[i]["llegada"] <= tiempo_actual:
            # Usar prioridad como primer elemento (menor numero = mayor prioridad)
            heapq.heappush(cola_prioridad, (procesos[i]['prioridad'], procesos[i]['llegada'], i))
            i += 1
        
        if cola_prioridad:
            # Sacar el proceso con mayor prioridad (menor numero)
            prioridad_val, llegada, idx = heapq.heappop(cola_prioridad)
            proceso = procesos[idx]
            
            inicio = tiempo_actual
            fin = inicio + proceso['duracion'] - 1
            
            procesos_intervalos.append({
                'nombre': proceso['nombre'],
                'izq': inicio,
                'der': fin,
                'color': proceso['color']
            })
            
            tiempo_actual = fin + 1
            completados += 1
            
        else:
            # Saltar al proximo proceso que llega
            if i < len(procesos):
                tiempo_actual = procesos[i]["llegada"]
            else:
                break


if __name__ == '__main__':
    app.run(debug=True)