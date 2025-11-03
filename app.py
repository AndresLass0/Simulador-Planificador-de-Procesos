from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Arreglo de Procesos
procesos = [] 

# Arreglo de intervalos, para la simulacion de cada algoritmo
procesos_intervalos = []

# algoritmo que se va a usar
algoritmoActual = ""

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
        procesos_intervalos = []

        if algoritmoActual == "fcfs":
            fcfs()

        print("Timeline generado:", procesos_intervalos)  
        return jsonify(procesos_intervalos)
    
    except Exception as e:
        print("Error en simulación:", e)
        return jsonify({"error": str(e)}), 500

#  ========== ALGORITMOS ==========


# nuevo_proceso = {
#     'nombre': nombre,
#     'llegada': int(datos['llegada']),
#     'duracion': int(datos['duracion']),
#     'color': datos.get('color')
# }

#First Come, First Served
def fcfs():
    global procesos, procesos_intervalos
    
    if(len(procesos) == 0):
        return
    #print("hola, estoy simuando y tengo: " , len(procesos), " procesos xd")
    l_ax = procesos[0]["llegada"]
    r_ax = procesos[0]["llegada"] + procesos[0]["duracion"] - 1

    procesos_intervalos.append({
        'nombre': procesos[0]["nombre"],
        'izq': l_ax,
        'der': r_ax,
        'color': procesos[0]["color"]
    })

    for i in range(1, len(procesos)):
        l = 0
        r = 0

        if(procesos[i]["llegada"] <= r_ax):
            l = r_ax+1
        else:
            l = procesos[i]["llegada"]

        r = l+procesos[i]["duracion"]  - 1

        procesos_intervalos.append({
            'nombre': procesos[i]["nombre"],
            'izq': l,
            'der': r,
            'color': procesos[i]["color"]
        }) 
    
    return




if __name__ == '__main__':
    app.run(debug=True)