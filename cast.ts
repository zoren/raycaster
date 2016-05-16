// typescript implementation of https://github.com/derkyjadex/elm-rays/blob/master/Main.elm
let rayColor = '#cc0000'
let polygonColor = '#fce94f'

function degrees(degree:number) : number {
  return degree/180*Math.PI;
}

class Point {
  constructor(public x : number, public y : number){}  
}

class Vector {
  constructor(public length : number, public angle : number){}
  public asCartesian() : Point {
    let x = this.length * Math.cos(this.angle)
    let y = this.length * Math.sin(this.angle)
    return new Point(x, y);
  }
  public adjust(delta:number) : Vector{
    return new Vector(this.length, this.angle + delta);
  }
  public static pointsToVector(p1:Point, p2:Point) : Vector {
    let dx = p2.x - p1.x
    let dy = p2.y - p1.y
    let length = Math.sqrt(dx*dx+dy*dy)
    let angle = Math.atan2(dy, dx)
    return new Vector(length, angle);
  }  
}

class Line {
  constructor(public position: Point, public vector: Vector) {}
  public end() : Point {
    let p = this.vector.asCartesian()
    return new Point(this.position.x + p.x, this.position.y + p.y);
  }
  public adjust(delta:number) : Line{
    return new Line(this.position, this.vector.adjust(delta))
  }    
  public norms():Point{
    return new Point(Math.cos(this.vector.angle), Math.sin(this.vector.angle));
  }
  public static pointsToLine(p1:Point, p2:Point):Line{
    return new Line(p1, Vector.pointsToVector(p1, p2));  
  }  
}

function intersect(r:Line, s:Line) : Line {
  let rp = r.position
  let sp = s.position
  let rd = r.norms()
  let sd = s.norms()
  let sm =
    (rp.x * rd.y - rp.y * rd.x + sp.y * rd.x - sp.x * rd.y) / (sd.x * rd.y - sd.y * rd.x)
  let rm =
    (sp.x - rp.x + sd.x * sm) / rd.x
  if(isNaN(sm) || isNaN(rm) || sm < 0 || s.vector.length < sm || rm < 0)
    return null;
  return new Line(r.position, new Vector(rm, r.vector.angle))
}

function toRays(pos:Point, line:Line) : Line[] {
  let rayToStart = Line.pointsToLine(pos, line.position)
  let rayToEnd = Line.pointsToLine(pos, line.end())
  return [rayToStart.adjust(degrees(0.5)), rayToStart.adjust(degrees(-0.5)),
          rayToEnd.adjust(degrees(0.5)), rayToEnd.adjust(degrees(-0.5))]
}

function toRaysWalls(pos:Point, walls:Line[]) : Line[] {
  return walls.map((w) => toRays(pos, w)).reduce((r1,r2) => r1.concat(r2))
}

function clipRay(ray:Line, walls:Line[]) : Line {
  let intersected = walls.map(wall => intersect(ray, wall)).filter((r) => r != null)
  intersected.sort((x, y) => x.vector.length - y.vector.length)
  return intersected.length > 0 ? intersected[0]: null
}

function clipRays(rays:Line[], walls:Line[]) : Line[] {
  return rays.map(r => clipRay(r, walls)).filter(r => r != null)
}

class View{
  private width:number
  private height:number
  private walls:Line[]
  constructor(private ctx : CanvasRenderingContext2D){ 
    this.width = ctx.canvas.width
    this.height = ctx.canvas.height
    this.walls = []
    this.renderWalls()    
  }
  private renderWalls(){
    this.walls.forEach((w) => this.drawLine(w))
  }
  private toScreen(p:Point):Point{
    return new Point(p.x + this.width / 2, this.height / 2 + p.y);
  }
  public fromScreen(p:Point):Point{
    return new Point(p.x - this.width / 2, p.y - this.height / 2);
  }
  private drawLine(line:Line){
    this.ctx.beginPath()
    let p = this.toScreen(line.position)
    this.ctx.moveTo(p.x, p.y)
    let end = this.toScreen(line.end())
    this.ctx.lineTo(end.x, end.y)
    this.ctx.strokeStyle = 'black'
    this.ctx.lineWidth = 8
    this.ctx.lineCap = 'round'
    this.ctx.stroke()
  }
  private drawTriangles(color:string, a:Line, b:Line){
    this.ctx.beginPath()
    this.ctx.lineWidth = 0
    let p1 = this.toScreen(a.position)
    this.ctx.moveTo(p1.x, p1.y)
    let p2 = this.toScreen(a.end())
    this.ctx.lineTo(p2.x, p2.y)
    let p3 = this.toScreen(b.end())
    this.ctx.lineTo(p3.x, p3.y)
    let p4 = this.toScreen(b.position)
    this.ctx.lineTo(p4.x, p4.y)
    this.ctx.fillStyle = color
    this.ctx.fill()
  }
  private renderRay(ray_x:number, ray_y:number){
    this.ctx.beginPath()
    this.ctx.arc(ray_x, ray_y, 5, 0, 2 * Math.PI)
    this.ctx.fillStyle = rayColor
    this.ctx.fill()    
  }
  private renderRays(ray_x:number, ray_y:number){
    let ray_pos_screen = new Point(ray_x, ray_y)
    let ray_pos = this.fromScreen(ray_pos_screen)
    let rays = toRaysWalls(ray_pos, this.walls);
    let clippedRays = clipRays(rays, this.walls)
    clippedRays.sort((x,y) => x.vector.angle - y.vector.angle)
    for(var i = 0;i<clippedRays.length;i++){
      let r1 = clippedRays[i]
      let r2 = clippedRays[(i+1)%clippedRays.length]
      this.drawTriangles(polygonColor, r1, r2)
    }    
  }
  public render(ray_x:number, ray_y:number){
    this.ctx.clearRect(0, 0, this.width, this.height)
    this.renderRays(ray_x, ray_y)
    this.renderWalls()   
    this.renderRay(ray_x, ray_y)       
  }
  public addWall(wall:Line){
    this.walls.push(wall)
  }
}

let walls : Line[] = [
  new Line(new Point(-300, -300), new Vector(600, degrees(0))),
  new Line(new Point( 300, -300), new Vector(600, degrees(90))),
  new Line(new Point(-300, -300), new Vector(600, degrees(90))),
  new Line(new Point( 300,  300), new Vector(600, degrees(180))),

  new Line(new Point( 100,  100), new Vector(50, degrees(315))),
  new Line(new Point( -80,  100), new Vector(50, degrees(290))),
  new Line(new Point( -200,  180), new Vector(150, degrees(250))),
  new Line(new Point( 150,  -100), new Vector(120, degrees(235))),
  new Line(new Point( -230,  -250), new Vector(300, degrees(70))),
  new Line(new Point( 0,  -150), new Vector(300, degrees(30))),  
]

function exec() {
    var canvas = <HTMLCanvasElement> document.getElementById("theCanvas");    
    var ctx = canvas.getContext("2d");
    var view = new View(ctx)
    walls.forEach(w => view.addWall(w))
    view.render(100, 100)
    canvas.onmousemove = (e) => {
      var rect = canvas.getBoundingClientRect();
      view.render(e.clientX - rect.left, e.clientY - rect.top)
    }
    var p : Point = null
    canvas.onmousedown = (e) => {
      if(p!=null){
        let p2 = new Point(e.clientX, e.clientY)
        let l = Line.pointsToLine(view.fromScreen(p), view.fromScreen(p2))
        view.addWall(l)
        p = null
      }else{
        p = new Point(e.clientX, e.clientY)   
      }
    } 
}
exec()
