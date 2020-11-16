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
    # TODO: change file path
    with open(f'../{model_id}.json', 'w') as f:
        data = json.loads(data)
        json.dump(data, f)
    return jsonify({
        'status': 200
    })


@app.route('/api/v0.1/load_annotation/<model_id>', methods=['GET', 'POST'])
def load_annotation_from_disk(model_id):
    data = request.data.decode('utf-8')
    try:
        # TODO: change file path
        with open(f'../{model_id}.json', 'r') as f:
            data = f.read()
            data = json.loads(data)

        valid_joints = [item for item in data['joints'] if item['category'] != None and item['index'] != None]
        valid_chains = []
        for chain in data['chains']:
            all_index = True
            for item in chain:
                if item[0] is None:
                    all_index = False
            if all_index:
                valid_chains.append(chain)

        processed_data = {
            'with_annotation': True,
            'modelId': data['modelId'],
            'modelType': data['modelType'],
            'joints': valid_joints,
            'chains': valid_chains
        }

        return jsonify(processed_data)
    except:
        return jsonify({
            'with_annotation': False
        })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
