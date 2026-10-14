import math, sys
YAW=math.radians(float(sys.argv[1]) if len(sys.argv)>1 else 35)
PITCH=math.radians(float(sys.argv[2]) if len(sys.argv)>2 else 22)
S=34.0
def P(x,y,z):
    X= x*math.cos(YAW) - y*math.sin(YAW)
    D= x*math.sin(YAW) + y*math.cos(YAW)
    sx= X
    sy= -(z*math.cos(PITCH) + D*math.sin(PITCH))
    return (sx*S, sy*S)
paths=[]   # (cls, list of 3d points, closed)
def poly(pts,closed=False,cls='ln'): paths.append((cls,pts,closed))
def extrude(profile, y0, y1, cls='ln', connect=True, every=1):
    a=[(x,y0,z) for x,z in profile]; b=[(x,y1,z) for x,z in profile]
    poly(a,True,cls); poly(b,True,cls)
    if connect:
        for i in range(0,len(profile),every): poly([a[i],b[i]],False,cls)
def box(x0,x1,y0,y1,z0,z1,cls='ln'):
    extrude([(x0,z0),(x1,z0),(x1,z1),(x0,z1)],y0,y1,cls)
def circle_y(cx,y,cz,r,n=18,cls='ln'):
    poly([(cx+r*math.cos(2*math.pi*i/n),y,cz+r*math.sin(2*math.pi*i/n)) for i in range(n)],True,cls)
def offset_beam(center, half_w, top, bot):
    # center: list of (x,z); top/bot thickness per point
    up=[];dn=[]
    for i,(x,z) in enumerate(center):
        if i==0: dx,dz=center[1][0]-x,center[1][1]-z
        elif i==len(center)-1: dx,dz=x-center[i-1][0],z-center[i-1][1]
        else: dx,dz=center[i+1][0]-center[i-1][0],center[i+1][1]-center[i-1][1]
        L=math.hypot(dx,dz); nx,nz=-dz/L,dx/L
        up.append((x+nx*top[i],z+nz*top[i])); dn.append((x-nx*bot[i],z-nz*bot[i]))
    prof=up+dn[::-1]
    return prof, len(up)

# --- вериги (две, с ребра) ---
track=[(-2.25,0.18),(-2.0,0.0),(2.0,0.0),(2.25,0.18),(2.3,0.62),(2.05,0.88),(-2.05,0.88),(-2.3,0.62)]
for yc in (-1.15,1.15):
    y0,y1=yc-0.32,yc+0.32
    extrude(track,y0,y1)
    # ребра (грайфери) по горната повърхност и отпред
    for i in range(0,21):
        x=-2.0+4.1*i/20
        poly([(x,y0,0.88),(x,y1,0.88)],False,'fine')
        poly([(x,y0,0.0),(x,y1,0.0)],False,'fine')
    for t in range(1,5):
        f=t/5; poly([(2.25+0.05*f,y0,0.18+0.44*f),(2.25+0.05*f,y1,0.18+0.44*f)],False,'fine')
        poly([(-2.25-0.05*f,y0,0.18+0.44*f),(-2.25-0.05*f,y1,0.18+0.44*f)],False,'fine')
    # ролки и звезди от външната страна
    yo= y1 if yc>0 else y0
    for x in (-1.3,-0.65,0,0.65,1.3): circle_y(x,yo,0.2,0.13,12,'fine')
    circle_y(1.95,yo,0.45,0.32,18); circle_y(-1.95,yo,0.45,0.32,18)
    circle_y(1.95,yo,0.45,0.12,10,'fine'); circle_y(-1.95,yo,0.45,0.12,10,'fine')
    poly([(-1.7,yo,0.62),(1.7,yo,0.62)],False,'fine')
