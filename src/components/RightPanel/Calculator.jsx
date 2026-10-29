import { useState } from 'react';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import './Calculator.css';

function evaluateArithmetic(expr) {
  const tokens = expr.match(/(?:\d+\.?\d*|\.\d+|[+\-*/])/g);
  if (!tokens || tokens.length === 0) return NaN;
  const normalized = [];
  for (let i = 0; i < tokens.length; i++) {
    if ((tokens[i] === '-' || tokens[i] === '+') && (i === 0 || /[+\-*/]/.test(tokens[i - 1]))) {
      normalized.push(parseFloat(tokens[i] + (tokens[++i] || '0')));
    } else if (/[+\-*/]/.test(tokens[i])) {
      normalized.push(tokens[i]);
    } else {
      normalized.push(parseFloat(tokens[i]));
    }
  }
  const pass1 = [normalized[0]];
  for (let i = 1; i < normalized.length; i += 2) {
    const op = normalized[i];
    const next = normalized[i + 1];
    if (op === '*') pass1[pass1.length - 1] *= next;
    else if (op === '/') pass1[pass1.length - 1] /= next;
    else pass1.push(op, next);
  }
  let acc = pass1[0];
  for (let i = 1; i < pass1.length; i += 2) {
    acc = pass1[i] === '+' ? acc + pass1[i + 1] : acc - pass1[i + 1];
  }
  return acc;
}

export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isNewNumber, setIsNewNumber] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleNum = (num) => {
    if (isNewNumber) {
      setDisplay(num);
      setIsNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOp = (op) => {
    setEquation(equation + display + ' ' + op + ' ');
    setIsNewNumber(true);
  };

  const [lastOperation, setLastOperation] = useState('');

  const handleEqual = () => {
    try {
      let fullEquation;
      if (equation === '') {
        if (!lastOperation) return;
        fullEquation = display + lastOperation;
      } else {
        fullEquation = equation + display;
        const parts = equation.trim().split(' ');
        const operator = parts[parts.length - 1];
        setLastOperation(` ${operator} ${display}`);
      }

      const sanitized = fullEquation.replace(/[^0-9+\-*/.]/g, '');
      const result = evaluateArithmetic(sanitized);
      if (!isFinite(result) || isNaN(result)) {
        setDisplay('Error');
        setEquation('');
        setIsNewNumber(true);
        return;
      }
      const rounded = Math.round(result * 100000000) / 100000000;
      const strResult = String(rounded);
      setDisplay(strResult);
      setEquation('');
      setIsNewNumber(true);
      
      navigator.clipboard.writeText(strResult).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => console.error("Clipboard copy failed", err));
    } catch {
      setDisplay('Error');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setIsNewNumber(true);
    setLastOperation('');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const num = parseFloat(text);
      if (!isNaN(num)) {
        setDisplay(String(num));
        setIsNewNumber(true);
      }
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  return (
    <div className="calculator" tabIndex={0} onPaste={handlePaste} style={{ outline: 'none' }}>
      <div className="calc-display" style={{ position: 'relative' }}>
        <button 
          onClick={handlePaste} 
          title="Paste number"
          style={{ 
            position: 'absolute', 
            top: '6px', 
            left: '6px', 
            background: 'transparent', 
            border: 'none', 
            color: 'var(--text-secondary)', 
            cursor: 'pointer',
            padding: '2px',
            opacity: 0.7
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
          onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
        >
          <ClipboardIcon width={16} />
        </button>
        {copied && (
          <div style={{ position: 'absolute', top: '6px', right: '6px', fontSize: '0.75rem', color: 'var(--success-color, #10b981)', display: 'flex', alignItems: 'center', gap: '2px' }}>
            <CheckIcon width={12} /> Copied
          </div>
        )}
        <div className="calc-equation">{equation}</div>
        <div className="calc-main">{display}</div>
      </div>
      <div className="calc-buttons">
        <button className="calc-btn btn-secondary" onClick={handleClear}>C</button>
        <button className="calc-btn btn-secondary" onClick={() => handleOp('/')}>÷</button>
        <button className="calc-btn btn-secondary" onClick={() => handleOp('*')}>×</button>
        <button className="calc-btn btn-secondary" onClick={() => handleOp('-')}>-</button>
        
        <button className="calc-btn" onClick={() => handleNum('7')}>7</button>
        <button className="calc-btn" onClick={() => handleNum('8')}>8</button>
        <button className="calc-btn" onClick={() => handleNum('9')}>9</button>
        <button className="calc-btn btn-secondary" style={{ gridRow: 'span 2' }} onClick={() => handleOp('+')}>+</button>
        
        <button className="calc-btn" onClick={() => handleNum('4')}>4</button>
        <button className="calc-btn" onClick={() => handleNum('5')}>5</button>
        <button className="calc-btn" onClick={() => handleNum('6')}>6</button>
        
        <button className="calc-btn" onClick={() => handleNum('1')}>1</button>
        <button className="calc-btn" onClick={() => handleNum('2')}>2</button>
        <button className="calc-btn" onClick={() => handleNum('3')}>3</button>
        <button className="calc-btn btn-primary" style={{ gridRow: 'span 2' }} onClick={handleEqual}>=</button>
        
        <button className="calc-btn" style={{ gridColumn: 'span 2' }} onClick={() => handleNum('0')}>0</button>
        <button className="calc-btn" onClick={() => handleNum('.')}>.</button>
      </div>
    </div>
  );
}
