#!/usr/bin/env python3
"""
Generate PNG icons from SVG using Pillow
"""
from PIL import Image, ImageDraw, ImageFont
import math

def create_icon(size):
    """Create extension icon at given size"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Gradient background colors (from SVG: #667eea to #764ba2)
    # We'll create a simple gradient effect
    for y in range(size):
        for x in range(size):
            # Calculate gradient position (diagonal from top-left to bottom-right)
            ratio = (x + y) / (2 * size)
            r = int(102 + (118 - 102) * ratio)  # 0x66=102, 0x76=118
            g = int(126 + (75 - 126) * ratio)   # 0x7e=126, 0x4b=75
            b = int(234 + (162 - 234) * ratio)  # 0xea=234, 0xa2=162
            
            # Rounded corners check
            corner_radius = size // 8
            if (x < corner_radius and y < corner_radius and 
                (x - corner_radius) ** 2 + (y - corner_radius) ** 2 > corner_radius ** 2):
                continue
            if (x > size - corner_radius and y < corner_radius and 
                (x - (size - corner_radius)) ** 2 + (y - corner_radius) ** 2 > corner_radius ** 2):
                continue
            if (x < corner_radius and y > size - corner_radius and 
                (x - corner_radius) ** 2 + (y - (size - corner_radius)) ** 2 > corner_radius ** 2):
                continue
            if (x > size - corner_radius and y > size - corner_radius and 
                (x - (size - corner_radius)) ** 2 + (y - (size - corner_radius)) ** 2 > corner_radius ** 2):
                continue
                
            img.putpixel((x, y), (r, g, b, 255))
    
    # Draw "S" letter in white
    try:
        # Try to load a font, fall back to default
        font_size = int(size * 0.55)
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
        except:
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
            except:
                font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
    
    # Get text size for centering
    bbox = draw.textbbox((0, 0), "S", font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - int(size * 0.05)
    
    # Draw text with slight shadow for better visibility
    shadow_offset = max(1, size // 32)
    draw.text((x + shadow_offset, y + shadow_offset), "S", fill=(0, 0, 0, 50), font=font)
    draw.text((x, y), "S", fill=(255, 255, 255, 255), font=font)
    
    # Draw checkmark circle in bottom-right
    circle_radius = int(size * 0.16)
    circle_x = size - circle_radius - int(size * 0.08)
    circle_y = size - circle_radius - int(size * 0.08)
    
    # Green circle background (#4ade80)
    draw.ellipse(
        [circle_x - circle_radius, circle_y - circle_radius,
         circle_x + circle_radius, circle_y + circle_radius],
        fill=(74, 222, 128, 255)
    )
    
    # White checkmark
    check_size = int(circle_radius * 0.8)
    check_points = [
        (circle_x - check_size//3, circle_y),
        (circle_x - check_size//6, circle_y + check_size//3),
        (circle_x + check_size//2, circle_y - check_size//3)
    ]
    draw.line(check_points, fill=(255, 255, 255, 255), width=max(1, size//16))
    
    return img

# Generate icons at different sizes
sizes = [16, 48, 128]
for size in sizes:
    img = create_icon(size)
    img.save(f'icons/icon{size}.png')
    print(f'Created icons/icon{size}.png ({size}x{size})')

print('All icons generated successfully!')
