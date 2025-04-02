let mode = ''

let shapes = []
let newShapeIndices = []
let newShape = {}
let lastShape = {}
let nearestShape = -1
let nearestPoint = -1
let selectedShape = -1
let selectedPoint = -1
let scale = '' // pixels per sq ft

document.addEventListener('keydown', (e) => {
    if (!e.repeat && mode === '') {
        if (e.key === 'a') {
            let index = '';
            if (lastShape && lastShape.index) {
                let indices = lastShape.index.split('.')
                indices[indices.length - 1] = Number(indices[indices.length - 1]) + 1 
                index = ''
                for (let i = 0; i < indices.length; ++i) {
                    index += indices[i]
                    if (i < indices.length - 1) {
                        index += '.'
                    }
                }
            }
            newShape = {"index":index, 'area': 0, 'nodes': []}
            mode = 'add'
            document.getElementById('mode').innerText = 'add'
        }
        if (e.key === 'e') {
            targetIndices = []
            mode = 'edit'
            document.getElementById('mode').innerText = 'edit'
        }
        if (e.key === 'd') {
            mode = 'delete'
            document.getElementById('mode').innerText = 'delete'
        }
        if (e.key === 'r') {
            mode = 'reorder'
            document.getElementById('mode').innerText = 'reorder'
        }
        if (e.key === 's') {
            mode = 'scale'
            scale = ''
            document.getElementById('mode').innerText = 'scale (pixels/sqft): '
        }
    } else if (!e.repeat && (e.key === 'Escape' || e.key === 'Enter')) {
        if (mode === 'add') {
            if(newShape['nodes'] && newShape['nodes'].length > 0) {
                shapes.push(newShape)
            }
        }
        if (mode === 'edit' || mode === 'delete') {
            //render()
        }
        if (mode === 'reorder') {
            let newShapes = []
            for (i in newShapeIndices) {
                newShapes.push(shapes[newShapeIndices[i]])
            }
            shapes = newShapes
        }
        render()
        mode = ''
        document.getElementById('mode').innerText = ''
    } else if (!e.repeat && mode === 'scale') {
        if (e.key.match('\\d')) {
            scale += e.key
            document.getElementById('mode').innerText += e.key
            render()
        }
    }
})

document.addEventListener('mousemove', (e) => {
    let x = e.x
    let y = e.y

    if (mode === 'edit' || mode === 'delete' || mode === 'reorder') {
        render()
        let nearestDist = -1
        let nearestX = 0
        let nearestY = 0
        for (s in shapes) {
            if (shapes[s]) {
                const shape = shapes[s]
                for (p in shape['nodes']) {
                    const point = shape['nodes'][p]
                    const dist = ((point['x'] - x) * (point['x'] - x)) + ((point['y'] - y) * (point['y'] - y))
                    if (nearestDist < 0 || nearestDist > dist) {
                        nearestDist = dist
                        nearestX = point['x']
                        nearestY = point['y']
                        nearestShape = s
                        nearestPoint = p
                    }
                }
            }
        }
        if (nearestDist > 0) {
            drawBox(nearestX, nearestY, 'green')
        }
    }
})

document.addEventListener('click', (e) => {
    let x = e.x
    let y = e.y
    let ctrl = e.ctrlKey
    let alt = e.altKey
    let shift = e.shiftKey

    if (mode === 'add') {
        newShape['nodes'].push({
            'x': x,
            'y': y
        })
    } else if (mode === 'delete') {
        shapes[nearestShape]['nodes'].splice(nearestPoint, 1)
        if (shapes[nearestShape]['nodes'].length === 0) {
            shapes.splice(nearestShape, 1)
        }
    } else if (mode === 'edit') {
        if (selectedShape < 0) {
            selectedShape = nearestShape
            selectedPoint = nearestPoint
        } else {
            shapes[selectedShape]['nodes'][selectedPoint]['x'] = x
            shapes[selectedShape]['nodes'][selectedPoint]['y'] = y
            selectedShape = -1
            render()
        }
    } else if (mode === 'reorder') {
        if (!newShapeIndices.includes(nearestShape)) {
            newShapeIndices.push(nearestShape)
        }
    }
})

