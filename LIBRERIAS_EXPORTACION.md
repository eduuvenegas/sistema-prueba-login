# 📦 Librerías de Exportación de Datos

Este documento explica las herramientas que utilizamos en el Frontend para generar reportes descargables. Estas librerías se ejecutan 100% en el navegador del usuario (del lado del cliente), lo que significa que **no sobrecargan el servidor backend**.

## 📄 Exportación a PDF

Para generar documentos PDF utilizamos un dúo de librerías muy poderoso:

### 1. `jspdf`
Es la librería principal. Permite crear un documento PDF en blanco e inyectarle texto, formas e imágenes basándose en coordenadas `(X, Y)`. 
*   **Ventaja:** Es el estándar de la industria para JavaScript.
*   **Uso común:** `const doc = new jsPDF(); doc.text("Hola Mundo", 10, 10); doc.save("archivo.pdf");`

### 2. `jspdf-autotable`
Es un *plugin* (complemento) para `jspdf`. Dibujar tablas manualmente en PDF calculando el ancho y alto de cada celda es una pesadilla. `jspdf-autotable` hace todo el trabajo pesado.
*   **Ventaja:** Permite inyectar arrays de datos y él automáticamente calcula los saltos de página, márgenes, colores de cabecera y bordes.
*   **Uso común:** `doc.autoTable({ head: [['Nombre', 'Edad']], body: [['Juan', '25']] })`

---

## 📊 Exportación a Excel (.xlsx)

Para generar verdaderos archivos de Excel con estilos y formato premium utilizamos la librería **`exceljs`**.

### `exceljs`
A diferencia de exportar un simple archivo `.csv` que no respeta caracteres ni permite guardar formatos, `exceljs` construye el binario real subyacente de un archivo `.xlsx`. Además, fue elegida por encima de otras opciones gratuitas por sus potentes capacidades de estilización.

**Ventajas Principales:**
1. **Formato de Celdas:** Permite decirle a Excel "este dato es un número, formatea su celda como Moneda de Soles", habilitando la sumatoria nativa.
2. **Paneles Congelados:** Permite inmovilizar filas (ej. `ySplit: 5`) para que al hacer *scroll* el usuario nunca pierda de vista la cabecera.
3. **Estilos Completos:** Soporta inyección de colores hexadecimales de fondo (`fgColor`), bordes y control tipográfico total (negritas, tamaños).
4. **Inserción de Imágenes:** Capacidad de inyectar *ArrayBuffers* o *Base64* para adjuntar el logo oficial dentro del mismo libro de trabajo.

**Flujo de trabajo con exceljs:**
1. Creas un libro vacío (`new ExcelJS.Workbook()`).
2. Añades y manipulas las celdas directamente (`ws.getCell('A1').value = ...`).
3. Construyes un *Blob* desde su buffer asíncrono y fuerzas la descarga en el navegador con la API estándar `URL.createObjectURL()`.

---

### 💡 Buenas Prácticas Implementadas
*   **Nombres Descriptivos:** Todos los archivos generados tienen el nombre del reporte y el trimestre en el título (ej. `Ingresos_1er_Trimestre.pdf`).
*   **Cálculos Seguros:** En la exportación, no delegamos la suma al PDF o Excel, mandamos los cálculos procesados directamente desde React para garantizar que el archivo muestre la misma información que la pantalla.