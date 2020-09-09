from flask import Flask, jsonify
from flask_cors import CORS
from find_candidate_joints import part_joints
app = Flask(__name__)
CORS(app)

# MODEL_FILE_PATH = 'C:/Users/Darker White/Documents/GitHub/ModelAnnotator/models'
MODEL_FILE_PATH = '../models'

@app.route('/')
def index():
    return "Hello, World!"

@app.route('/api/v0.1/candidate_joints/<int:model_id>')
def get_candidate_joints(model_id):
    fpath = f'{MODEL_FILE_PATH}/{model_id}/point_sample/'
    fname_label = fpath + 'label-10000.txt'
    fname_verts = fpath + 'pts-10000.txt'

    array = part_joints(fname_label, fname_verts, save_name='test2')
    # print(array)
    # print({'joints': array.tolist()})
    return jsonify({'joints': array.tolist()}) 

if __name__ == '__main__':
    app.run(debug=True, port=5000)