function render() {
    const canvas = document.getElementById('canvas')
    if (canvas.getContext) {
        const ctx = canvas.getContext('2d')
        ctx.canvas.width = window.innerWidth * 0.95
        ctx.canvas.height = window.innerHeight * 0.95
        ctx.lineWidth = 3
        let finalArea = -1
        let finalx = -1
        let finaly = -1
        for (s in shapes) {
            if (shapes[s]){
                const shape = shapes[s]
                ctx.strokeStyle = 'black'
                ctx.beginPath()
                ctx.moveTo(shape['nodes'][shape['nodes'].length-1]['x'], shape['nodes'][shape['nodes'].length-1]['y'])
                let area = -1
                let lastx = -1
                let lasty = -1
                let centx = 0
                let centy = 0
                for (p in shape['nodes']) {
                    const p1 = shape['nodes'][p]
                    const p2 = shape['nodes'][p==0?shape['nodes'].length-1:p-1]
                    ctx.lineTo(p1['x'], p1['y'])
                    const d = dist(p1, p2)
                    const mx = (p1['x'] + p2['x']) / 2
                    const my = (p1['y'] + p2['y']) / 2
                    if (scale === '') {
                        drawText(mx + 10, my + 16, round(d, 100), 'black')
                    } else {
                        drawText(mx + 10, my + 16, round(d/Math.sqrt(Number(scale)), 100), 'black')
                    }
                    area += 0.5 * (p1['y'] + p2['y']) * (p1['x']-p2['x']) 
                }
                for (p in shape['nodes']) {
                    const p1 = shape['nodes'][p]
                    const p2 = shape['nodes'][p==0?shape['nodes'].length-1:p-1]
                    centx += (p1['x']+p2['x']) * ((p1['x']*p2['y']) - (p2['x']*p1['y'])) / (6 * area)
                    centy += (p1['y']+p2['y']) * ((p1['x']*p2['y']) - (p2['x']*p1['y'])) / (6 * area)
                }
                ctx.closePath()
                ctx.stroke()

                area = Math.abs(area)
    
                if (shape['nodes'].length > 2) {
                    drawBox(centx, centy, 'blue')
                    if (scale === ''){
                        drawText(centx + 10, centy + 16, round(area, 1), 'blue')
                    } else {
                        drawText(centx + 10, centy + 16, round(area/Number(scale), 1), 'blue')
                    }
                    shape['area'] = area
                }
                if (finalArea < 0) {
                    finalx = centx
                    finaly = centy
                    finalArea = area
                } else {
                    finalx = weightedAvg(finalx, finalArea, centx, area)
                    finaly = weightedAvg(finaly, finalArea, centy, area)
                    finalArea += area
                    drawBox(finalx, finaly, 'blue')
                    if (scale === ''){
                        drawText(finalx + 10, finaly + 16, round(finalArea, 1), 'blue')
                    } else {
                        drawText(finalx + 10, finaly + 16, round(finalArea/Number(scale), 1), 'blue')

                    }
                }
            }
        }
    }
}

function drawBox(x, y, color) {
    const ctx = canvas.getContext('2d')
    if (color) {
        ctx.strokeStyle = color
    }
    ctx.beginPath()
    ctx.moveTo(x - 5, y - 5)
    ctx.lineTo(x + 5, y - 5)
    ctx.lineTo(x + 5, y + 5)
    ctx.lineTo(x - 5, y + 5)
    ctx.closePath()
    ctx.stroke()
}

function drawText(x, y, t, color) {
    const ctx = canvas.getContext('2d')
    ctx.font = '12px sans'
    if (color) {
        ctx.fillStyle = color
    }
    ctx.fillText(t, x, y)
}

function dist(p1, p2) {
    return Math.sqrt(((p1['x'] - p2['x']) * (p1['x'] - p2['x'])) + ((p1['y'] - p2['y']) * (p1['y'] - p2['y'])))
}

function weightedAvg(p1, w1, p2, w2) {
    // return Math.min(p1,p2) + ((Math.max(p1,p2) - Math.min(p1,p2)) * Math.abs(w1-w2/w1+w2))
    // console.log(p1)
    // console.log(w1)
    // console.log(p2)
    // console.log(w2)
    if (p1 > p2) {
        if (w1 > w2) {
            // console.log('a')
            // console.log(0.5 * (p1-p2) * (w2/w1))
            return p1 - 0.5 * (p1-p2) * (w2/w1)
        } else {
            // console.log('b')
            // console.log(0.5 * (p1-p2) * (w1/w2))
            return p2 + 0.5 * (p1-p2) * (w1/w2)
        }
    } else {
        if (w1 > w2) {
            // console.log('c')
            // console.log(0.5 * (p2-p1) * (w2/w1))
            return p1 + 0.5 * (p2-p1) * (w2/w1)
        } else {
            // console.log('d')
            // console.log(0.5 * (p2-p1) * (w1/w2))
            return p2 - 0.5 * (p2-p1) * (w1/w2)
        }
    }
}

function round(d, p) {
    return Math.trunc(d*p)/p
}

render()
