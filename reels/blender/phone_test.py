"""Ray-traced test frame: the phone (real proportions, no logos) with a page of the website on its screen, rendered with
Cycles over a transparent background, to compare against the in-browser 3D.
Usage: <venv>/bin/python blender/phone_test.py <screen.png> <out.png> [samples]"""
import math
import sys

import bpy  # noqa: I001 (bmesh is only importable once bpy is loaded)
import bmesh

SCREEN, OUT = sys.argv[1], sys.argv[2]
SAMPLES = int(sys.argv[3]) if len(sys.argv) > 3 else 96

W, H, T, R = 0.776, 1.63, 0.0825, 0.112  # 77.6 x 163 x 8.25 mm, 1 unit = 100 mm
SW = 0.735
SH = SW * 844 / 390

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def rounded_rect(w, h, r, n=24):
    pts = []
    for cx, cy, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def slab(name, w, h, r, depth, bevel, mats):
    """A rounded-rectangle slab: width along X, height along Z, thickness along Y; front face towards -Y.
    mats = (side, front, back); its rim edges bevelled by `bevel`."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    pts = rounded_rect(w, h, r)
    front = [bm.verts.new((x, -depth / 2, z)) for x, z in pts]
    back = [bm.verts.new((x, depth / 2, z)) for x, z in pts]
    n = len(pts)
    f_front = bm.faces.new(list(reversed(front)))
    f_back = bm.faces.new(back)
    sides = [bm.faces.new((front[i], front[(i + 1) % n], back[(i + 1) % n], back[i])) for i in range(n)]
    f_front.material_index, f_back.material_index = 1, 2
    for s in sides:
        s.material_index = 0
    rim = [e for e in bm.edges if (e.link_faces[0] in (f_front, f_back)) != (e.link_faces[1] in (f_front, f_back))]
    bmesh.ops.bevel(bm, geom=rim, offset=bevel, segments=6, affect='EDGES', profile=0.5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    for m in mats:
        ob.data.materials.append(m)
    return ob


def flat(name, w, h, r, y, mat):
    """A flat rounded rectangle facing -Y at depth y, UVs spread over its bounds."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    vs = [bm.verts.new((x, y, z)) for x, z in rounded_rect(w, h, r, 32)]
    bm.faces.new(list(reversed(vs)))
    uv = bm.loops.layers.uv.new()
    for f in bm.faces:
        for lp in f.loops:
            x, _, z = lp.vert.co
            lp[uv].uv = ((x + w / 2) / w, (z + h / 2) / h)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    ob.data.materials.append(mat)
    return ob


def principled(name, color, metallic=0.0, rough=0.3, coat=0.0, coat_rough=0.03):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Metallic'].default_value = metallic
    b.inputs['Roughness'].default_value = rough
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Coat Roughness'].default_value = coat_rough
    return m


METAL = principled('metal', (0.80, 0.80, 0.82), 1.0, 0.22)
GLASS_BLACK = principled('black glass', (0.004, 0.004, 0.005), 0.0, 0.04, 1.0, 0.02)
BACK = principled('back', (0.78, 0.78, 0.80), 0.3, 0.5, 0.6, 0.15)

# the screen: the page as light, under glass that reflects the studio
SCR = bpy.data.materials.new('screen')
SCR.use_nodes = True
nt = SCR.node_tree
nt.nodes.clear()
out = nt.nodes.new('ShaderNodeOutputMaterial')
img = nt.nodes.new('ShaderNodeTexImage')
img.image = bpy.data.images.load(SCREEN)
img.interpolation = 'Cubic'
emit = nt.nodes.new('ShaderNodeEmission')
emit.inputs['Strength'].default_value = 1.0
gloss = nt.nodes.new('ShaderNodeBsdfGlossy')
gloss.inputs['Roughness'].default_value = 0.02
fres = nt.nodes.new('ShaderNodeFresnel')
fres.inputs['IOR'].default_value = 1.5
mix = nt.nodes.new('ShaderNodeMixShader')
nt.links.new(img.outputs['Color'], emit.inputs['Color'])
nt.links.new(fres.outputs['Fac'], mix.inputs['Fac'])
nt.links.new(emit.outputs['Emission'], mix.inputs[1])
nt.links.new(gloss.outputs['BSDF'], mix.inputs[2])
nt.links.new(mix.outputs['Shader'], out.inputs['Surface'])

