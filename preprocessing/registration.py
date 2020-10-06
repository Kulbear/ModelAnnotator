import numpy as np
import trimesh
import open3d as o3d
from probreg import cpd
from geometry import load_obj, normalize_pts, rotate_pts, export_obj


def icp_call(filename_source, filename_sample, save_name):
    dis_error0, vertices0, faces_fix0 = icp_adjust(filename_source, filename_sample, save_name=pure_name, rotate=0)
    dis_error1, vertices1, faces_fix1 = icp_adjust(filename_source, filename_sample, save_name=pure_name, rotate=90)
    if (dis_error0 > 0.001 and dis_error1 > 0.001):
        print("ICP failed!")
    else:
        if dis_error0 < dis_error1:
            mesh_p = trimesh.Trimesh(vertices=np.asarray(vertices0), faces=faces_fix0 - 1)
            mesh_p.export(save_name + ".obj")
        else:
            mesh_p = trimesh.Trimesh(vertices=np.asarray(vertices1), faces=faces_fix1 - 1)
            mesh_p.export(save_name + ".obj")


def icp_adjust(filename_source, filename_sample, save_name, rotate=90):
    # load source
    vertices, faces_fix = load_obj(filename_source)
    # rotate and rescale
    vertices = rotate_pts(vertices, theta=rotate, phi=0)
    vertices = normalize_pts(vertices)

    # resample evenly on faces and get sample
    current_mesh = trimesh.Trimesh(vertices=vertices, faces=faces_fix - 1)
    verts_samples, _ = trimesh.sample.sample_surface_even(current_mesh, 20000)

    # load 10000 sampled points
    sample_mesh = trimesh.load(filename_sample)
    verts = sample_mesh.vertices

    # get ICP here
    source = o3d.geometry.PointCloud()
    source.points = o3d.utility.Vector3dVector(verts_samples)
    target = o3d.geometry.PointCloud()
    target.points = o3d.utility.Vector3dVector(verts)
    # # downsample the voxelsize
    source = source.voxel_down_sample(voxel_size=0.04)
    target = target.voxel_down_sample(voxel_size=0.04)
    # -------compute cpd registration using down_sampled
    tf_param, dis_error, _ = cpd.registration_cpd(source, target, tf_type_name='rigid')

    # use different rotation
    if dis_error > 0.001:
        icp_adjust(filename_source, filename_sample, save_name, rotate=0)
    else:
        # # # transform the source pcd to current
        result_verts = tf_param.transform(vertices)
        mesh_p = trimesh.Trimesh(vertices=np.asarray(result_verts), faces=faces_fix - 1)
        mesh_p.export(save_name + ".obj")

    return dis_error, result_verts, faces_fix


if __name__ == '__main__':

    import os

    models = os.listdir("./models/")
    for pure_name in models:
        print('Working on', pure_name)
        filename_source = f"./models/{pure_name}//objs//source.obj"
        filename_sample = f"./models/{pure_name}/point_sample/ply-10000.ply"

        icp_adjust(filename_source, filename_sample, save_name=pure_name)
