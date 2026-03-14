# StremioX - External APIs & Integrations

## API Overview

StremioX integrates with three primary external services:

```
+-----------------+     +-----------------+     +-----------------+
|   Stremio API   |     |   Cinemeta      |     |   Real-Debrid   |
|   (Auth, Addons)|     |   (Metadata)    |     |   (Downloads)   |
+--------+--------+     +--------+--------+     +--------+--------+
         |                       |                       |
         +-----------------------+-----------------------+
                                 |
                         +-------+-------+
                         |  StremioX App |
                         +---------------+
```

## Stremio API

### Client Library

**Package:** `stremio-api-client` (v1.6.0)

**Purpose:** Official Stremio JavaScript client for:
- User authentication
- Add-on management
- Library sync
- Watched status

### API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/user | POST | Login |
| /api/user/register | POST | Register |
| /api/addonCollection/get | GET | Get installed add-ons |
| /api/addonCollection/set | POST | Set add-on collection |

## Cinemeta API

### Base URL

```
https://v3-cinemeta.strem.io
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /meta/movie/{id}.json | GET | Get movie metadata |
| /meta/series/{id}.json | GET | Get series metadata |
| /catalog/{type}/{id}.json | GET | Get catalog |

### Response Example

```json
{
  "meta": {
    "id": "tt1234567",
    "type": "movie",
    "name": "Movie Title",
    "poster": "https://.../poster.jpg",
    "description": "Movie description...",
    "genres": ["Action", "Drama"],
    "imdbRating": "8.5"
  }
}
```

## Real-Debrid API

### Base URL

```
https://api.real-debrid.com/rest/1.0
```

### Authentication

**Header:** `Authorization: Bearer {API_KEY}`

### API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /torrents | POST | Add magnet |
| /torrents/info/{id} | GET | Get torrent info |
| /torrents/selectFiles/{id} | POST | Select files |
| /unrestrict/link | POST | Unrestrict URL |

### Rate Limiting

**Implementation:** `p-queue` with concurrency limit of 2

### Polling Strategy

**Exponential Backoff:**
- Delays: 3s, 5s, 8s, 13s, 21s (Fibonacci-ish)
- Max wait time: 3 minutes

## Add-on Protocol

### Stremio Add-on Manifest

```typescript
interface AddonManifest {
  id: string;
  version: string;
  name: string;
  transportUrl: string;  // Base URL for addon API
  resources: string[];   // ["stream", "meta", "catalog"]
  types: string[];       // ["movie", "series"]
}
```

### Stream Resource

**Endpoint:** `GET {transportUrl}/stream/{type}/{id}.json`

## HTTP Client Configuration

### Axios Instances

```typescript
// Stremio API
export const stremioApi = axios.create({
  baseURL: 'https://api.strem.io',
  timeout: 15000,
});

// Cinemeta
export const cinemetaApi = axios.create({
  baseURL: 'https://v3-cinemeta.strem.io',
  timeout: 10000,
});

// Real-Debrid
export const rdApi = axios.create({
  baseURL: 'https://api.real-debrid.com/rest/1.0',
  timeout: 10000,
});
```

## Error Handling

### API Error Types

| Error | Status | Handling |
|-------|--------|----------|
| Unauthorized | 401 | Clear auth, redirect to login |
| Rate Limited | 429 | Retry with backoff |
| Not Found | 404 | Show error toast |
| Server Error | 500 | Retry, show error |
| Network Error | - | Show offline message |

## Offline Support

### What Works Offline
- Play downloaded content
- View cached metadata
- Browse download list
- View watch progress

### What Requires Network
- Authentication
- Stream fetching
- Real-Debrid operations
- Metadata updates
- Add-on management
