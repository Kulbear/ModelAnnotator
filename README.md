# ModelAnnotator

## Introduction

A simple annotation tool for annotating keypoints for 3D models. Now compatible with PartNet data and 3D models with PLY format.

## Installation

### Backend

We provide a simple backend server written in Flask: a popular Python web framework. You need to use `pip` to install the dependencies. Suppose you are at the root directory of this project, run the following command to install everything you need for the backend

```
pip install -r requirements.txt
```

### Frontend

You don't need to do anything to setup the frontend.

## Usage (READ CAREFULLY)

### Program Usage

You need to run the backend server first, suppose you are at the root directory, do

```
cd backend
python app.py
```

You should see something similar to the following lines displayed in your terminal

```
 * Serving Flask app "app" (lazy loading)
 * Environment: production
   WARNING: This is a development server. Do not use it in a production deployment.
   Use a production WSGI server instead.
 * Debug mode: on
 * Restarting with stat
 * Debugger is active!
 * Debugger PIN: 134-862-198
 * Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)
```

Now you are good with the backend.

**You need to use the live server plugin in VSCode to run the website.**

Open the project in VSCode, and open the `index.html` in your editor. If you have the `live server` plugin installed, simple click the `Go Live` button at the bottom right corner of the editor. Otherwise, install the live server first. See [this link](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).

### Prepare the data

Let's make sure you have the models ready to use. At the time of this README being written, it is most likely that you obtain these models from the author of this project, so very likely you don't need to worry about this.

In order to proceed, you should have your models in the `models` folder, placed in a folder with the model ID. For example, I have two models with ID `172` and `286`, then the model folder should looks like this

```
- models
    - 172
        - ...
    - 286
        - ...
```

The folder structure inside should be as same as the PartNet data.

Please contact the author of this project for more details and bugs.

## Project Structure

### `backend`

Contains backend code written in Python.

It provides APIs for 
- load candidate joints (PartNet data only)
    - `/api/v0.1/candidate_joints/<int:model_id>`, accepts `GET` request.
- save annotation joint to json file.
    - `/api/v0.1/save_joints/<model_id>`, accepts `POST` request.
- load existing model annotation from local disk
    - `/api/v0.1/load_annotation/<model_id>`, accept `GET` and `POST` request.

### `preprocessing`

The PartNet dataset contains preprocessing for the original ShapeNet model that is not publicly released.
We try to use point cloud registration algorithm to find the transformation used during that preprocessing.

### Front-end

- `index.html`, the front page
- `js/main.js`, JS-based logic, currently it's huge, really need some refactoring works.
- `js/third-party`, thrid-party libs like bootstrap, jQuery...
- `css/`, you know :D
- `threejs`, the three.js lib, cloned from GitHub.
