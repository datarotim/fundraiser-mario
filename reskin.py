#!/usr/bin/env python3
"""
Reskin script for The Fundraiser game.
- Replaces goomba sprites with simple person/donor figures
- Recolors ? blocks from orange to Dataro purple
- Blanks out "SUPER MARIO BROS." text
"""

from PIL import Image, ImageDraw
import shutil
import os

SPRITE_PATH = 'public/img/sprites.png'
TILES_PATH = 'public/img/tiles.png'

def backup(path):
    bak = path + '.bak'
    if not os.path.exists(bak):
        shutil.copy2(path, bak)

def draw_person_walk1(draw, x, y):
    """Walking pose 1: left leg forward"""
    # Clear
    draw_clear(draw, x, y)
    # Head (skin tone)
    for dx in range(5, 11):
        for dy in range(1, 5):
            if (dx - 8)**2 + (dy - 3)**2 <= 5:
                draw.point((x + dx, y + dy), fill=(210, 170, 130, 255))
    # Body (blue shirt)
    for dx in range(5, 11):
        for dy in range(5, 10):
            draw.point((x + dx, y + dy), fill=(70, 100, 180, 255))
    # Belt
    for dx in range(5, 11):
        draw.point((x + dx, y + 10), fill=(60, 60, 60, 255))
    # Legs - left forward, right back (grey pants)
    # Left leg (forward)
    for dy in range(11, 15):
        draw.point((x + 5, y + dy), fill=(100, 100, 110, 255))
        draw.point((x + 6, y + dy), fill=(100, 100, 110, 255))
    # Right leg (back)
    for dy in range(11, 15):
        draw.point((x + 9, y + dy), fill=(100, 100, 110, 255))
        draw.point((x + 10, y + dy), fill=(100, 100, 110, 255))
    # Shoes
    draw.point((x + 4, y + 15), fill=(80, 50, 30, 255))
    draw.point((x + 5, y + 15), fill=(80, 50, 30, 255))
    draw.point((x + 6, y + 15), fill=(80, 50, 30, 255))
    draw.point((x + 9, y + 15), fill=(80, 50, 30, 255))
    draw.point((x + 10, y + 15), fill=(80, 50, 30, 255))
    draw.point((x + 11, y + 15), fill=(80, 50, 30, 255))

def draw_person_walk2(draw, x, y):
    """Walking pose 2: right leg forward"""
    draw_clear(draw, x, y)
    # Head
    for dx in range(5, 11):
        for dy in range(1, 5):
            if (dx - 8)**2 + (dy - 3)**2 <= 5:
                draw.point((x + dx, y + dy), fill=(210, 170, 130, 255))
    # Body (blue shirt)
    for dx in range(5, 11):
        for dy in range(5, 10):
            draw.point((x + dx, y + dy), fill=(70, 100, 180, 255))
    # Belt
    for dx in range(5, 11):
        draw.point((x + dx, y + 10), fill=(60, 60, 60, 255))
    # Legs - right forward, left back
    # Right leg (forward)
    for dy in range(11, 15):
        draw.point((x + 9, y + dy), fill=(100, 100, 110, 255))
        draw.point((x + 10, y + dy), fill=(100, 100, 110, 255))
    # Left leg (back)
    for dy in range(11, 15):
        draw.point((x + 5, y + dy), fill=(100, 100, 110, 255))
        draw.point((x + 6, y + dy), fill=(100, 100, 110, 255))
    # Shoes (swapped positions for alternate walk)
    draw.point((x + 9, y + 15), fill=(80, 50, 30, 255))
    draw.point((x + 10, y + 15), fill=(80, 50, 30, 255))
    draw.point((x + 11, y + 15), fill=(80, 50, 30, 255))
    draw.point((x + 4, y + 15), fill=(80, 50, 30, 255))
    draw.point((x + 5, y + 15), fill=(80, 50, 30, 255))
    draw.point((x + 6, y + 15), fill=(80, 50, 30, 255))

