# API Documentation - RGR Handmade

## Public APIs

Le seguenti API sono pubbliche e non richiedono autenticazione.

### GET /api/collections

Restituisce tutte le collection pubblicate.

**Response:**
```json
{
  "collections": [
    {
      "id": 1,
      "ref": "Nº 016",
      "title": "Filigrana",
      "description": "Oro 18kt · pietre dure",
      "category": "Collane",
      "img_path": "hero-1.png",
      "img_position": "70% 80%",
      "lang": "it",
      "status": "published",
      "sort_order": 1,
      "created_at": "2026-05-20T13:13:51.803526+00:00"
    }
  ],
  "count": 5
}
```

### GET /api/collections/[collectionId]/items

Restituisce gli item di una collection specifica.

**Parameters:**
- `collectionId` (path): ID della collection

**Response:**
```json
{
  "collectionId": 1,
  "items": [
    {
      "id": 1,
      "collection_id": 1,
      "title": "Item Name",
      "slug": "item-name",
      "description": "Description",
      "image_path": "image.webp",
      "status": "published",
      "sort_order": 1,
      "created_at": "2026-05-20T13:13:51.803526+00:00"
    }
  ],
  "count": 3
}
```

### GET /api/press

Restituisce tutti gli articoli press e le fiere pubblicate.

**Query Parameters:**
- `type` (optional): `"fiera"` | `"press"` - Filtra per tipo
- `lang` (optional): Codice lingua (es. `"it"`, `"en"`)
- `page` (optional): Numero di pagina (default: 0)
- `limit` (optional): Articoli per pagina (default: 50, max: 100)

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "title": "Press Release Title",
      "type": "press",
      "category": "News",
      "venue": null,
      "description": "Description",
      "event_date": "2026-05-20",
      "lang": "it",
      "status": "published",
      "created_at": "2026-05-20T13:13:51.803526+00:00"
    }
  ],
  "count": 10,
  "page": 0,
  "limit": 50,
  "total_pages": 1
}
```

**Examples:**
```
GET /api/press?type=fiera&lang=it&limit=10
GET /api/press?type=press&page=1
```

### GET /api/site-settings

Restituisce le impostazioni pubbliche del sito.

**Response:**
```json
{
  "title": "RGR Handmade",
  "description": "Gioielli artigianali",
  "favicon_url": "/favicon.ico",
  "language": "it",
  "theme": "light"
}
```

### GET /api/vitrix/status

Verifica lo status del backend Vitrix (diagnostica).

**Response:**
```json
{
  "vitrix": true,
  "supabaseConfigured": true,
  "serviceRoleConfigured": true,
  "mode": "supabase"
}
```

## Admin APIs

Le seguenti API richiedono autenticazione Supabase.

### GET /api/vitrix/bootstrap

Restituisce i dati di bootstrap per l'admin (utente, licenza, stato).

**Authentication:** Required (Supabase Auth)

### GET /api/vitrix/collections

Restituisce tutte le collection (draft e published).

### POST /api/vitrix/collections

Crea una nuova collection.

### GET /api/vitrix/media

Restituisce i file media caricati.

### POST /api/vitrix/media

Carica un nuovo file media.

### GET /api/vitrix/press

Restituisce tutti gli articoli press/fiere.

### POST /api/vitrix/press

Crea un nuovo articolo press/fiera.

### GET /api/vitrix/settings

Restituisce le impostazioni del sito.

### PUT /api/vitrix/settings

Aggiorna le impostazioni del sito.

## Mobile Optimizations

Il frontend è stato ottimizzato per mobile con:

- **Responsive hooks**: `useIsMobile()`, `useAnimationDisabled()`, `useReducedMotion()`
- **Mobile CSS**: Media queries per schermi < 768px
- **Adaptive animations**: Disabilita parallax e animazioni pesanti su mobile
- **Touch-friendly**: Touch targets >= 44px
- **Responsive typography**: Font sizes scalabili con `clamp()`

### Utilizzo degli Hook

```typescript
import { useIsMobile, useAnimationDisabled } from "@/lib/useResponsive";

function MyComponent() {
  const isMobile = useIsMobile();
  const animationDisabled = useAnimationDisabled();

  if (isMobile) {
    // Versione mobile
  } else {
    // Versione desktop
  }
}
```

## Backend Health

**Current Status:**
- ✅ Supabase connectivity
- ✅ Authentication system
- ✅ Public APIs
- ✅ Admin APIs
- ✅ Media management
- ✅ Collections system
- ✅ Press/News system

**Last Updated:** 2026-05-29
