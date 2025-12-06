import { useState, useEffect, useCallback } from 'react'
import './App.css'

const SHAPE_TYPES = ['circle', 'square', 'triangle', 'hexagon', 'diamond', 'star', 'pentagon']
const COLORS = {
  circle: '#FF6B6B',
  square: '#4ECDC4',
  triangle: '#FFE66D',
  hexagon: '#AA96DA',
  diamond: '#F38181',
  star: '#88D8B0',
  pentagon: '#F7DC6F'
}

const MAX_SHAPES = 50

function generateShape(id) {
  const type = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)]
  const color = COLORS[type]
  const size = Math.random() * 60 + 40
  const x = Math.random() * (window.innerWidth - size - 100) + 50
  const y = Math.random() * (window.innerHeight - size - 200) + 100
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
  }
}

function Shape({ shape, onSelect, isSelected }) {
  const [particles, setParticles] = useState([])
  const [isDestroying, setIsDestroying] = useState(false)
  
  const handleClick = () => {
    if (isDestroying) return
    onSelect(shape)
  }

  const triggerDestroy = useCallback(() => {
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      angle: (360 / 12) * i,
      color: shape.color
    }))
    setParticles(newParticles)
    setIsDestroying(true)
  }, [shape.color])

  useEffect(() => {
    if (shape.shouldDestroy) {
      triggerDestroy()
    }
  }, [shape.shouldDestroy, triggerDestroy])

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
      className={`shape ${shape.type} ${isSelected ? 'selected' : ''} ${isDestroying ? 'destroying' : ''}`}
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

const INITIAL_SPAWN_INTERVAL = 1500 // Start slower
const MIN_SPAWN_INTERVAL = 300 // Maximum speed
const SPEED_INCREASE_RATE = 0.97 // Multiplier applied every spawn

function App() {
  const [shapes, setShapes] = useState([])
  const [nextId, setNextId] = useState(0)
  const [selectedShape, setSelectedShape] = useState(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [spawnInterval, setSpawnInterval] = useState(INITIAL_SPAWN_INTERVAL)

  const addShape = useCallback(() => {
    if (gameOver || isPaused) return
    
    setShapes(prev => {
      if (prev.length >= MAX_SHAPES) {
        return prev
      }
      return [...prev, generateShape(nextId)]
    })
    setNextId(prev => prev + 1)
  }, [nextId, gameOver, isPaused])

  const handleShapeSelect = useCallback((shape) => {
    if (gameOver) return

    if (!selectedShape) {
      // First selection
      setSelectedShape(shape)
    } else if (selectedShape.id === shape.id) {
      // Clicked same shape, deselect
      setSelectedShape(null)
    } else if (selectedShape.type === shape.type) {
      // Match! Destroy both
      setShapes(prev => 
        prev.map(s => 
          s.id === selectedShape.id || s.id === shape.id 
            ? { ...s, shouldDestroy: true }
            : s
        )
      )
      
      // Remove after animation
      setTimeout(() => {
        setShapes(prev => prev.filter(s => s.id !== selectedShape.id && s.id !== shape.id))
      }, 400)
      
      setScore(prev => prev + 10)
      setSelectedShape(null)
    } else {
      // No match, switch selection
      setSelectedShape(shape)
    }
  }, [selectedShape, gameOver])

  // Check for game over
  useEffect(() => {
    if (shapes.length >= MAX_SHAPES && !gameOver) {
      setGameOver(true)
      setIsPaused(true)
    }
  }, [shapes.length, gameOver])

  // Auto-generate shapes with increasing speed
  useEffect(() => {
    if (gameOver || isPaused) return
    
    const timeout = setTimeout(() => {
      addShape()
      // Increase speed (decrease interval) after each spawn
      setSpawnInterval(prev => Math.max(MIN_SPAWN_INTERVAL, prev * SPEED_INCREASE_RATE))
    }, spawnInterval)

    return () => clearTimeout(timeout)
  }, [addShape, gameOver, isPaused, spawnInterval])

  // Initial shapes
  useEffect(() => {
    const initialShapes = Array.from({ length: 8 }, (_, i) => generateShape(i))
    setShapes(initialShapes)
    setNextId(8)
  }, [])

  const restartGame = () => {
    const initialShapes = Array.from({ length: 8 }, (_, i) => generateShape(i))
    setShapes(initialShapes)
    setNextId(8)
    setSelectedShape(null)
    setScore(0)
    setGameOver(false)
    setIsPaused(false)
    setSpawnInterval(INITIAL_SPAWN_INTERVAL)
  }

  return (
    <div className="app">
      <div className="background-gradient" />
      
      <div className="shapes-container">
        {shapes.map(shape => (
          <Shape 
            key={shape.id} 
            shape={shape} 
            onSelect={handleShapeSelect}
            isSelected={selectedShape?.id === shape.id}
          />
        ))}
      </div>

      {/* Game Over Overlay */}
      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-content">
            <h1>GAME OVER</h1>
            <p className="final-score">Final Score: <span>{score}</span></p>
            <button className="restart-btn" onClick={restartGame}>
              Play Again
            </button>
          </div>
        </div>
      )}

      <div className="ui-overlay">
        {/* Score Display */}
        <div className="score-container">
          <span className="score-label">SCORE</span>
          <span className="score-value">{score}</span>
        </div>

        {/* Shape Counter */}
        <div className="counter-container">
          <div className="counter-glow" />
          <div className={`counter ${shapes.length >= 40 ? 'danger' : ''}`}>
            <span className="counter-label">SHAPES</span>
            <span className="counter-value">{shapes.length}</span>
            <span className="counter-max">/ {MAX_SHAPES}</span>
          </div>
        </div>

        {/* Speed Indicator */}
        <div className="speed-container">
          <span className="speed-label">SPEED</span>
          <div className="speed-bar-bg">
            <div 
              className="speed-bar-fill"
              style={{ 
                width: `${Math.min(100, ((INITIAL_SPAWN_INTERVAL - spawnInterval) / (INITIAL_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL)) * 100)}%` 
              }}
            />
          </div>
          <span className={`speed-value ${spawnInterval <= 500 ? 'danger' : ''}`}>
            {spawnInterval <= 500 ? '🔥' : spawnInterval <= 800 ? '⚡' : ''}
            {(1000 / spawnInterval).toFixed(1)}/s
          </span>
        </div>

        {/* Selected Shape Indicator */}
        {selectedShape && !gameOver && (
          <div className="selected-indicator">
            <span>Find another</span>
            <div 
              className={`indicator-shape ${selectedShape.type}`}
              style={{ '--shape-color': selectedShape.color }}
            />
          </div>
        )}

        <div className="controls">
          <button 
            className={`control-btn ${isPaused ? '' : 'active'}`}
            onClick={() => setIsPaused(!isPaused)}
            disabled={gameOver}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button 
            className="control-btn restart-btn-small"
            onClick={restartGame}
          >
            ↻ Restart
          </button>
        </div>

        <div className="instructions">
          <p>Match 2 shapes of the same type to destroy them!</p>
          <p className="warning">Don't let shapes reach {MAX_SHAPES}!</p>
        </div>

        {/* Legend */}
        <div className="legend">
          {SHAPE_TYPES.map(type => (
            <div key={type} className="legend-item">
              <div 
                className={`legend-shape ${type}`}
                style={{ '--shape-color': COLORS[type] }}
              />
              <span>{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App

