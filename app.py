from flask import Flask, render_template

app = Flask(__name__)

@app.route('/') #Define la ruta
def index(): #index es la ruta por defecto que llama flask
    return render_template('index.html') #Manda la ruta a https::algo/index.html


if __name__ == '__main__':
    app.run(debug=True)
