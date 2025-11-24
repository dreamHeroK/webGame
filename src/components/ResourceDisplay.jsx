import React from 'react'
import './ResourceDisplay.css'

const ResourceDisplay = ({ resources }) => {
  const resourceColors = {
    石头: '#8B7355',
    铁: '#C0C0C0',
    钢: '#71797E',
    合金: '#FFD700',
    钛合金: '#E0E0E0',
    碳纤维: '#1C1C1C',
    振金: '#4B0082',
    神石: '#FF1493'
  }

  return (
    <div className="resource-display">
      <h2>资源</h2>
      <div className="resource-list">
        {Object.entries(resources).map(([name, amount]) => (
          <div key={name} className="resource-item">
            <span 
              className="resource-icon" 
              style={{ backgroundColor: resourceColors[name] || '#666' }}
            >
              {name[0]}
            </span>
            <span className="resource-name">{name}</span>
            <span className="resource-amount">
              {amount.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ResourceDisplay

