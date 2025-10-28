from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

procesos = []



@app.route("/agregar_proceso", methods = ["POST"])
def agregar():
    data = request.get_json()

    proceso = {
        "id" : data["id"],
        "llegada" : data["llegada"],
        "duracion" : data["duracion"],
        "prioridad" : data["prioridad"]
    }
    
    procesos.append(proceso)

    return {"ok" : "ok"}

@app.route("/eliminar_proceso", methods = ["POST"])
def eliminar():
    data = request.get_json()
    for i in procesos:
        if str(i["id"]) == str(data["id"]):
            procesos.remove(i)
            break
    
    return {"ok" : "ok"}

@app.route("/modificar_proceso", methods = ["POST"])
def modificar():
    data = request.get_json()
    for i in procesos:
        if str(i["id"]) == str(data["id"]):
            i["llegada"] = data["llegada"]
            i["duracion"] = data["duracion"]
            i["prioridad"] = data["prioridad"]
            break
    
    for i in procesos:
        print(i)

    return {"ok" : "ok"}


# AQUI VA TODAS NUEVAS DIRECCIONES DE LAS PAGINAS

@app.route('/fcfs')
def fcfs():
    return render_template('fcfs.html')

@app.route('/sjf')
def sjf():
    return render_template('sjf.html')

@app.route('/prioridad')
def prioridad():
    return render_template('prioridad.html')

@app.route('/rr')
def rr():
    return render_template('rr.html')

@app.route('/colas')
def colas():
    return render_template('colas.html')


@app.route('/') #Define la ruta
def index(): #index es la ruta por defecto que llama flask
    procesos = []
    return render_template('index.html') #Manda la ruta a https::algo/index.html


if __name__ == '__main__':
    app.run(debug=True)
