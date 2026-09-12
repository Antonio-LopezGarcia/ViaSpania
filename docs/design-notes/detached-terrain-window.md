# Ventana independiente del visor 3D

La implementación anterior empleaba `window.open` y trasladaba un nodo DOM. Ese mecanismo no crea una WebviewWindow de Tauri y tampoco permite compartir nodos DOM entre webviews nativas.

En escritorio, Configuración → visor 3D → «Abrir el visor 3D en una ventana independiente» crea ahora una WebviewWindow decorada, redimensionable y maximizable. Ambas ventanas utilizan la misma barra de opciones y la misma leyenda, con idénticos estilos. La ventana externa incluye exageración, grosor de rutas, paleta, mapas base incorporados e importados, visibilidad de elementos y estados de carga. Sus acciones se aplican en el proyecto principal y el estado actualizado vuelve a ambos visores. Los paneles de cámara, animación y exportación pertenecen al componente Terrain3D compartido. La ventana principal conserva la vista general del proyecto: el contenedor del visor integrado se oculta completamente, sin ocupar espacio ni mostrar controles o avisos adicionales. Su componente de comunicación permanece montado para sincronizar el visor externo. Al volver al integrado se restaura el contenedor. La ventana auxiliar arranca únicamente el visor, no una segunda instancia del proyecto.

El visor solicita el estado cuando ha instalado su receptor. La ventana principal envía las propiedades actuales del terreno, textura y atribuciones, elementos, rutas, superficies, leyenda y perfil; los cambios posteriores se vuelven a enviar. Los cambios de cámara y visibilidad de la leyenda retornan al proyecto principal. No se serializan callbacks de React. El canal es efímero y no guarda copias del proyecto.

Cerrar la ventana auxiliar o pulsar «Volver al visor integrado» desactiva la preferencia y devuelve el visor a la ventana principal. Desmontar el visor destruye la ventana auxiliar. Un error o un tiempo de apertura superior a 15 segundos recupera el visor integrado y muestra un mensaje en español.

## Validación manual pendiente en escritorio

1. Ejecutar `pnpm desktop:dev`, cargar un MDT y abrir el visor con la preferencia activada.
2. Arrastrar la ventana por su barra de título al segundo monitor, redimensionarla y maximizarla.
3. Modificar rutas, barreras, facilitadores, paleta y capas en la ventana principal; comprobar la actualización y las atribuciones en la externa.
4. Cambiar la cámara y la leyenda externa; cerrar y comprobar el retorno al integrado y la conservación del proyecto.
5. Reabrir, volver a integrar desde el botón y repetir el ciclo. Cerrar la aplicación principal con la ventana externa abierta y comprobar que no queda una ventana huérfana.

Las pruebas automatizadas cubren la serialización, el saludo inicial, los cambios de estado, el retorno, la destrucción de la ventana auxiliar y los errores de creación. La comprobación de Rust valida también los permisos de Tauri. La movilidad entre monitores necesita la comprobación manual anterior.
