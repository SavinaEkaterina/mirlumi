import subprocess
import os

colors = {
    'red': {
        'top_start': '#FF4D4D', 'top_end': '#D90000',
        'bevel_start': '#B30000', 'bevel_end': '#800000',
        'stroke': '#FF8080'
    },
    'blue': {
        'top_start': '#3A9DFF', 'top_end': '#0052CC',
        'bevel_start': '#003D99', 'bevel_end': '#002966',
        'stroke': '#80BFFF'
    },
    'yellow': {
        'top_start': '#FFEE55', 'top_end': '#E6A100',
        'bevel_start': '#B37D00', 'bevel_end': '#805900',
        'stroke': '#FFF380'
    },
    'green': {
        'top_start': '#4CD964', 'top_end': '#0F9E2E',
        'bevel_start': '#0B7823', 'bevel_end': '#075218',
        'stroke': '#86EAA0'
    }
}

os.makedirs('public/lumi/shapes/square', exist_ok=True)
os.makedirs('public/lumi/shapes/circle', exist_ok=True)
os.makedirs('public/lumi/shapes/triangle', exist_ok=True)
os.makedirs('public/lumi/shapes/rectangle', exist_ok=True)
os.makedirs('public/lumi/shapes/star', exist_ok=True)

# 1. Circle assets - from 3D Lumi ball webps
for color_name in colors.keys():
    cmd_circle = f"ffmpeg -y -i public/lumi/objects/ball/lumi_ball_{color_name}.webp public/lumi/shapes/circle/lumi_circle_{color_name}.png"
    subprocess.run(cmd_circle, shell=True, check=True)

def make_square_svg(c):
    return f'''<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="topGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c['top_start']}"/>
      <stop offset="100%" stop-color="{c['top_end']}"/>
    </linearGradient>
    <linearGradient id="bevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c['bevel_start']}"/>
      <stop offset="100%" stop-color="{c['bevel_end']}"/>
    </linearGradient>
    <radialGradient id="gloss" cx="30%" cy="25%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.7"/>
      <stop offset="60%" stop-color="#FFFFFF" stop-opacity="0.0"/>
    </radialGradient>
  </defs>
  <g>
    <!-- Shadow -->
    <rect x="55" y="75" width="270" height="270" rx="40" fill="rgba(0,0,0,0.18)"/>
    <!-- 3D Extrusion Bevel -->
    <rect x="50" y="65" width="280" height="280" rx="42" fill="url(#bevelGrad)"/>
    <!-- Front Face -->
    <rect x="50" y="45" width="280" height="280" rx="42" fill="url(#topGrad)" stroke="{c['stroke']}" stroke-width="3"/>
    <!-- Gloss -->
    <rect x="62" y="57" width="256" height="256" rx="30" fill="url(#gloss)"/>
    <!-- Specular Highlight Curve -->
    <path d="M 85,70 Q 190,58 295,70" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" opacity="0.65"/>
  </g>
</svg>'''

def make_rectangle_svg(c):
    return f'''<svg width="480" height="320" viewBox="0 0 480 320" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="topGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c['top_start']}"/>
      <stop offset="100%" stop-color="{c['top_end']}"/>
    </linearGradient>
    <linearGradient id="bevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c['bevel_start']}"/>
      <stop offset="100%" stop-color="{c['bevel_end']}"/>
    </linearGradient>
    <radialGradient id="gloss" cx="25%" cy="25%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.7"/>
      <stop offset="60%" stop-color="#FFFFFF" stop-opacity="0.0"/>
    </radialGradient>
  </defs>
  <g>
    <!-- Shadow -->
    <rect x="45" y="60" width="390" height="210" rx="36" fill="rgba(0,0,0,0.18)"/>
    <!-- 3D Extrusion Bevel -->
    <rect x="40" y="52" width="400" height="216" rx="38" fill="url(#bevelGrad)"/>
    <!-- Front Face -->
    <rect x="40" y="36" width="400" height="216" rx="38" fill="url(#topGrad)" stroke="{c['stroke']}" stroke-width="3"/>
    <!-- Gloss -->
    <rect x="52" y="48" width="376" height="192" rx="26" fill="url(#gloss)"/>
    <!-- Specular Highlight Curve -->
    <path d="M 75,54 Q 240,44 405,54" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" opacity="0.65"/>
  </g>
</svg>'''

