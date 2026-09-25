import 'leaflet/dist/leaflet.css';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 🌐 CRASH-PREVENTION PATCH FOR GOOGLE TRANSLATE IN REACT
// When Google Translate translates text nodes, it wraps them in <font> or <span> tags.
// When React tries to re-render, removeChild/insertBefore would throw NotFoundError and crash the app.
// This patch safely handles translated nodes without unmounting the React tree.
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) {
      if (console && console.warn) {
        console.warn('Recovered from Google Translate removeChild collision');
      }
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console && console.warn) {
        console.warn('Recovered from Google Translate insertBefore collision');
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
