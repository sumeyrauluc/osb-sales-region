# OSB Satış Bölgeleri

Ankara'daki ilçe ve OSB'lerin (ve Türkiye'deki illerin) hangi satışçıya ait
olduğunu gösteren, internetsiz çalışan harita uygulaması.

## Kullanım
`OSB-Satis-Bolgeleri.html` dosyasına çift tıklayın; Edge'de açılır.
Kurulum, internet ya da sunucu gerekmez (VPN/firewall arkasında çalışır).
Ayrıntılar için `NASIL-ACILIR.txt` dosyasına bakın.

- Bölge oluşturup haritadan il, ilçe ve OSB seçme
- OSB dışındaki müşteriler için serbest çizimle alan ekleme
- PDF önizleme ve indirme
- Paylaşım kopyası (düzenlenebilir ya da salt okunur), yedek ve Excel listesi

## Geliştirme
Kaynak kod `kaynak/` klasöründedir. Değişiklikten sonra tek dosyayı
yeniden üretmek için:

    python kaynak/build/build.py OSB-Satis-Bolgeleri.html

## Lisanslar ve veri kaynakları
- Harita motoru: Leaflet (BSD-2)
- İlçe ve il sınırları: geoBoundaries (CC BY 4.0)
- OSB ve Ankara il sınırı: © OpenStreetMap katkıcıları (ODbL)
