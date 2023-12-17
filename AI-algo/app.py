from flask import Flask, request, jsonify
from flask_cors import CORS
from chroma import store_and_compare_embeddings

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/', methods=['POST'])
def process_image():
    image_url = request.json.get('image')
    if not image_url:
        return 'Missing image URL', 400

    similarities = store_and_compare_embeddings(image_url)
    return jsonify(similarities)

if __name__ == '__main__':
    app.run(debug=True, port=3001)
