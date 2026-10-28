import urllib.request
import urllib.parse
import json
import re

def search_wikimedia(query):
    headers = {'User-Agent': 'CameraRentDownloader/1.0 (contact@camerarent.local)'}
    url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(query)}&gsrlimit=3&prop=imageinfo&iiprop=url|mime&format=json"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get('query', {}).get('pages', {})
            for pid, page in pages.items():
                imginfo = page.get('imageinfo', [])
                if imginfo:
                    return imginfo[0].get('url')
    except Exception as e:
        print(f"Wikimedia error: {e}")
    return None

def search_bing(query):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
    }
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query)}&form=HDRSC2&first=1"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            html = resp.read().decode('utf-8')
            murls = re.findall(r'murl&quot;:&quot;(http[^&]+)&quot;', html)
            if not murls:
                murls = re.findall(r'"murl":"(http[^"]+)"', html)
            if murls:
                return murls[0]
    except Exception as e:
        print(f"Bing error: {e}")
    return None

print("Testing Bing:")
print("Sony FX3:", search_bing("Sony FX3 Cinema Camera product white background"))
print("Aputure 600D:", search_bing("Aputure LS 600d Pro light product"))
