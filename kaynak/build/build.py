# Tek dosyalık uygulamayı üretir:  python kaynak/build/build.py OSB-Satis-Bolgeleri.html
import json, sys, os
K = os.path.dirname(os.path.abspath(__file__)) + '/..'
def R(p): return open(K + '/' + p, encoding='utf8').read()
def J(p): return json.loads(R('osm/' + p))
def dump(o): return json.dumps(o, ensure_ascii=False, separators=(',', ':'))
ilce, lpi = J('ilce.geojson'), J('lp_ilce.geojson')
for f, p in zip(ilce['features'], lpi['features']):
    x, y = p['geometry']['coordinates']; f['properties']['lp'] = [round(y, 5), round(x, 5)]
osb, lpo = J('osb_final.geojson'), J('lp_osb.geojson')
for f, p in zip(osb['features'], lpo['features']):
    x, y = p['geometry']['coordinates']; f['properties']['lp'] = [round(y, 5), round(x, 5)]
iller, lpl = J('iller.geojson'), J('lp_iller.geojson')
for f, p in zip(iller['features'], lpl['features']):
    x, y = p['geometry']['coordinates']; f['properties']['lp'] = [round(y, 4), round(x, 4)]
t, lj, app = R('build/template.html'), R('leaflet.js'), R('build/app.js')
assert '</script' not in lj and '</script' not in app
rep = {'/*LEAFLET_CSS*/': R('leaflet.css'), '/*LEAFLET_JS*/': lj, '/*ILCE*/': dump(ilce),
       '/*IL*/': dump(J('il_s.geojson')), '/*ILLER*/': dump(iller), '/*OSB*/': dump(osb), '/*APP_JS*/': app}
for k, v in rep.items():
    assert t.count(k) == 1, k
    t = t.replace(k, v)
open(sys.argv[1], 'w', encoding='utf8', newline='\n').write(t)
print('ok', len(t.encode()) // 1024, 'KB')
