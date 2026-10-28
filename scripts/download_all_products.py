import os
import sys
import re
import json
import time
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

DEST_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'images', 'products')
os.makedirs(DEST_DIR, exist_ok=True)

PRODUCTS = [
    {"id": "c-1", "name": "Sony PXW-Z280 4K Camcorder", "slug": "sony-pxw-z280", "category": "cameras", "qty": 2, "query": "Sony PXW-Z280 4K Camcorder product white background"},
    {"id": "c-2", "name": "Sony PMW-200 Camcorder", "slug": "sony-pmw-200", "category": "cameras", "qty": 1, "query": "Sony PMW-200 XDCAM Camcorder product white background"},
    {"id": "c-3", "name": "Sony PMW-F5 CineAlta Camera", "slug": "sony-pmw-f5", "category": "cameras", "qty": 1, "query": "Sony PMW-F5 CineAlta 4K camera product white background"},
    {"id": "c-4", "name": "Sony PXW-FS7 II 4K Cinema Camera", "slug": "sony-fs7-ii", "category": "cameras", "qty": 1, "query": "Sony PXW-FS7 II 4K XDCAM camera product white background"},
    {"id": "c-5", "name": "Sony Alpha A7 IV (A7M4)", "slug": "sony-a7m4", "category": "cameras", "qty": 2, "query": "Sony Alpha A7 IV mirrorless camera product white background"},
    {"id": "c-6", "name": "Sony Alpha A7 V (A7M5)", "slug": "sony-a7m5", "category": "cameras", "qty": 2, "query": "Sony Alpha A7R V A7 IV camera body product white background"},
    {"id": "c-7", "name": "Sony Alpha A7S III (A7S3)", "slug": "sony-a7s3", "category": "cameras", "qty": 5, "query": "Sony Alpha A7S III mirrorless camera product white background"},
    {"id": "c-8", "name": "Sony FX3 Full-Frame Cinema Camera", "slug": "sony-fx3", "category": "cameras", "qty": 3, "query": "Sony FX3 Cinema Camera product white background"},
    {"id": "c-9", "name": "Sony FX30 Cinema Line Camera", "slug": "sony-fx30", "category": "cameras", "qty": 2, "query": "Sony FX30 Cinema Camera product white background"},
    {"id": "c-10", "name": "Sony Alpha A7R V (A7R5)", "slug": "sony-a7r5", "category": "cameras", "qty": 1, "query": "Sony Alpha A7R V camera product white background"},
    {"id": "c-11", "name": "Sony FX6 Full-Frame Cinema Camera", "slug": "sony-fx6", "category": "cameras", "qty": 2, "query": "Sony FX6 Cinema Camera product white background"},
    {"id": "c-12", "name": "Sony FX9 XDCAM Cinema Camera", "slug": "sony-fx9", "category": "cameras", "qty": 1, "query": "Sony FX9 Full Frame 6K cinema camera product white background"},
    {"id": "c-13", "name": "RED KOMODO 6K Cinema Camera", "slug": "red-komodo-6k", "category": "cameras", "qty": 1, "query": "RED Komodo 6K cinema camera product white background"},
    {"id": "c-14", "name": "Blackmagic Pocket Cinema Camera 6K Pro", "slug": "blackmagic-pocket-6k-pro", "category": "cameras", "qty": 1, "query": "Blackmagic Pocket Cinema Camera 6K Pro product white background"},
    {"id": "c-15", "name": "Canon EOS R5 Mirrorless Camera", "slug": "canon-eos-r5", "category": "cameras", "qty": 1, "query": "Canon EOS R5 mirrorless camera product white background"},
    {"id": "c-16", "name": "Canon EOS 5D Mark IV DSLR", "slug": "canon-5d-mark-iv", "category": "cameras", "qty": 2, "query": "Canon EOS 5D Mark IV DSLR camera product white background"},
    {"id": "c-17", "name": "Canon EOS 60D DSLR Camera", "slug": "canon-60d", "category": "cameras", "qty": 1, "query": "Canon EOS 60D camera product white background"},
    {"id": "c-18", "name": "GoPro MAX 360 Action Camera", "slug": "gopro-max-360", "category": "cameras", "qty": 1, "query": "GoPro MAX 360 camera product white background"},
    {"id": "c-19", "name": "GoPro HERO13 Black", "slug": "gopro-hero-13", "category": "cameras", "qty": 2, "query": "GoPro HERO 13 Black action camera product white background"},
    {"id": "c-20", "name": "GoPro HERO12 Black", "slug": "gopro-hero-12", "category": "cameras", "qty": 1, "query": "GoPro HERO 12 Black action camera product white background"},
    {"id": "c-21", "name": "GoPro HERO11 Black", "slug": "gopro-hero-11", "category": "cameras", "qty": 6, "query": "GoPro HERO 11 Black action camera product white background"},
    {"id": "c-22", "name": "Insta360 X3 Action Camera", "slug": "insta360-x3", "category": "cameras", "qty": 1, "query": "Insta360 X3 360 camera product white background"},
    {"id": "c-23", "name": "GoPro HERO8 Black", "slug": "gopro-hero-8", "category": "cameras", "qty": 2, "query": "GoPro HERO 8 Black camera product white background"},
    {"id": "c-24", "name": "DJI Mavic 3 Pro Cine Drone", "slug": "dji-mavic-3-pro", "category": "cameras", "qty": 1, "query": "DJI Mavic 3 Pro drone product white background"},
    {"id": "c-25", "name": "DJI Mavic 2 Pro Drone", "slug": "dji-mavic-2-pro", "category": "cameras", "qty": 1, "query": "DJI Mavic 2 Pro drone product white background"},

    {"id": "l-1", "name": "Sony FE 100-400mm f/4.5-5.6 GM OSS Lens", "slug": "sony-fe-100-400-gm", "category": "lenses", "qty": 1, "query": "Sony FE 100-400mm f4.5-5.6 GM OSS Lens product white background"},
    {"id": "l-2", "name": "Sony FE 50-150mm f/2 Cine Lens", "slug": "sony-fe-50-150-f2", "category": "lenses", "qty": 1, "query": "Sony 70-200mm f2.8 GM lens product white background"},
    {"id": "l-3", "name": "Sony FE 70-200mm f/2.8 GM OSS Lens", "slug": "sony-fe-70-200-gm", "category": "lenses", "qty": 3, "query": "Sony FE 70-200mm f2.8 GM OSS Lens product white background"},
    {"id": "l-4", "name": "Sony FE 70-200mm f/2.8 GM OSS II Lens", "slug": "sony-fe-70-200-gm-ii", "category": "lenses", "qty": 2, "query": "Sony FE 70-200mm f2.8 GM OSS II Lens product white background"},
    {"id": "l-5", "name": "Sony FE 16-35mm f/2.8 GM Lens", "slug": "sony-fe-16-35-gm", "category": "lenses", "qty": 4, "query": "Sony FE 16-35mm f2.8 GM Lens product white background"},
    {"id": "l-6", "name": "Sony FE 16-35mm f/2.8 GM II Lens", "slug": "sony-fe-16-35-gm-ii", "category": "lenses", "qty": 1, "query": "Sony FE 16-35mm f2.8 GM II Lens product white background"},
    {"id": "l-7", "name": "Sony FE 24-70mm f/2.8 GM Lens", "slug": "sony-fe-24-70-gm", "category": "lenses", "qty": 3, "query": "Sony FE 24-70mm f2.8 GM Lens product white background"},
    {"id": "l-8", "name": "Sony FE 24-70mm f/2.8 GM II Lens", "slug": "sony-fe-24-70-gm-ii", "category": "lenses", "qty": 3, "query": "Sony FE 24-70mm f2.8 GM II Lens product white background"},
    {"id": "l-9", "name": "Sony FE 12-24mm f/2.8 GM Lens", "slug": "sony-fe-12-24-gm", "category": "lenses", "qty": 1, "query": "Sony FE 12-24mm f2.8 GM Lens product white background"},
    {"id": "l-10", "name": "Sony FE 28-70mm f/2 GM Lens", "slug": "sony-fe-28-70-f2-gm", "category": "lenses", "qty": 1, "query": "Sony FE 28-70mm f2 GM Lens product white background"},
    {"id": "l-11", "name": "Sony FE 50mm f/1.8 Prime Lens", "slug": "sony-fe-50-f1-8", "category": "lenses", "qty": 4, "query": "Sony FE 50mm f1.8 Lens product white background"},
    {"id": "l-12", "name": "Sony Zeiss Sonnar T* FE 55mm f/1.8 ZA Lens", "slug": "sony-zeiss-55-f1-8", "category": "lenses", "qty": 1, "query": "Sony Sonnar T FE 55mm f1.8 ZA Lens product white background"},
    {"id": "l-13", "name": "Sony FE 24-105mm f/4 G OSS Lens", "slug": "sony-fe-24-105-g", "category": "lenses", "qty": 1, "query": "Sony FE 24-105mm f4 G OSS Lens product white background"},
    {"id": "l-14", "name": "Sony FE 14mm f/1.8 GM Prime Lens", "slug": "sony-fe-14-f1-8-gm", "category": "lenses", "qty": 4, "query": "Sony FE 14mm f1.8 GM Lens product white background"},
    {"id": "l-15", "name": "Sony FE 24mm f/1.4 GM Prime Lens", "slug": "sony-fe-24-f1-4-gm", "category": "lenses", "qty": 3, "query": "Sony FE 24mm f1.4 GM Lens product white background"},
    {"id": "l-16", "name": "Sony FE 35mm f/1.4 GM Prime Lens", "slug": "sony-fe-35-f1-4-gm", "category": "lenses", "qty": 3, "query": "Sony FE 35mm f1.4 GM Lens product white background"},
    {"id": "l-17", "name": "Sony FE 50mm f/1.2 GM Prime Lens", "slug": "sony-fe-50-f1-2-gm", "category": "lenses", "qty": 3, "query": "Sony FE 50mm f1.2 GM Lens product white background"},
    {"id": "l-18", "name": "Sony FE 400mm f/2.8 GM OSS Lens", "slug": "sony-fe-400-f2-8-gm", "category": "lenses", "qty": 1, "query": "Sony FE 400mm f2.8 GM OSS Lens product white background"},
    {"id": "l-19", "name": "Sony FE 85mm f/1.4 GM Prime Lens", "slug": "sony-fe-85-f1-4-gm", "category": "lenses", "qty": 3, "query": "Sony FE 85mm f1.4 GM Lens product white background"},
    {"id": "l-20", "name": "Sony FE 200-600mm f/5.6-6.3 G OSS Lens", "slug": "sony-fe-200-600-g", "category": "lenses", "qty": 1, "query": "Sony FE 200-600mm f5.6-6.3 G OSS Lens product white background"},
    {"id": "l-21", "name": "Sony FE 135mm f/1.8 GM Prime Lens", "slug": "sony-fe-135-f1-8-gm", "category": "lenses", "qty": 1, "query": "Sony FE 135mm f1.8 GM Lens product white background"},
    {"id": "l-22", "name": "Sony FE PZ 28-135mm f/4 G OSS Cinema Lens", "slug": "sony-fe-28-135-f4-pz", "category": "lenses", "qty": 2, "query": "Sony FE PZ 28-135mm f4 G OSS Lens product white background"},
    {"id": "l-23", "name": "Sony 2X Teleconverter", "slug": "sony-2x-teleconverter", "category": "lenses", "qty": 2, "query": "Sony 2x Teleconverter SEL20TC product white background"},
    {"id": "l-24", "name": "Sony FE 90mm f/2.8 Macro G OSS Lens", "slug": "sony-fe-90-macro-g", "category": "lenses", "qty": 2, "query": "Sony FE 90mm f2.8 Macro G OSS Lens product white background"},
    {"id": "l-25", "name": "Venus Optics Laowa 24mm f/14 Probe Lens", "slug": "laowa-24-probe-macro", "category": "lenses", "qty": 1, "query": "Laowa 24mm f14 Probe Lens product white background"},

    {"id": "l-26", "name": "Canon EF 70-200mm f/2.8L IS III USM Lens", "slug": "canon-ef-70-200-f2-8l", "category": "lenses", "qty": 2, "query": "Canon EF 70-200mm f2.8L IS III USM Lens product white background"},
    {"id": "l-27", "name": "Canon EF 16-35mm f/2.8L III USM Lens", "slug": "canon-ef-16-35-f2-8l", "category": "lenses", "qty": 3, "query": "Canon EF 16-35mm f2.8L III USM Lens product white background"},
    {"id": "l-28", "name": "Canon EF 24-70mm f/2.8L II USM Lens", "slug": "canon-ef-24-70-f2-8l", "category": "lenses", "qty": 4, "query": "Canon EF 24-70mm f2.8L II USM Lens product white background"},
    {"id": "l-29", "name": "Canon EF 50mm f/1.2L USM Lens", "slug": "canon-ef-50-f1-2l", "category": "lenses", "qty": 1, "query": "Canon EF 50mm f1.2L USM Lens product white background"},
    {"id": "l-30", "name": "Canon EF 100-400mm f/4.5-5.6L IS II USM Lens", "slug": "canon-ef-100-400-l", "category": "lenses", "qty": 2, "query": "Canon EF 100-400mm f4.5-5.6L IS II USM Lens product white background"},
    {"id": "l-31", "name": "Canon EF 100mm f/2.8L Macro IS USM Lens", "slug": "canon-ef-100-macro", "category": "lenses", "qty": 1, "query": "Canon EF 100mm f2.8L Macro IS USM Lens product white background"},
    {"id": "l-32", "name": "Tokina AT-X 11-16mm f/2.8 Pro DX II Lens", "slug": "tokina-11-16-f2-8", "category": "lenses", "qty": 1, "query": "Tokina 11-16mm f2.8 AT-X Pro DX II Lens product white background"},
    {"id": "l-33", "name": "Samyang 85mm f/1.4 VDSLR Cine Lens", "slug": "samyang-85-f1-4", "category": "lenses", "qty": 1, "query": "Samyang 85mm f1.4 VDSLR cine lens product white background"},
    {"id": "l-34", "name": "Samyang 35mm f/1.4 VDSLR Cine Lens", "slug": "samyang-35-f1-4", "category": "lenses", "qty": 1, "query": "Samyang 35mm f1.4 VDSLR cine lens product white background"},
    {"id": "l-35", "name": "Canon RF 70-200mm f/2.8L IS USM Lens", "slug": "canon-rf-70-200-f2-8l", "category": "lenses", "qty": 1, "query": "Canon RF 70-200mm f2.8L IS USM Lens product white background"},
    {"id": "l-36", "name": "Canon RF 15-35mm f/2.8L IS USM Lens", "slug": "canon-rf-15-35-f2-8l", "category": "lenses", "qty": 1, "query": "Canon RF 15-35mm f2.8L IS USM Lens product white background"},
    {"id": "l-37", "name": "Canon RF 24-70mm f/2.8L IS USM Lens", "slug": "canon-rf-24-70-f2-8l", "category": "lenses", "qty": 1, "query": "Canon RF 24-70mm f2.8L IS USM Lens product white background"},
    {"id": "l-38", "name": "Canon RF 50mm f/1.2L USM Lens", "slug": "canon-rf-50-f1-2l", "category": "lenses", "qty": 1, "query": "Canon RF 50mm f1.2L USM Lens product white background"},

    {"id": "l-39", "name": "Zeiss Compact Prime CP.2 6-Lens Cine Set", "slug": "zeiss-cp2-set", "category": "lenses", "qty": 6, "query": "Zeiss CP.2 Compact Prime lens set product white background"},
    {"id": "l-40", "name": "Zeiss Compact Prime CP.3 6-Lens Cine Set", "slug": "zeiss-cp3-set", "category": "lenses", "qty": 6, "query": "Zeiss CP.3 Compact Prime lens set product white background"},
    {"id": "l-41", "name": "Sigma High Speed Cine Prime Lens Set", "slug": "sigma-cine-prime-set", "category": "lenses", "qty": 7, "query": "Sigma High Speed Cine Prime lens set product white background"},
    {"id": "l-42", "name": "Zeiss Batis Full-Frame Prime Lens Set", "slug": "zeiss-batis-set", "category": "lenses", "qty": 5, "query": "Zeiss Batis lens set product white background"},

    {"id": "m-1", "name": "Atomos Sumo 19-inch HDR Production Monitor", "slug": "atomos-sumo-19", "category": "monitors", "qty": 2, "query": "Atomos Sumo 19M HDR monitor product white background"},
    {"id": "m-2", "name": "Atomos Shogun Connect 7-inch HDR Monitor", "slug": "atomos-shogun-connect-7", "category": "monitors", "qty": 4, "query": "Atomos Shogun Connect 7 inch monitor product white background"},
    {"id": "m-3", "name": "Atomos Shogun Inferno 7-inch Monitor", "slug": "atomos-shogun-inferno-7", "category": "monitors", "qty": 2, "query": "Atomos Shogun Inferno 7 inch monitor product white background"},
    {"id": "m-4", "name": "Atomos Ninja V 5-inch HDR Monitor", "slug": "atomos-ninja-v", "category": "monitors", "qty": 2, "query": "Atomos Ninja V 5 inch monitor product white background"},
    {"id": "m-5", "name": "Sony 21-inch 4K Production Studio Monitor", "slug": "sony-21-studio-monitor", "category": "monitors", "qty": 1, "query": "Sony 21 inch 4K production monitor product white background"},
    {"id": "m-6", "name": "Lilliput 7-inch 4K On-Camera Monitor", "slug": "lilliput-7-inch-monitor", "category": "monitors", "qty": 3, "query": "Lilliput 7 inch 4K monitor product white background"},

    {"id": "t-1", "name": "Studio Assist Professional 100mm Tripod", "slug": "studio-assist-100-tripod", "category": "tripods", "qty": 3, "query": "heavy duty professional video tripod fluid head white background"},
    {"id": "t-2", "name": "Sachtler Video Professional Fluid Head Tripod", "slug": "sachtler-video-tripod", "category": "tripods", "qty": 5, "query": "Sachtler video tripod fluid head product white background"},
    {"id": "t-3", "name": "Teris Carbon Fiber Heavy Duty Video Tripod", "slug": "teris-carbon-tripod", "category": "tripods", "qty": 2, "query": "Teris professional carbon fiber video tripod product white background"},
    {"id": "t-4", "name": "Manfrotto 504HD / 516 Fluid Head Video Tripod", "slug": "manfrotto-504hd-tripod", "category": "tripods", "qty": 6, "query": "Manfrotto 504HD fluid video head tripod product white background"},

    {"id": "g-1", "name": "DJI Ronin 2 Professional Gimbal Stabilizer", "slug": "dji-ronin-2-gimbal", "category": "gimbals", "qty": 1, "query": "DJI Ronin 2 3-Axis Gimbal Stabilizer product white background"},
    {"id": "g-2", "name": "DJI RS 3 Pro Gimbal Stabilizer", "slug": "dji-rs3-pro-gimbal", "category": "gimbals", "qty": 4, "query": "DJI RS 3 Pro gimbal stabilizer product white background"},
    {"id": "g-3", "name": "DJI RS 4 Pro Gimbal Stabilizer", "slug": "dji-rs4-pro-gimbal", "category": "gimbals", "qty": 5, "query": "DJI RS 4 Pro gimbal stabilizer product white background"},
    {"id": "g-4", "name": "Zhiyun Crane 3S Heavy Duty Gimbal", "slug": "zhiyun-crane-3s-gimbal", "category": "gimbals", "qty": 1, "query": "Zhiyun Crane 3S gimbal stabilizer product white background"},
    {"id": "g-5", "name": "EasyRig Vario 5 Camera Support Rig", "slug": "easyrig-vario-5", "category": "gimbals", "qty": 1, "query": "Easyrig Vario 5 with Gimbal Rig Vest product white background"},
    {"id": "g-6", "name": "Ready Rig GS Gimbal Support System", "slug": "ready-rig-gs", "category": "gimbals", "qty": 1, "query": "Ready Rig GS Vega gimbal support product white background"},
    {"id": "g-7", "name": "Dana Dolly Universal Kit", "slug": "dana-dolly-kit", "category": "gimbals", "qty": 1, "query": "Dana Dolly Portable Camera Dolly Kit product white background"},
    {"id": "g-8", "name": "Heavy Duty Camera Slider", "slug": "camera-heavy-slider", "category": "gimbals", "qty": 4, "query": "camera slider heavy duty carbon fiber product white background"},
    {"id": "g-9", "name": "Cinema 4x4 Clip-On Matte Box", "slug": "matte-box-4x4", "category": "gimbals", "qty": 4, "query": "Tilta 4x4 carbon fiber matte box product white background"},

    {"id": "s-1", "name": "Sennheiser EW 100 G4 Wireless Lapel Mic Set", "slug": "sennheiser-ew-g4-lapel", "category": "sound", "qty": 21, "query": "Sennheiser EW 100 G4 wireless microphone set product white background"},
    {"id": "s-2", "name": "DJI Mic 2 Dual Wireless Microphone Set", "slug": "dji-mic-2-wireless", "category": "sound", "qty": 6, "query": "DJI Mic 2 wireless microphone 2 tx 1 rx charging case product white background"},
    {"id": "s-3", "name": "Sennheiser MKH 416 Boom Shotgun Microphone", "slug": "sennheiser-mkh-416-boom", "category": "sound", "qty": 2, "query": "Sennheiser MKH 416 shotgun microphone product white background"},
    {"id": "s-4", "name": "Sound Devices 664 Production Field Mixer", "slug": "sound-devices-664-mixer", "category": "sound", "qty": 1, "query": "Sound Devices 664 field audio mixer recorder product white background"},
    {"id": "s-5", "name": "Sound Devices 552 Production Audio Mixer", "slug": "sound-devices-552-mixer", "category": "sound", "qty": 2, "query": "Sound Devices 552 production audio mixer product white background"},
    {"id": "s-6", "name": "Zoom H6 6-Track Handy Audio Recorder", "slug": "zoom-h6-audio-recorder", "category": "sound", "qty": 3, "query": "Zoom H6 Handy Recorder product white background"},
    {"id": "s-7", "name": "Rode VideoMic Pro+ On-Camera Shotgun Mic", "slug": "rode-videomic-pro", "category": "sound", "qty": 4, "query": "Rode VideoMic Pro Plus shotgun microphone product white background"},
    {"id": "s-8", "name": "Production Wireless Walkie-Talkies (Set)", "slug": "wireless-walkie-talkie-set", "category": "sound", "qty": 20, "query": "Motorola two way radio walkie talkie set product white background"},
    {"id": "s-9", "name": "Wireless Talkback Intercom Headset System", "slug": "talkback-headset-system", "category": "sound", "qty": 8, "query": "Hollyland Solidcom wireless intercom headset system product white background"},

    {"id": "lt-1", "name": "Aputure LS 1200d Pro Daylight LED", "slug": "aputure-ls-1200d-pro", "category": "lights", "qty": 1, "query": "Aputure LS 1200d Pro LED Light product white background"},
    {"id": "lt-2", "name": "Aputure LS 600d Pro Daylight LED", "slug": "aputure-ls-600d-pro", "category": "lights", "qty": 2, "query": "Aputure LS 600d Pro LED Light product white background"},
    {"id": "lt-3", "name": "Aputure LS 300x Bi-Color LED Light", "slug": "aputure-ls-300x", "category": "lights", "qty": 1, "query": "Aputure LS 300x bi color LED light product white background"},
    {"id": "lt-4", "name": "Aputure Amaran 100x Bi-Color LED", "slug": "aputure-amaran-100x", "category": "lights", "qty": 1, "query": "Amaran 100x bi color LED light product white background"},
    {"id": "lt-5", "name": "Aputure Nova P300c RGBWW LED Panel", "slug": "aputure-nova-p300c", "category": "lights", "qty": 2, "query": "Aputure Nova P300c RGBWW LED Panel product white background"},
    {"id": "lt-6", "name": "Aputure MC 4-Light Travel RGB Kit", "slug": "aputure-mc-4-light-kit", "category": "lights", "qty": 8, "query": "Aputure MC 4-Light Travel Kit RGB LED product white background"},
    {"id": "lt-7", "name": "Aputure Infinibar 4-Foot RGB Tube Light", "slug": "aputure-infinibar-4ft", "category": "lights", "qty": 12, "query": "Aputure INFINIBAR PB12 4ft RGB LED Tube Light product white background"},
    {"id": "lt-8", "name": "Nanlite Forza 720B Bi-Color LED Spot Light", "slug": "nanlite-forza-720b", "category": "lights", "qty": 2, "query": "Nanlite Forza 720B Bi-Color LED Monolight product white background"},
    {"id": "lt-9", "name": "Nanlite Forza 500B Bi-Color LED Light", "slug": "nanlite-forza-500b", "category": "lights", "qty": 2, "query": "Nanlite Forza 500B Bi-Color LED light product white background"},
    {"id": "lt-10", "name": "Nanlite Forza 300B Bi-Color LED Light", "slug": "nanlite-forza-300b", "category": "lights", "qty": 6, "query": "Nanlite Forza 300B Bi-Color LED light product white background"},
    {"id": "lt-11", "name": "Nanlite PavoTube II 4-Foot RGBWW Tube Light", "slug": "nanlite-pavotube-ii-4ft", "category": "lights", "qty": 4, "query": "Nanlite PavoTube II 30X 4ft RGBWW LED Tube Light product white background"},
    {"id": "lt-12", "name": "Nanlite PavoTube II 2-Foot RGBWW Tube Light", "slug": "nanlite-pavotube-ii-2ft", "category": "lights", "qty": 6, "query": "Nanlite PavoTube II 15X 2ft RGBWW LED Tube Light product white background"},
    {"id": "lt-13", "name": "Godox VL200 200W LED Video Light", "slug": "godox-vl200-led", "category": "lights", "qty": 2, "query": "Godox VL200 LED Video Light product white background"},
    {"id": "lt-14", "name": "Godox 300C RGB LED Light", "slug": "godox-300c-rgb", "category": "lights", "qty": 4, "query": "Godox Knowled M300D M300Bi 300W LED Light product white background"},
    {"id": "lt-15", "name": "Godox LC500R RGB LED Light Stick", "slug": "godox-lc500r-light-stick", "category": "lights", "qty": 5, "query": "Godox LC500R RGB LED Light Stick product white background"},
    {"id": "lt-16", "name": "Godox Flexible Mat LED 150W Light", "slug": "godox-flexible-mat-led", "category": "lights", "qty": 5, "query": "Godox FL150S flexible LED light mat product white background"},
    {"id": "lt-17", "name": "Elinchrom D-Lite RX 400 Strobe Monolight", "slug": "elinchrom-400-strobe", "category": "lights", "qty": 2, "query": "Elinchrom D-Lite RX 400 strobe flash product white background"},

    {"id": "st-1", "name": "Professional 40-inch C-Stand with Grip Arm", "slug": "c-stand-turtle-base", "category": "stands", "qty": 30, "query": "Avenger 40 inch C-Stand with grip arm and turtle base chrome product white background"},
    {"id": "st-2", "name": "Heavy Duty Master Steel Light Stand", "slug": "heavy-duty-light-stand", "category": "stands", "qty": 25, "query": "heavy duty steel light stand with wheels product white background"},
    {"id": "st-3", "name": "Heavy Duty Light Boom Arm with Counterweight", "slug": "light-boom-arm-stand", "category": "stands", "qty": 3, "query": "heavy duty studio light boom arm with counterweight product white background"},
    {"id": "st-4", "name": "Studio Cutter Flag Solid Black 3x3 Ft", "slug": "cutter-flag-3x3", "category": "stands", "qty": 20, "query": "Matthews 36x36 inch solid black flag cutter grip product white background"},

    {"id": "f-1", "name": "4x4 Cinema ND and Polarizer Filter Set", "slug": "4x4-cinema-filter-set", "category": "filters", "qty": 12, "query": "Tiffen 4x4 cinema filter set ND polarizer product white background"},
    {"id": "f-2", "name": "Variable ND Neutral Density Lens Filter", "slug": "variable-nd-filter", "category": "filters", "qty": 6, "query": "PolarPro Variable ND filter Peter McKinnon product white background"},
    {"id": "b-1", "name": "High Capacity V-Mount 190Wh Cinema Battery & Dual Charger", "slug": "v-mount-battery-kit", "category": "accessories", "qty": 26, "query": "FXLION V-Mount battery dual charger product white background"},
    {"id": "b-2", "name": "Sony NP-FZ100 Rechargeable Battery Set", "slug": "sony-np-fz100-battery", "category": "accessories", "qty": 31, "query": "Sony NP-FZ100 battery pack product white background"},
    {"id": "cd-1", "name": "Sony TOUGH CFexpress Type A Memory Card 160GB", "slug": "sony-tough-cfexpress-type-a", "category": "accessories", "qty": 21, "query": "Sony 160GB TOUGH CFexpress Type A memory card product white background"},
    {"id": "wf-1", "name": "Tilta Nucleus-M Wireless Follow Focus Kit", "slug": "tilta-nucleus-m-wireless", "category": "accessories", "qty": 2, "query": "Tilta Nucleus-M Wireless Follow Focus Kit product white background"},
    {"id": "tx-1", "name": "Hollyland Cosmo Wireless Video Transmitter System", "slug": "wireless-video-transmitter", "category": "accessories", "qty": 6, "query": "Hollyland Cosmo C1 wireless video transmitter receiver product white background"},
    {"id": "ed-1", "name": "Apple 27-inch iMac Retina 5K Video Editing Workstation", "slug": "apple-imac-5k-retina", "category": "editing", "qty": 2, "query": "Apple 27 inch iMac Retina 5K display product white background"}
]

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5'
}