# --- ходова рама ---
box(-0.6,0.6,-0.85,0.85,0.55,1.05)
# --- въртяща се платформа ---
house=[(-2.3,1.12),(1.25,1.12),(1.25,2.05),(-2.3,2.05)]
extrude(house,-1.3,1.3)
# противотежест (заоблена отзад)
cw=[(-2.3,1.05),(-2.75,1.15),(-2.85,1.55),(-2.75,2.0),(-2.3,2.1)]
extrude(cw,-1.3,1.3,every=1)
# капак на двигателя — решетки
for i in range(6): poly([(-2.1+0.18*i,-1.3,1.25),(-2.1+0.18*i,-1.3,1.85)],False,'fine')
poly([(-1.9,-0.6,2.05),(-1.9,-0.6,2.35),(-1.75,-0.6,2.35),(-1.75,-0.6,2.05)],False)  # ауспух
# --- кабина (вляво отпред) ---
cab=[(-0.1,2.05),(1.25,2.05),(1.2,3.1),(0.98,3.35),(-0.1,3.35)]
extrude(cab,0.35,1.25)
# стъкла
poly([(1.17,0.45,2.25),(1.12,0.45,2.9),(0.97,0.45,3.07),(0.97,0.45,2.25)],True,'fine')   # предно (вътрешно)
win=[(0.0,2.4),(0.85,2.4),(0.85,3.25),(0.0,3.25)]
poly([(x,1.25,z) for x,z in win],True,'fine')
poly([(x,1.25,z) for x,z in [(0.92,2.35),(1.15,2.35),(1.12,3.05),(0.95,3.28),(0.92,3.08)]],True,'fine')
poly([(1.24,0.42,2.3),(1.19,0.42,2.9),(1.19,1.18,2.9),(1.24,1.18,2.3)],True,'fine')
# --- стрела (банан) ---
bc=[(1.0,1.55),(2.0,2.9),(3.0,3.85),(3.9,4.25),(4.6,4.1),(5.05,3.55)]
prof,n=offset_beam(bc,0,[0.32,0.36,0.34,0.3,0.26,0.22],[0.28,0.36,0.34,0.3,0.26,0.22])
extrude(prof,-0.28,0.28,every=1)
# --- рамо ---
ac=[(4.75,4.35),(5.05,3.55),(5.45,2.2),(5.7,1.25)]
prof,n=offset_beam(ac,0,[0.2,0.24,0.2,0.16],[0.2,0.24,0.2,0.16])
extrude(prof,-0.22,0.22)
# --- кофа ---
bk=[(5.55,1.45),(6.25,1.35),(6.6,0.95),(6.55,0.45),(6.05,0.3),(5.75,0.62),(5.6,1.0)]
extrude(bk,-0.58,0.58)
for yy in (-0.45,-0.22,0.0,0.22,0.45):
    poly([(6.05,yy-0.07,0.3),(5.92,yy,0.08),(6.05,yy+0.07,0.3)],False)
# --- хидравлични цилиндри ---
def cyl(a,b,r=0.11,cls='ln'):
    (x0,z0),(x1,z1)=a,b
    for yy in (-r,r): poly([(x0,yy,z0),(x1,yy,z1)],False,cls)
for yy in (-0.42,0.42):  # цилиндри на стрелата
    poly([(1.4,yy-0.1,1.6),(2.75,yy-0.1,2.85)],False); poly([(1.4,yy+0.1,1.6),(2.75,yy+0.1,2.85)],False)
    poly([(2.2,yy,2.25),(3.1,yy,3.25)],False,'fine')
cyl((2.6,4.25),(4.7,4.6))      # цилиндър на рамото (отгоре на стрелата)
cyl((4.95,4.15),(5.75,1.75),0.09)  # цилиндър на кофата
# връзки на кофата
poly([(5.75,0.0,1.75),(5.95,0.0,1.55),(5.75,0.0,1.3)],False)
# маркучи
poly([(1.6,0.0,2.4),(2.6,0.0,3.6),(3.7,0.0,4.55),(4.6,0.0,4.6),(5.0,0.0,4.2)],False,'fine')
# --- щифтове ---
for (x,z) in [(1.0,1.55),(5.05,3.55),(5.7,1.25),(4.75,4.35),(2.6,4.25)]:
    circle_y(x,0.3,z,0.1,10,'fine'); circle_y(x,-0.3,z,0.1,10,'fine')

# --- проекция и SVG ---
allp=[P(*p) for _,pts,_ in paths for p in pts]
minx=min(p[0] for p in allp); maxx=max(p[0] for p in allp); miny=min(p[1] for p in allp); maxy=max(p[1] for p in allp)
pad=6; W=maxx-minx+2*pad; H=maxy-miny+2*pad
out=[]
for cls,pts,closed in paths:
    q=[P(*p) for p in pts]
    d='M'+' L'.join(f'{x-minx+pad:.1f} {y-miny+pad:.1f}' for x,y in q)+(' Z' if closed else '')
    out.append((cls,d))
ln=' '.join(d for c,d in out if c=='ln'); fine=' '.join(d for c,d in out if c=='fine')
svg=f'''<svg class="drawing" viewBox="0 0 {W:.0f} {H:.0f}" aria-hidden="true">
  <defs><filter id="glow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  <g filter="url(#glow)"><path class="ln3 draw" d="{ln}"/><path class="fn3" d="{fine}"/></g>
</svg>'''
open('ex.svg','w').write(svg)
open('view2.html','w').write('<html><body style="margin:0;background:#0b1f38"><style>.drawing{width:620px;height:auto}.ln3{fill:none;stroke:#5cc8ff;stroke-width:1.1;stroke-linejoin:round;stroke-linecap:round}.fn3{fill:none;stroke:#5cc8ff;stroke-width:.6;opacity:.75}</style>'+svg+'</body></html>')
print(W,H)
