#!/usr/bin/python
# -*- coding: utf-8 -*-
import numpy as np
import scipy
import trimesh
from sklearn.neighbors import NearestNeighbors, KDTree


def knnsearch(target, source, metrics='euclidean', k_size=1, leaf_sizes=30, ):
    # make sure they have the same size

    if not target.shape[1] == source.shape[1]:
        raise 'Two Inputs are not same size or They need to be [N(size), D(dimension)] input'
    kdt_build = KDTree(target, leaf_size=leaf_sizes, metric=metrics)
    (distances, indices) = kdt_build.query(source, k=k_size)
    averagedist = np.sum(distances) / source.shape[0]  # assume shape [N,D]
    return (distances, averagedist, indices)


def part_joints(fname_label, fname_verts, save_name='test', threshold=0.020, ):
    # read txt
    verts_label = np.loadtxt(fname_label)
    verts = np.loadtxt(fname_verts)

    # get parts
    labels = np.unique(verts_label)
    num_parts = labels.shape[0]

    mesh = []
    for k in range(num_parts):
        tmp_label = labels[k]
        Ind = np.where(verts_label == tmp_label)

        current_verts = np.squeeze(verts[Ind, :])
        mesh.append(current_verts)

    interJoints = []
    for i in range(num_parts):
        for j in range(i + 1, num_parts):
            verts_i = mesh[i]
            verts_j = mesh[j]

            (distance, _, _) = knnsearch(verts_j, verts_i)
            min_dist = np.min(distance)

            if min_dist > threshold:
                continue

            idx = np.where(distance < threshold)
            boundary_verts = np.squeeze(verts_i[idx[0], :])
            center_joints = np.mean(boundary_verts, axis=0)

            interJoints.append(center_joints)

    interJoints_array = np.asarray(interJoints)

    mesh = trimesh.Trimesh(vertices=interJoints_array, process=False)
    # THESE TWO FKING LINES OF CODE will cause the browser to force refresh. I have fking no idea why.
    # np.save(save_name + '.npy', interJoints_array)
    # mesh.export(save_name + '.ply')
    return interJoints_array


if __name__ == '__main__':
    fpath = 'models/286/point_sample/'
    fname_label = fpath + 'label-10000.txt'
    fname_verts = fpath + 'pts-10000.txt'

    array = part_joints(fname_label, fname_verts, save_name='test2')