def search_bing_image_candidates(query):
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query)}&form=HDRSC2&first=1"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            murls = re.findall(r'murl&quot;:&quot;(http[^&]+)&quot;', html)
            if not murls:
                murls = re.findall(r'"murl":"(http[^"]+)"', html)
            return murls[:5]
    except Exception as e:
        return []

def download_image_from_urls(urls, output_path):
    for u in urls:
        try:
            clean_url = urllib.parse.unquote(u)
            req = urllib.request.Request(clean_url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=10) as response:
                content_type = response.headers.get('Content-Type', '')
                data = response.read()
                if len(data) > 5000:
                    with open(output_path, 'wb') as f:
                        f.write(data)
                    return True, len(data)
        except Exception:
            continue
    return False, 0

def process_product(product):
    slug = product["slug"]
    output_filename = f"{slug}.jpg"
    output_path = os.path.join(DEST_DIR, output_filename)
    
    if os.path.exists(output_path) and os.path.getsize(output_path) > 5000:
        return {
            **product,
            "image": f"/images/products/{output_filename}",
            "status": "cached",
            "size": os.path.getsize(output_path)
        }
    
    urls = search_bing_image_candidates(product["query"])
    if not urls:
        urls = search_bing_image_candidates(f"{product['name']} photo")
        
    success, size = download_image_from_urls(urls, output_path)
    
    if success:
        return {
            **product,
            "image": f"/images/products/{output_filename}",
            "status": "downloaded",
            "size": size
        }
    else:
        return {
            **product,
            "image": f"/images/products/{output_filename}",
            "status": "failed",
            "size": 0
        }

def main():
    print(f"Starting bulk image downloader for {len(PRODUCTS)} products into {DEST_DIR}...")
    results = []
    
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(process_product, p): p for p in PRODUCTS}
        for future in as_completed(futures):
            res = future.result()
            results.append(res)
            print(f"[{res['status'].upper()}] {res['name']} -> {res['slug']}.jpg ({res['size'] // 1024} KB)")

    manifest_path = os.path.join(DEST_DIR, "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(results, f, indent=2)

    downloaded = sum(1 for r in results if r["status"] in ["downloaded", "cached"])
    print(f"\n==================================================")
    print(f"Total Products: {len(PRODUCTS)}")
    print(f"Successfully Available: {downloaded}/{len(PRODUCTS)}")
    print(f"Manifest written to: {manifest_path}")
    print(f"==================================================")

if __name__ == "__main__":
    main()
