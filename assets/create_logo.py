#!/usr/bin/env python3
"""
Create a logo for Mercury MCP Server
400x400 PNG with Mercury and MCP branding
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Create a 400x400 image with gradient background
width, height = 400, 400
img = Image.new('RGB', (width, height), color='white')
draw = ImageDraw.Draw(img)

# Create gradient background (blue to purple)
for y in range(height):
    r = int(20 + (y / height) * 30)
    g = int(50 + (y / height) * 30)
    b = int(180 - (y / height) * 80)
    draw.rectangle([(0, y), (width, y+1)], fill=(r, g, b))

# Draw Mercury symbol (stylized M with speed lines)
# Main M shape
m_color = (255, 255, 255)
m_width = 8

# Left leg of M
draw.line([(80, 280), (100, 120)], fill=m_color, width=m_width)
# Middle valley
draw.line([(100, 120), (150, 200)], fill=m_color, width=m_width)
draw.line([(150, 200), (200, 120)], fill=m_color, width=m_width)
# Right leg
draw.line([(200, 120), (220, 280)], fill=m_color, width=m_width)

# Speed lines to show 10x faster
speed_color = (255, 200, 0)  # Gold/yellow
for i in range(3):
    y_offset = 140 + i * 30
    x_start = 250 + i * 10
    draw.line([(x_start, y_offset), (x_start + 60, y_offset)], 
              fill=speed_color, width=4-i)

# Draw circle around M
draw.ellipse([(50, 90), (250, 290)], outline=m_color, width=3)

# Add text
try:
    # Try to use a system font
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 40)
    small_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
except:
    # Fallback to default font
    font = ImageFont.load_default()
    small_font = font

# MCP text
text_color = (255, 255, 255)
draw.text((150, 310), "MCP", font=font, anchor="mm", fill=text_color)
draw.text((200, 350), "Mercury Server", font=small_font, anchor="mm", fill=text_color)

# Save the logo
img.save('mercury-logo.png', 'PNG')
print("✅ Logo created at mercury-logo.png")