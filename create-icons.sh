#!/bin/bash
mkdir -p icons

# Create a temporary HTML file for icon generation
cat > icon-generator.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
  <title>Font Icon Generator</title>
  <style>
    body { margin: 0; background: transparent; }
    svg { display: block; }
  </style>
</head>
<body>
  <div id="container"></div>
  <canvas id="canvas" style="display:none;"></canvas>

  <script>
    // Sizes for different icons
    const sizes = [16, 48, 128];
    
    // Function to create SVG for a specific size
    function createFontIcon(size) {
      const padding = Math.max(2, size * 0.1);
      const fontSize = size * 0.5;
      const innerSize = size - (padding * 2);
      
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', size);
      svg.setAttribute('height', size);
      svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
      
      // Create background circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', size / 2);
      circle.setAttribute('cy', size / 2);
      circle.setAttribute('r', size / 2);
      circle.setAttribute('fill', '#4285f4'); // Google blue
      svg.appendChild(circle);
      
      // Add text element with "F"
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', size / 2);
      text.setAttribute('y', size / 2 + fontSize / 3);
      text.setAttribute('font-family', 'Arial, sans-serif');
      text.setAttribute('font-size', fontSize);
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'white');
      text.textContent = 'F';
      svg.appendChild(text);

      // Add small "+" symbol
      const plus = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      plus.setAttribute('x', size * 0.65);
      plus.setAttribute('y', size * 0.35);
      plus.setAttribute('font-family', 'Arial, sans-serif');
      plus.setAttribute('font-size', fontSize * 0.5);
      plus.setAttribute('font-weight', 'bold');
      plus.setAttribute('text-anchor', 'middle');
      plus.setAttribute('fill', 'white');
      plus.textContent = '+';
      svg.appendChild(plus);
      
      return svg;
    }

    // Convert SVG to PNG and download
    function downloadIcon(svg, size) {
      const canvas = document.getElementById('canvas');
      canvas.width = size;
      canvas.height = size;
      
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      
      img.onload = function() {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        const link = document.createElement('a');
        link.download = `icon${size}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }

    // Generate all icons
    window.onload = function() {
      const container = document.getElementById('container');
      sizes.forEach(size => {
        const svg = createFontIcon(size);
        container.appendChild(svg);
        downloadIcon(svg, size);
      });
    };
  </script>
</body>
</html>
EOL

echo "Opening icon generator in your default browser..."
open icon-generator.html

echo "Instructions:"
echo "1. When the browser opens, it will automatically generate and download the icons"
echo "2. Move the downloaded icons (icon16.png, icon48.png, icon128.png) to the 'icons' folder"
echo "3. You may close the browser tab when downloads are complete"

# Wait for user to move the files
read -p "Press Enter after you've moved the icon files to the 'icons' folder..."

# Clean up
rm icon-generator.html
echo "Icon generation complete!"
