# A-TENCION Sensory Platform

## 1. Contexto General del Sistema
**A-TENCION** es una plataforma web integral diseñada para la gestión de material educativo y experiencias sensoriales. El sistema actúa como un puente entre la plataforma y sus clientes principales (padres y terapeutas), permitiendo una administración eficiente de servicios de apoyo cognitivo y sensorial a través de un entorno digital intuitivo y seguro.

---

## 2. Entregables de Definición

### A. Requerimientos Funcionales (FRs)
Definen las funciones que el sistema debe ejecutar:
* **FR01 - Registro y Autenticación:** El sistema permitirá a padres y terapeutas crear una cuenta y acceder mediante login seguro.
* **FR02 - Visualización de Catálogo:** El sistema mostrará el material educativo y las experiencias disponibles.
* **FR03 - Gestión de Reservas:** El usuario podrá seleccionar una experiencia y asignarle una fecha específica según disponibilidad.
* **FR04 - Procesamiento de Pagos:** El sistema permitirá realizar el pago de la reserva de forma integrada.
* **FR05 - Gestión de Cancelaciones:** El usuario podrá cancelar una reserva previamente agendada desde su perfil.

### B. Requerimientos No Funcionales (NFRs)
Definen los atributos de calidad del sistema:
* **NFR01 - Seguridad de Datos:** Las transacciones financieras y datos personales deben estar protegidos bajo protocolos de cifrado (SSL/HTTPS).
* **NFR02 - Responsividad:** La interfaz debe ser totalmente funcional en dispositivos móviles y de escritorio.
* **NFR03 - Rendimiento:** El proceso de confirmación de reserva y pago no debe exceder los 5 segundos de espera.
* **NFR04 - Disponibilidad:** La plataforma de reserva debe estar operativa el 99.9% del tiempo.

### C. Reglas de Negocio (BRs)
Políticas y restricciones operativas:
* **BR01 - Confirmación de Cita:** Una experiencia solo se considera agendada tras la validación exitosa del pago.
* **BR02 - Restricción de Usuario:** Solo usuarios con cuenta activa y sesión iniciada pueden realizar reservaciones.
* **BR03 - Tiempo de Cancelación:** Las cancelaciones deben realizarse con un mínimo de 24 horas de antelación para ser elegibles para procesos administrativos de reembolso.

### D. Historias de Usuario (UHs)
* **UH01:** Como padre/terapeuta, quiero crear una cuenta para gestionar mis experiencias de forma personalizada.
* **UH02:** Como cliente, quiero ver un calendario de disponibilidad para elegir la fecha que mejor me convenga.
* **UH03:** Como usuario, quiero pagar en línea para asegurar mi lugar de forma inmediata y sencilla.
* **UH04:** Como cliente, quiero cancelar mi cita desde el portal en caso de un imprevisto.

### E. Requerimientos de Usuario (URs)
* **UR01:** El usuario necesita un sistema de navegación simple que no requiera conocimientos técnicos avanzados.
* **UR02:** El usuario requiere confirmaciones automáticas (vía sistema o correo) de sus transacciones y citas.
* **UR03:** El usuario necesita visibilidad clara de los costos y horarios antes de confirmar cualquier servicio.

---

## 3. Estructura de Carpetas (GitHub)
Siguiendo los criterios de evaluación, la documentación se organiza de la siguiente manera:
* ` /readme.md` (Este archivo con el contexto general).
* ` /docs/contexto/` (Carpeta que contiene los documentos detallados de FRs, NFRs, BRs, UHs y URs).
