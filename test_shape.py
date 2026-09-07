import subprocess
import os

colors = {
    'red': {'base': '#FF3B30', 'light': '#FF8A80', 'dark': '#C62828', 'shadow': 'rgba(198,40,40,0.4)'},
    'blue': {'base': '#007AFF', 'light': '#80D8FF', 'dark': '#1565C0', 'shadow': 'rgba(21,101,192,0.4)'},
    'yellow': {'base': '#FFCC00', 'light': '#FFFF8D', 'dark': '#F57F17', 'shadow': 'rgba(245,127,23,0.4)'},
    'green': {'base': '#34C759', 'light': '#B9F6CA', 'dark': '#2E7D32', 'shadow': 'rgba(46,125,50,0.4)'}
}

os.makedirs('public/lumi/shapes/square', exist_ok=True)
os.makedirs('public/lumi/shapes/circle', exist_ok=True)
os.makedirs('public/lumi/shapes/triangle', exist_ok=True)
os.makedirs('public/lumi/shapes/rectangle', exist_ok=True)
os.makedirs('public/lumi/shapes/star', exist_ok=True)

for color_name, c in colors.items():
    # Convert circles from ball webps
    cmd_circle = f"convert public/lumi/objects/ball/lumi_ball_{color_name}.webp public/lumi/shapes/circle/lumi_circle_{color_name}.png"
    subprocess.run(cmd_circle, shell=True, check=True)

print("Circles created!")
