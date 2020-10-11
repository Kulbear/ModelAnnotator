# ModelAnnotator

## Introduction

A simple annotation tool for annotating keypoints for 3D models.

## Project Structure

### `backend`

Contains backend code written in Python.

It provides APIs for 
- loading candidate joints (PartNet data only)
    - `/api/v0.1/candidate_joints/<int:model_id>`, accepts `GET` request.
- saving annotation joint to json file.
    - `/api/v0.1/save_joints/<model_id>`, accepts `POST` request.

### `preprocessing`

The PartNet dataset contains preprocessing for the original ShapeNet model that is not publicly released.
We try to use point cloud registration algorithm to find the transformation used during that preprocessing.

### Front-end

- `index.html`, the front page
- `js/main.js`, JS-based logic
- `js/third-party`, thrid-party libs like bootstrap, jQuery...
- `css/`, you know :D
- `threejs`, the three.js lib, cloned from GitHub.
