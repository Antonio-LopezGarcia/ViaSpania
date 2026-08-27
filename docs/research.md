# Research record — 17 August 2026

- PNOA WMTS `GetCapabilities` returned valid XML (116001 bytes): `https://www.ign.es/wmts/pnoa-ma?service=WMTS&request=GetCapabilities`.
- MDT WCS 2.0.1 `GetCapabilities` returned valid XML (12162 bytes): `https://servicios.idee.es/wcs-inspire/mdt?service=WCS&request=GetCapabilities&version=2.0.1`.
- IGN lists PNOA maximum-current imagery and the national elevation model among its official WMTS services.
- OSM standard tiles require visible attribution, caching, a valid referrer/user identification and prohibit bulk/offline prefetching.
- movecost 3.0.0 (GPL >=2) exposes 26 functions and uses a build-once cost surface with signed directional slope. ViaSpania does not copy GPL source; the initial equations are independent implementations and need numerical reference validation before scientific release.
- IGN/CNIG reuse conditions use CC BY 4.0-compatible attribution. The UI preserves both required source notices.

Network capabilities are fixtures only in the local test strategy; release checks should repeat live requests and validate a small GeoTIFF using GDAL once installed.
