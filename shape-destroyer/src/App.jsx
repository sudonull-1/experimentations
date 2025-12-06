import { useState, useEffect, useCallback } from 'react'
import './App.css'

const SHAPE_TYPES = ['circle', 'square', 'triangle', 'hexagon', 'diamond', 'star', 'pentagon']
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181',
  '#AA96DA', '#FCBAD3', '#A8D8EA', '#FF9A8B', '#88D8B0',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'
]

function generateShape(id) {
  const type = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)]
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  const size = Math.random() * 60 + 40
  const x = Math.random() * (window.innerWidth - size)
  const y = Math.random() * (window.innerHeight - size)
  const rotation = Math.random() * 360
  const animationDuration = Math.random() * 3 + 2
  
  return {
    id,
    type,
    color,
    size,
    x,
    y,
    rotation,
    animationDuration,
    isDestroying: false
  }
}

function Shape({ shape, onDestroy }) {
  const [particles, setParticles] = useState([])
  
  const handleClick = () => {
    // Create particles
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      angle: (360 / 12) * i,
      color: shape.color
    }))
    setParticles(newParticles)
    
    // Trigger destruction after particle animation
    setTimeout(() => {
      onDestroy(shape.id)
    }, 400)
  }

  const getShapeStyle = () => ({
    left: shape.x,
    top: shape.y,
    width: shape.size,
    height: shape.size,
    '--shape-color': shape.color,
    '--rotation': `${shape.rotation}deg`,
    '--float-duration': `${shape.animationDuration}s`,
  })

  return (
    <div 
      className={`shape ${shape.type} ${shape.isDestroying ? 'destroying' : ''}`}
      style={getShapeStyle()}
      onClick={handleClick}
    >
      {shape.type === 'star' && <StarSVG color={shape.color} />}
      {shape.type === 'pentagon' && <PentagonSVG color={shape.color} />}
      {particles.length > 0 && (
        <div className="particles">
          {particles.map(p => (
            <div 
              key={p.id} 
              className="particle"
              style={{
                '--angle': `${p.angle}deg`,
                backgroundColor: p.color
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StarSVG({ color }) {
  return (
    <svg viewBox="0 0 100 100" className="shape-svg">
      <polygon 
        points="50,5 61,40 98,40 68,62 79,97 50,75 21,97 32,62 2,40 39,40"
        fill={color}
      />
    </svg>
  )
}

function PentagonSVG({ color }) {
  return (
    <svg viewBox="0 0 100 100" className="shape-svg">
      <polygon 
        points="50,5 95,35 80,90 20,90 5,35"
        fill={color}
      />
    </svg>
  )
}

function App() {
  const [shapes, setShapes] = useState([])
  const [nextId, setNextId] = useState(0)
  const [isGenerating, setIsGenerating] = useState(true)

  const addShape = useCallback(() => {
    if (shapes.length < 50) {
      setShapes(prev => [...prev, generateShape(nextId)])
      setNextId(prev => prev + 1)
    }
  }, [nextId, shapes.length])

  const destroyShape = useCallback((id) => {
    setShapes(prev => prev.filter(s => s.id !== id))
  }, [])

  // Auto-generate shapes
  useEffect(() => {
    if (!isGenerating) return
    
    const interval = setInterval(() => {
      addShape()
    }, 800)

    return () => clearInterval(interval)
  }, [addShape, isGenerating])

  // Initial shapes
  useEffect(() => {
    const initialShapes = Array.from({ length: 10 }, (_, i) => generateShape(i))
    setShapes(initialShapes)
    setNextId(10)
  }, [])

  return (
    <div className="app">
      <div className="background-gradient" />
      
      <div className="shapes-container">
        {shapes.map(shape => (
          <Shape 
            key={shape.id} 
            shape={shape} 
            onDestroy={destroyShape}
          />
        ))}
      </div>

      <div className="ui-overlay">
        <div className="counter-container">
          <div className="counter-glow" />
          <div className="counter">
            <span className="counter-label">SHAPES</span>
            <span className="counter-value">{shapes.length}</span>
          </div>
        </div>

        <div className="controls">
          <button 
            className={`control-btn ${isGenerating ? 'active' : ''}`}
            onClick={() => setIsGenerating(!isGenerating)}
          >
            {isGenerating ? '⏸ Pause' : '▶ Resume'}
          </button>
          <button 
            className="control-btn add-btn"
            onClick={addShape}
          >
            + Add Shape
          </button>
          <button 
            className="control-btn clear-btn"
            onClick={() => setShapes([])}
          >
            ✕ Clear All
          </button>
        </div>

        <div className="instructions">
          <p>Click any shape to destroy it!</p>
        </div>
      </div>
    </div>
  )
}

export default App
