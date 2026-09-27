# Mapa LiDAR del IGN

La opción «Mapa LiDAR · IGN» está disponible en selección, cartografía, fondos de cálculo, comparación, textura 3D e informes. Se habilita también al cargar preferencias anteriores.

Adaptador: `src/services/lidarMap.ts`. WMS oficial: https://wms-mapa-lidar.idee.es/lidar, capa `EL.GridCoverage`, estilo `default`, EPSG:3857, PNG. Capacidades capturadas el 20 de septiembre de 2026 en `public/fixtures/ign-lidar-wms.xml`. Verificado GetMap real con HTTP 200, image/png y Access-Control-Allow-Origin: *.

El servicio publicado se denomina «Mapa LiDAR», sin identificador de cobertura en el nombre de capa; no se etiqueta como segunda cobertura exclusivamente. Vegetación en verde, edificación en rojo y láminas de agua en azul, sobre superficies sombreadas. El servicio anuncia información de alturas a partir de aproximadamente 1:20.000. Es una referencia visual: las barreras y facilitadores siguen siendo definidos por el usuario, sin clasificación automática ni cambios en los costes.

Créditos: IGN/CNIG, Sistema Cartográfico Nacional, PNOA-LiDAR, CC BY 4.0.

Referencias:
- https://pnoa.ign.es/pnoa-lidar/mapa-lidar
- https://www.idee.es/csw-inspire-idee/srv/spa/catalog.search?#/metadata/spaign_mapa_lidar_cob2
- https://www.ign.es/web/es/ign/portal/ide-area-nodo-ide-ign
