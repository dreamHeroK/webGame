import React from 'react'
import './ClickButton.css'

const ClickButton = ({ onClick, clickPower }) => {
  const totalPower = Object.values(clickPower).reduce((sum, val) => sum + val, 0)
  
  return (
    <div className="click-section">
      <button className="click-button" onClick={onClick}>
        <div className="click-icon">⚡</div>
        <div className="click-text">点击获取资源</div>
        <div className="click-power">+{totalPower.toLocaleString()}/点击</div>
      </button>
    </div>
  )
}

export default ClickButton

