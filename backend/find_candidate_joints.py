#!/usr/bin/python
# -*- coding: utf-8 -*-

import numpy as np
import scipy
import trimesh
from sklearn.cluster import KMeans
from scipy.spatial.distance import cdist
from sklearn.neighbors import NearestNeighbors, KDTree


def knnsearch(target, source, metrics='euclidean', k_size=1, leaf_sizes=30):
    # make sure they have the same size
    if not (target.shape[1] == source.shape[1]):
        raise ('Two Inputs are not same size or They need to be [N(size), D(dimension)] input')
    kdt_build = KDTree(target, leaf_size=leaf_sizes, metric=metrics)
    distances, indices = kdt_build.query(source, k=k_size)
    averagedist = np.sum(distances) / (source.shape[0])  # assume shape [N,D]
    return distances, averagedist, indices


# function returns WSS score for k values from 1 to kmax
def get_endjoints(vertices, kmax=4):
    # we assume the y_min
    min_y = np.amin(vertices, axis=0)[1]
    min_idx = np.squeeze(np.where(vertices[:, 1] < min_y + 0.005))
    pts_all = vertices[min_idx, :]

    ptsx, ptsz = pts_all[:, 0], pts_all[:, 2]
    points = np.transpose(np.vstack((ptsx, ptsz)))

    # just use 1_cluster
    if min_idx.shape[0] < kmax + 3:
        kmax = 1

    sse = []
    pred_clusters = []
    for k in range(1, kmax + 1):
        kmean_model = KMeans(n_clusters=k).fit(points)
        centroids = kmean_model.cluster_centers_

        pred_clusters.append(kmean_model.predict(points))

        kmean_model.fit(points)
        sse.append((sum(np.min(cdist(points, kmean_model.cluster_centers_, 'euclidean'), axis=1)) / points.shape[0]))

    # calculate the choice_score
    choice_score = []
    for k in range(len(sse) - 1):
        choice_score.append((sse[k] - sse[k + 1]) / sse[k + 1])

    # select the number of points
    select_idx = np.where(np.asarray(choice_score) < 0.25)
    if (len(np.squeeze(select_idx)) == 0):
        select_idx = 1

    min_idx = np.amin(select_idx)

    # use the min_idx get the current position
    pos_mean = []
    for k in range(min_idx + 1):
        idx = np.where(pred_clusters[min_idx] == k)
        pos_mean.append(np.mean(np.squeeze(pts_all[idx, :]), axis=0))

    return np.asarray(pos_mean)


def part_joints(fname_label, fname_verts, save_name="test", threshold=0.020):
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
    partsMean = []
    for i in range(num_parts):
        verts_current = mesh[i]
        mean_verts = np.mean(verts_current, axis=0)
        partsMean.append(mean_verts)

        for j in range(i + 1, num_parts):
            verts_i = mesh[i]
            verts_j = mesh[j]

            distance, _, _ = knnsearch(verts_j, verts_i)
            min_dist = np.min(distance)

            if min_dist > threshold:
                continue

            idx = np.where(distance < threshold)

            if len(idx[0]) > 1:
                boundary_verts = np.squeeze(verts_i[idx[0], :])
                center_joints = np.mean(boundary_verts, axis=0)
            else:
                center_joints = np.squeeze(verts_i[idx[0], :])

            interJoints.append(center_joints)

    partsMean_array = np.asarray(partsMean)
    interJoints_array = np.asarray(interJoints)

    # get the endjoints
    endjoints = get_endjoints(verts, kmax=8)
    # stack the joints
    joints_stack = np.vstack((interJoints_array, endjoints))

    # np.save(save_name+".npy", joints_stack)
    # mesh = trimesh.Trimesh(vertices = joints_stack,
    #                        process = False)
    # mesh.export(save_name+".ply")

    return joints_stack


if __name__ == '__main__':
    fpath = 'models/286/point_sample/'
    fname_label = fpath + 'label-10000.txt'
    fname_verts = fpath + 'pts-10000.txt'

    array = part_joints(fname_label, fname_verts, save_name='test2')