phone = bpy.data.objects.new('phone', None)
scene.collection.objects.link(phone)
body = slab('body', W, H, R, T, 0.009, (METAL, GLASS_BLACK, BACK))
screen = flat('screen', SW, SH, 0.098, -T / 2 - 0.0008, SCR)
island = flat('island', 0.205, 0.06, 0.03, -T / 2 - 0.0012, GLASS_BLACK)
island.location.z = SH / 2 - 0.058
plateau = slab('plateau', 0.33, 0.33, 0.07, 0.016, 0.005, (BACK, BACK, BACK))
plateau.location = (-0.17, T / 2 + 0.006, 0.6)
for i, (x, z) in enumerate(((-0.075, 0.075), (-0.075, -0.075), (0.075, 0))):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.05, depth=0.016, location=(-0.17 + x, T / 2 + 0.02, 0.6 + z), rotation=(math.pi / 2, 0, 0))
    lens = bpy.context.object
    lens.data.materials.append(principled(f'lens{i}', (0.01, 0.01, 0.015), 0.3, 0.06, 1.0))
    lens.parent = phone
for s, z, h in ((-1, 0.42, 0.06), (-1, 0.27, 0.11), (-1, 0.12, 0.11), (1, 0.3, 0.17), (1, -0.18, 0.1)):
    b = slab(f'btn{z}', 0.03, h, 0.012, 0.012, 0.003, (METAL, METAL, METAL))
    b.rotation_euler = (0, 0, math.pi / 2)
    b.location = (s * (W / 2 + 0.004), 0, z)
    b.parent = phone
for ob in (body, screen, island, plateau):
    ob.parent = phone
phone.rotation_euler = (math.radians(4), 0, math.radians(-14))  # a three-quarter turn, as in the film
phone.location = (0, 0, -0.14)

# studio: large soft area lights and a faint violet-white world
def area(name, size, loc, rot, power, color=(1, 1, 1)):
    l = bpy.data.lights.new(name, 'AREA')
    l.shape = 'RECTANGLE'
    l.size, l.size_y = size
    l.energy = power
    l.color = color
    ob = bpy.data.objects.new(name, l)
    ob.location, ob.rotation_euler = loc, rot
    scene.collection.objects.link(ob)

area('key', (3, 8), (-4.5, -3, 1.5), (math.radians(90), 0, math.radians(-55)), 900)
area('fill', (3, 8), (4.5, -2.5, 1), (math.radians(90), 0, math.radians(55)), 600)
area('top', (6, 2), (0, -1, 5), (0, 0, 0), 500)
area('rim', (6, 1), (0, 4, 1.5), (math.radians(-90), 0, 0), 450, (0.85, 0.8, 1.0))
world = bpy.data.worlds.new('world')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.92, 0.9, 0.98, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35
scene.world = world

cam = bpy.data.cameras.new('cam')
cam.sensor_fit = 'VERTICAL'
cam.sensor_height = 24
cam.lens = 24 / (2 * math.tan(math.radians(13)))
camob = bpy.data.objects.new('cam', cam)
camob.location = (0, -6.1, 0)
camob.rotation_euler = (math.radians(90), 0, 0)
scene.collection.objects.link(camob)
scene.camera = camob

r = scene.render
r.engine = 'CYCLES'
r.resolution_x, r.resolution_y, r.resolution_percentage = 1080, 1920, 100
r.film_transparent = True
r.image_settings.file_format = 'PNG'
r.image_settings.color_mode = 'RGBA'
r.filepath = OUT
scene.cycles.device = 'CPU'
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.view_settings.view_transform = 'Standard'
bpy.ops.render.render(write_still=True)
print('rendered', OUT)
