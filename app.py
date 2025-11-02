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

if __name__ == '__main__':
    app.run(debug=True)