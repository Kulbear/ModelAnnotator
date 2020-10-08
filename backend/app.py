from flask import Flask, jsonify, request
from flask_cors import CORS
from find_candidate_joints import part_joints
import json

app = Flask(__name__)
CORS(app)

MODEL_FILE_PATH = '../models'


@app.route('/')
def index():
    return "Hello, welcome to Model Annotator backend API!"


@app.route('/api/v0.1/candidate_joints/<int:model_id>')
def get_candidate_joints(model_id):
    # we only load candidate joints from partnet data
    try:
        fpath = f'{MODEL_FILE_PATH}/{model_id}'

        fname_label = fpath + '/point_sample/label-10000.txt'
        fname_verts = fpath + '/point_sample/pts-10000.txt'

        with open(fpath + '/meta.json') as f:
            data = json.load(f)

        array = part_joints(fname_label, fname_verts, save_name='test')
        return jsonify({
            'joints': array.tolist(),
            'model_cat': data['model_cat']
        })
    except Exception as e:
        return jsonify({
            'joints': [],
            'model_cat': 'Unknown'
        })


@app.route('/api/v0.1/save_joints/<model_id>', methods=['POST'])
def save_candidate_joints(model_id):
    data = request.data.decode('utf-8')
    with open(f'../{model_id}.json', 'w') as f:
        data = json.loads(data)
        json.dump(data, f)
    return jsonify({
        'status': 200
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
