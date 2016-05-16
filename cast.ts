class Point {
  constructor(public x : number, public y : number){}  
}

class EuclidVector {
  constructor(public start : Point, public end : Point){}  
}

let origo = new Point(0,0)

class Vector {
  constructor(public length : number, public angle : number){}
  public asCartesian() : Point {
    let x = this.length * Math.cos(this.angle)
    let y = this.length * Math.sin(this.angle)
    return new Point(x, y);
  }
  public norms() : EuclidVector {    
    return new EuclidVector(origo, this.asCartesian() );
  }
}

class Line {
    constructor(public position: Point, public vector: Vector) {}
    public end() : Point {
      let p = this.vector.asCartesian()
      return new Point(this.position.x + p.x, this.position.y + p.y);
    }
}

function vectorBetween(p1:Point, p2:Point) : Vector{
  let dx = p2.x - p1.x
  let dy = p2.y - p1.y
  let length = Math.sqrt(dx*dx+dy*dy)
  let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
  return new Vector(length, angle);
}

function intersect(r:Line, s:Line) : Line {
  let rp = r.position
  let sp = s.position
  let rd = r.vector.norms().end
  let sd = s.vector.norms().end
  let sm =
    (rp.x * rd.y - rp.y * rd.x + sp.y * rd.x - sp.x * rd.y) / (sd.y * rd.y - sd.y * rd.x)
  let rm =
    (sp.x - rp.x + sd.x * sm) / rd.x
  if(isNaN(sm) || isNaN(rm) || sm < 0 || s.vector.length < sm || rm < 0)
    return null;
  return new Line(r.position, new Vector(rm, r.vector.angle))
}

// view

class View{
  constructor(private ctx : CanvasRenderingContext2D, private walls:Line[], private width:number, private height:number){ }
  private translate(p:Point):Point{
    return new Point(p.x + this.width / 2, this.height / 2 - p.y);
  } 
  private drawLine(line:Line){
    this.ctx.beginPath()
    let p = this.translate(line.position)
    console.log(p)
    this.ctx.moveTo(p.x, p.y)
    let end = this.translate(line.end())
    console.log(end)
    this.ctx.lineTo(end.x, end.y)
    this.ctx.stroke()
  }
  public render(){
    this.walls.forEach((w) => this.drawLine(w));
  }
}

function degrees(degree:number) : number {
  return degree/180*Math.PI;
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
    var canv = <HTMLCanvasElement> document.getElementById("theCanvas");    
    canv.width = window.innerWidth;
    canv.height = window.innerHeight;
    document.body.appendChild(canv);
    var ctx = canv.getContext("2d");   

    var view = new View(ctx, walls, window.innerWidth, window.innerHeight);
    view.render();
}

exec();
