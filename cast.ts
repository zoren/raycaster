function degrees(degree:number) : number {
  return degree/180*Math.PI;
}

class Point {
  constructor(public x : number, public y : number){}  
}

class EuclidVector {
  constructor(public start : Point, public end : Point){}  
  public toVector() : Vector{
    let p1 = this.start
    let p2 = this.end
    let dx = p2.x - p1.x
    let dy = p2.y - p1.y
    let length = Math.sqrt(dx*dx+dy*dy)
    let angle = Math.atan2(dy, dx)
    return new Vector(length, angle);
  }
  public toLine() : Line {
    return new Line(this.start, this.toVector());
  }
}

let origo = new Point(0,0)

class Vector {
  constructor(public length : number, public angle : number){
    if(length<0.0){
      throw new Error("length cannot be negative")
    }
  }
  public asCartesian() : Point {
    let x = this.length * Math.cos(this.angle)
    let y = this.length * Math.sin(this.angle)
    return new Point(x, y);
  }
  public adjust(delta:number) : Vector{
    return new Vector(this.length, this.angle + delta);
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
  let rayToStart = new EuclidVector(pos, line.position).toLine()
  let rayToEnd = new EuclidVector(pos, line.end()).toLine()
  return [rayToStart, rayToEnd]
}

function toRaysWalls(pos:Point, walls:Line[]) : Line[] {
  let rays = []
  walls.forEach((w) => rays = rays.concat(toRays(pos, w)))
  return rays
}

function clipRay(ray:Line, walls:Line[]) : Line {
  let intersected = walls.map(wall => intersect(ray, wall)).filter((r) => r != null)
  intersected.sort((x, y) => x.vector.length - y.vector.length)
  return intersected.length > 0 ? intersected[0]: null
}

function clipRays(rays:Line[], walls:Line[]) : Line[] {
  return rays.map(r => clipRay(r, walls)).filter(r=> r!= null)
}

// view

class View{
  constructor(private ctx : CanvasRenderingContext2D, private walls:Line[], private width:number, private height:number){ 
    this.renderOrigo()
    this.renderWalls()
  }
  private renderWalls(){
    this.walls.forEach((w) => this.drawLine(w))
  }
  private toScreen(p:Point):Point{
    return new Point(p.x + this.width / 2, this.height / 2 + p.y);
  }
  private fromScreen(p:Point):Point{
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
  private drawRay(line:Line){
    this.ctx.setLineDash([5, 15]);
    this.ctx.beginPath()
    let p = this.toScreen(line.position)
    this.ctx.moveTo(p.x, p.y)
    let end = this.toScreen(line.end())
    this.ctx.lineTo(end.x, end.y)
    this.ctx.strokeStyle = 'gray'
    this.ctx.lineWidth = 1
    this.ctx.lineCap = 'butt'
    this.ctx.stroke()
    this.ctx.setLineDash([]);
  }  
  private drawClippedRay(line:Line){
    this.ctx.beginPath()
    let p = this.toScreen(line.position)
    this.ctx.moveTo(p.x, p.y)
    let end = this.toScreen(line.end())
    let end2 = new Point(end.x, end.y)
    this.ctx.lineTo(end2.x, end2.y)
    this.ctx.strokeStyle = 'black'
    this.ctx.lineWidth = 2
    this.ctx.lineCap = 'butt'
    this.ctx.stroke()
  }
  private renderRay(ray_x:number, ray_y:number){
    this.ctx.beginPath()
    this.ctx.arc(ray_x, ray_y, 5, 0, 2 * Math.PI)
    this.ctx.fillStyle = 'red'
    this.ctx.fill()    
  }
  private renderOrigo(){
    this.ctx.beginPath()
    this.ctx.arc(this.width / 2, this.height / 2, 5, 0, 2 * Math.PI)
    this.ctx.fillStyle = 'green'
    this.ctx.fill()    
  }    
  public render(ray_x:number, ray_y:number){
    this.ctx.clearRect(0, 0, this.width, this.height)
    this.ctx.fillStyle = 'black'    
    this.ctx.fillText("x: " + ray_x + " y: " + ray_y, 0, 10)
    this.ctx.fillText("x: " + (ray_x - this.width/2) + " y: " + (this.height/2 - ray_y), 0, 30)    
      
    let ray_pos_screen = new Point(ray_x, ray_y)
    let ray_pos = this.fromScreen(ray_pos_screen)
    let rays = toRaysWalls(ray_pos, walls);
    rays.forEach(r => this.drawRay(r))
    let clippedRays = clipRays(rays, walls)
    clippedRays.forEach(r => this.drawClippedRay(r))
    this.renderWalls()
    this.renderRay(ray_x, ray_y)
    this.renderOrigo()
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
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");   

    var view = new View(ctx, walls, window.innerWidth, window.innerHeight);
    canvas.onmousemove = (e) => {
      var rect = canvas.getBoundingClientRect();
      view.render(e.clientX - rect.left, e.clientY - rect.top)
    }
}
exec()