def make_triangle_svg(c):
    return f'''<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="topGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c['top_start']}"/>
      <stop offset="100%" stop-color="{c['top_end']}"/>
    </linearGradient>
    <linearGradient id="bevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c['bevel_start']}"/>
      <stop offset="100%" stop-color="{c['bevel_end']}"/>
    </linearGradient>
    <radialGradient id="gloss" cx="35%" cy="35%" r="45%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.7"/>
      <stop offset="60%" stop-color="#FFFFFF" stop-opacity="0.0"/>
    </radialGradient>
  </defs>
  <g>
    <!-- Shadow -->
    <path d="M 200,45 L 360,335 Q 370,352 345,352 L 55,352 Q 30,352 40,335 Z" fill="rgba(0,0,0,0.18)"/>
    <!-- 3D Bevel -->
    <path d="M 200,35 L 360,325 Q 370,345 345,345 L 55,345 Q 30,345 40,325 Z" fill="url(#bevelGrad)"/>
    <!-- Front Face -->
    <path d="M 200,20 L 360,310 Q 370,330 345,330 L 55,330 Q 30,330 40,310 Z" fill="url(#topGrad)" stroke="{c['stroke']}" stroke-width="3"/>
    <!-- Inner Gloss -->
    <path d="M 200,40 L 340,300 Q 345,312 330,312 L 70,312 Q 55,312 60,300 Z" fill="url(#gloss)"/>
    <!-- Specular Highlight -->
    <path d="M 185,50 L 95,270" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" opacity="0.65"/>
  </g>
</svg>'''

def make_star_svg(c):
    return f'''<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="topGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c['top_start']}"/>
      <stop offset="100%" stop-color="{c['top_end']}"/>
    </linearGradient>
    <linearGradient id="bevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c['bevel_start']}"/>
      <stop offset="100%" stop-color="{c['bevel_end']}"/>
    </linearGradient>
    <radialGradient id="gloss" cx="35%" cy="30%" r="45%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.75"/>
      <stop offset="60%" stop-color="#FFFFFF" stop-opacity="0.0"/>
    </radialGradient>
  </defs>
  <g>
    <!-- Shadow -->
    <path d="M 200,35 L 243,123 L 338,137 L 269,204 L 285,299 L 200,254 L 115,299 L 131,204 L 62,137 L 157,123 Z" fill="rgba(0,0,0,0.18)" transform="translate(0, 22)"/>
    <!-- 3D Bevel -->
    <path d="M 200,35 L 243,123 L 338,137 L 269,204 L 285,299 L 200,254 L 115,299 L 131,204 L 62,137 L 157,123 Z" fill="url(#bevelGrad)" transform="translate(0, 14)"/>
    <!-- Front Face -->
    <path d="M 200,35 L 243,123 L 338,137 L 269,204 L 285,299 L 200,254 L 115,299 L 131,204 L 62,137 L 157,123 Z" fill="url(#topGrad)" stroke="{c['stroke']}" stroke-width="3"/>
    <!-- Gloss -->
    <path d="M 200,50 L 235,120 L 315,132 L 255,190 L 270,275 L 200,235 L 130,275 L 145,190 L 85,132 L 165,120 Z" fill="url(#gloss)"/>
    <!-- Specular -->
    <circle cx="160" cy="110" r="16" fill="#FFFFFF" opacity="0.7"/>
  </g>
</svg>'''

shapes = {
    'square': make_square_svg,
    'rectangle': make_rectangle_svg,
    'triangle': make_triangle_svg,
    'star': make_star_svg
}

for s_name, s_fn in shapes.items():
    for c_name, c in colors.items():
        svg_content = s_fn(c)
        svg_filename = f"temp_{s_name}_{c_name}.svg"
        png_filename = f"public/lumi/shapes/{s_name}/lumi_{s_name}_{c_name}.png"
        
        with open(svg_filename, 'w') as f:
            f.write(svg_content)
            
        cmd = f"ffmpeg -y -i {svg_filename} {png_filename} && rm {svg_filename}"
        subprocess.run(cmd, shell=True, check=True)
        print(f"Generated {png_filename}")

print("All 3D shape PNG assets generated successfully!")
