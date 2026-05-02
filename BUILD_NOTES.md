# Build Notes — Rituel v2

## App.json TODO'ları

- `ios.buildNumber: "17"` — şu an Build 17 restore için. App Store submit'ten ÖNCE **18**'e çıkarılacak.
- `android.versionCode: 2` — Google Play submit'ten önce gözden geçirilecek.
- EAS project ID + owner: yeniden init edilecek (`eas init` ile yeni ID alınacak).
- `expo-camera` plugin — şu an çıkarıldı. Native barcode scanner gerekirse ayrı faz olarak eklenecek (prebuild + EAS build gerekir).
- `experiments.typedRoutes` — şu an kapalı. Polish phase'inde açılacak, tüm `as any` cast'leri typed-route formuna çevrilecek.