def draw_person_flat(draw, x, y):
    """Flat/dead pose: person lying down as a gift box"""
    draw_clear(draw, x, y)
    # Gift box
    for dx in range(2, 14):
        for dy in range(6, 14):
            draw.point((x + dx, y + dy), fill=(180, 60, 60, 255))
    # Ribbon horizontal
    for dx in range(2, 14):
        draw.point((x + dx, y + 10), fill=(255, 215, 0, 255))
    # Ribbon vertical
    for dy in range(6, 14):
        draw.point((x + 8, y + dy), fill=(255, 215, 0, 255))
    # Bow
    draw.point((x + 7, y + 5), fill=(255, 215, 0, 255))
    draw.point((x + 8, y + 5), fill=(255, 215, 0, 255))
    draw.point((x + 9, y + 5), fill=(255, 215, 0, 255))
    draw.point((x + 6, y + 4), fill=(255, 215, 0, 255))
    draw.point((x + 10, y + 4), fill=(255, 215, 0, 255))

def draw_clear(draw, x, y, w=16, h=16):
    """Clear a 16x16 region to transparent"""
    for dx in range(w):
        for dy in range(h):
            draw.point((x + dx, y + dy), fill=(0, 0, 0, 0))

def reskin_sprites():
    """Replace goomba frames with person figures"""
    img = Image.open(SPRITE_PATH)
    draw = ImageDraw.Draw(img)

    # Brown goomba: walk-1 at (80,0), walk-2 at (96,0), flat at (112,0)
    draw_person_walk1(draw, 80, 0)
    draw_person_walk2(draw, 96, 0)
    draw_person_flat(draw, 112, 0)

    # Blue goomba: walk-1 at (80,16), walk-2 at (96,16), flat at (112,16)
    draw_person_walk1(draw, 80, 16)
    draw_person_walk2(draw, 96, 16)
    draw_person_flat(draw, 112, 16)

    # Make blue variant slightly different - green shirt instead
    for dx in range(5, 11):
        for dy in range(5, 10):
            draw.point((80 + dx, 16 + dy), fill=(60, 140, 80, 255))
            draw.point((96 + dx, 16 + dy), fill=(60, 140, 80, 255))

    img.save(SPRITE_PATH)
    print(f'Reskinned goombas in {SPRITE_PATH}')

def reskin_tiles():
    """Recolor ? blocks to purple and blank out SUPER MARIO BROS."""
    img = Image.open(TILES_PATH)
    pixels = img.load()
    w, h = img.size

    # ? block tiles are at indices (4,0), (5,0), (6,0) → pixels (64,0), (80,0), (96,0)
    # Each is 16x16. Recolor orange tones to Dataro purple.
    chance_regions = [(64, 0), (80, 0), (96, 0)]

    for (rx, ry) in chance_regions:
        for x in range(rx, rx + 16):
            for y in range(ry, ry + 16):
                r, g, b, a = pixels[x, y]
                if a == 0:
                    continue
                # Orange/yellow tones → purple
                if r > 150 and g > 80 and b < 100:
                    # Bright orange → Dataro purple
                    brightness = (r + g) / 2
                    factor = brightness / 255
                    nr = int(107 * factor)
                    ng = int(63 * factor)
                    nb = int(160 * factor)
                    pixels[x, y] = (nr, ng, nb, a)
                elif r > 200 and g > 200 and b < 100:
                    # Yellow/white highlights → lighter purple
                    pixels[x, y] = (155, 111, 208, a)

    # Blank out "SUPER MARIO BROS." text
    # The text spans y=140 to y=159, x=0 to x=245
    for x in range(0, 246):
        for y in range(140, 160):
            pixels[x, y] = (0, 0, 0, 0)

    img.save(TILES_PATH)
    print(f'Reskinned tiles in {TILES_PATH}')

if __name__ == '__main__':
    backup(SPRITE_PATH)
    backup(TILES_PATH)
    reskin_sprites()
    reskin_tiles()
    print('Done! Backups saved as .bak files')
