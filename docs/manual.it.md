# Manuale generale di ViaSpania

ViaSpania permette di esplorare il rilievo, calcolare percorsi di costo minimo e studiare accessibilità e visibilità. Questa guida descrive gli strumenti cartografici e di selezione.

## Cartografia e misurazioni

### Pannello Cartografia e percorsi di avvicinamento

Espandendo **Cartografia** è possibile consultare i livelli cartografici e le ortofoto disponibili e, nel visualizzatore storico, creare e modificare **percorsi di avvicinamento**. Sono linee disegnate dall'utente sulla mappa per documentare accessi, percorsi osservati o ipotesi di avvicinamento all'area di studio. Non sono itinerari calcolati dal modello, non modificano il costo del terreno e non partecipano alle analisi. È possibile disegnarle, spostarle e modificarne i vertici, tagliarle, unire gli estremi, eliminarle, cambiarne colore e stile, nasconderle, inquadrare la linea e annullare o ripristinare le modifiche. Per terminare una linea fare doppio clic; è possibile unire linee con estremi coincidenti.

### Misurare nei visualizzatori

Nelle opzioni di ciascun visualizzatore di calcolo e nel visualizzatore di **Cartografia** espanso è possibile misurare distanze e aree. Per misurare una distanza, aggiungere vertici con clic e terminare con doppio clic; per un'area, segnare il contorno e terminare allo stesso modo. Le distanze sono indicate in unità di lunghezza e le aree in unità quadrate. Se è caricato un modello di elevazione, è possibile ottenere anche il **profilo della distanza**: attivare l'opzione per consultare le quote lungo la linea disegnata. Il profilo richiede una distanza e quote valide; la misurazione non ricalcola né modifica i risultati dell'analisi.

## Pannello Selezione

### Passaggi obbligatori

Selezionare **Passaggio obbligatorio** se il percorso deve visitare quel ponte o passaggio. Se non è selezionato, il passaggio resta disponibile per attraversare la barriera, ma il percorso può scegliere un'alternativa. I passaggi obbligatori si applicano ai percorsi semplici, al confronto, alle connessioni multipunto e alle alternative.

L'applicazione concatena le visite e non ne ottimizza globalmente l'ordine. In Multipercorso le condizioni si applicano a ogni tratta e un passaggio può essere visitato più di una volta. Le isocrone e la superficie del corridoio non rappresentano un itinerario di visite obbligatorie.

### Creare una barriera marittima

Nel visualizzatore **Selezione**, usare **Crea maschera marina** dopo aver caricato un MDT associato all'area di studio. Fare clic su una cella del mare: ViaSpania individua la regione contigua con elevazione simile e ne traccia il contorno come barriera assoluta. La maschera aiuta a evitare che le analisi di costo minimo attraversino il mare quando il modello contiene celle marine con valori di elevazione che altrimenti consentirebbero il passaggio. Viene ricavata dal modello di elevazione; non è un dato batimetrico né una delimitazione ufficiale della costa.

La **Tolleranza**, espressa in metri, determina quale differenza di quota rispetto alla cella selezionata è accettata nell'individuazione della regione. Se il contorno include troppa terra o non copre tutta l'acqua, modificare la tolleranza e fare nuovamente clic sul mare: il risultato viene aggiunto alle parti della maschera già esistente. Controllare il tracciato, soprattutto presso estuari, lagune, isole e aree dove terra e acqua hanno quote simili. L'algoritmo segue celle contigue, non riconosce coste o uso del suolo.

Espandendo il visualizzatore Selezione sono disponibili opzioni avanzate per **modificare i vertici**, **eliminare linee** e **annullare/ripristinare** le modifiche. Correggere manualmente il contorno se necessario. La maschera è una barriera assoluta e impedisce l'attraversamento delle celle interessate: verificare che non chiuda passaggi terrestri stretti che devono restare percorribili. Il progetto salvato conserva la barriera insieme alle altre condizioni. Nasconderla in un visualizzatore ne modifica solo la visualizzazione.

## Analisi topografiche

### Visibilità

È possibile calcolare la visibilità da più punti contemporaneamente e attivare o disattivare ciascun osservatore nel risultato. Quando si mostrano più osservatori insieme, una cella è visibile se è visibile da almeno uno degli osservatori selezionati. Nel visualizzatore 3D si può scegliere un osservatore, mostrare solo le aree visibili o non visibili, regolare l'opacità oppure avviare un calcolo da un punto selezionato sul terreno. L'altezza dell'osservatore è misurata sopra la superficie del modello caricato.

Il calcolo confronta la pendenza apparente di ogni cella, `s = (z − (z₀ + h)) / d` (quote `z` e `z₀`, altezza dell'osservatore `h` e distanza orizzontale `d` in metri; `s` è adimensionale), con l'orizzonte massimo precedente. Questo criterio di visibilità basato sul gradiente è descritto anche nel manuale di [GRASS GIS r.viewshed](https://grass.osgeo.org/grass-stable/manuals/r.viewshed.html). ViaSpania usa la quota della cella più vicina all'osservatore e approssima ogni cella come un settore angolare; il visualizzatore riassume i blocchi di celle native per maggioranza semplice, fino a un massimo di 500 celle sull'asse più lungo. È una stima che dipende dalla risoluzione e dal campionamento, non una linea di vista esatta tra punti. Non corregge la curvatura terrestre.

### Curve di livello

Scegliere l'equidistanza verticale in metri e generare le curve. Nel visualizzatore è possibile scegliere lo stile topografico o colorare le curve in base alla quota, cambiare il colore dello stile topografico ed evidenziare una curva maestra a intervalli regolari. Le etichette di quota vengono collocate sui tratti visibili delle linee; è possibile mostrare o nascondere le etichette delle cime rilevate nel modello. Un'equidistanza minore genera più linee, ma non migliora la precisione dei dati di origine.

### Visualizzatore 3D e modalità di volo

La modalità di volo consente di muoversi nella scena con la tastiera: W/S per avanzare o indietreggiare, A/D per spostarsi lateralmente, le frecce per virare e cambiare il beccheggio, T/G per salire e scendere. Regolare la velocità, attivare la velocità di crociera oppure scegliere una posizione nella vista isometrica; l'indicatore mostra l'altezza sopra il terreno. La modalità di volo modifica la telecamera, non il modello né i risultati dell'analisi.
