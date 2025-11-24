// @ts-nocheck - Supresión de errores de tipado para archivo de generación de PDF
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { data, template } = await request.json()

    const htmlContent = generatePdfHtml(data, template)

    // Retornar como HTML para que se pueda visualizar correctamente
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": 'inline; filename="cotizacion.html"',
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Error generating PDF" }, { status: 500 })
  }
}

function generatePdfHtml(data: any, template: any): string {
  const formatCurrency = (amount: number, currency = "USD", isZero = false) => {
    if (isZero) return `${currency} 0`;
    const formattedNumber = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
    return `${currency} ${formattedNumber}`
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString("es-ES")
    } catch {
      return dateStr
    }
  }

  const getMonthName = (monthNumber: string) => {
    const months: Record<string, string> = {
      "01": "Enero",
      "02": "Febrero",
      "03": "Marzo",
      "04": "Abril",
      "05": "Mayo",
      "06": "Junio",
      "07": "Julio",
      "08": "Agosto",
      "09": "Septiembre",
      "10": "Octubre",
      "11": "Noviembre",
      "12": "Diciembre",
    }
    return months[monthNumber] || ""
  }

  const getMonthsDisplay = (meses: string[]) => {
    if (!meses || meses.length === 0) return ""

    const monthsData: Record<string, string> = {
      "01": "Enero",
      "02": "Febrero",
      "03": "Marzo",
      "04": "Abril",
      "05": "Mayo",
      "06": "Junio",
      "07": "Julio",
      "08": "Agosto",
      "09": "Septiembre",
      "10": "Octubre",
      "11": "Noviembre",
      "12": "Diciembre",
    }

    if (meses.length === 1) {
      return monthsData[meses[0]] || ""
    }

    // Ordenar meses
    const sortedMonths = [...meses].sort()
    const firstMonth = monthsData[sortedMonths[0]]
    const lastMonth = monthsData[sortedMonths[sortedMonths.length - 1]]

    // Verificar si son consecutivos
    const firstIndex = Object.keys(monthsData).indexOf(sortedMonths[0])
    const lastIndex = Object.keys(monthsData).indexOf(sortedMonths[sortedMonths.length - 1])
    const expectedLength = lastIndex - firstIndex + 1

    if (sortedMonths.length === expectedLength) {
      return `${firstMonth} - ${lastMonth}`
    } else {
      return sortedMonths.map((m) => monthsData[m]).join(", ")
    }
  }

  const renderImageGallery = (images: string[], altText: string) => {
    if (!images || images.length === 0) return ""

    // Siempre limitar a un máximo de 6 imágenes
    const limitedImages = images.slice(0, 6)
    const isFlight = altText.startsWith("Vuelo")

    // Para vuelos mantenemos el layout vertical actual (una debajo de la otra)
    if (isFlight) {
      return `
      <div class="image-gallery-vertical">
        ${limitedImages
          .map(
            (image, index) => `
          <img src="${image}" alt="${altText} ${index + 1}" class="gallery-image-vertical">
        `,
          )
          .join("")}
      </div>
    `
    }

    // Para el resto de las secciones usamos una grilla con máximo 3 columnas y 2 filas
    const count = limitedImages.length
    const layoutClass = `image-gallery image-gallery--${count}`

    return `
      <div class="${layoutClass}">
        ${limitedImages
          .map(
            (image, index) => `
          <img src="${image}" alt="${altText} ${index + 1}" class="gallery-image">
        `,
          )
          .join("")}
      </div>
    `
  }

  const getTipoTarifaLabel = (tipoTarifa: string) => {
    const tipos: Record<string, string> = {
      economy: "Economy",
      premium_economy: "Premium Economy",
      business: "Business",
      primera_clase: "Primera Clase",
    }
    return tipos[tipoTarifa] || ""
  }

  const getRegimenLabel = (regimen: string) => {
    const regimenes: Record<string, string> = {
      sin_desayuno: "Sin desayuno",
      desayuno: "Desayuno",
      media_pension: "Media pensión",
      pension_completa: "Pensión completa",
      all_inclusive: "All inclusive",
    }
    return regimenes[regimen] || regimen
  }

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: ${template.fontFamily}, Arial, sans-serif;
  line-height: 1.4;
  color: #333;
  background: white;
  padding: 15px;
  max-width: 800px;
  margin: 0 auto;
  font-size: 14px;
}

.print-button {
  position: fixed;
  top: 20px;
  right: 20px;
  background: ${template.primaryColor};
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  z-index: 1000;
}

.print-button:hover {
  opacity: 0.8;
}

@media print {
  .print-button {
    display: none;
  }
  body {
    padding: 0;
  }
}

.header {
  border-top: 3px solid ${template.primaryColor};
  padding: 3px 0;
  margin-bottom: 8px;
  text-align: center;
}

.logo {
  max-height: 60px;
  max-width: 200px;
  margin: 0 auto;
  object-fit: contain;
  display: block;
}

.divider {
  height: 1px;
  background: ${template.primaryColor};
  opacity: 0.3;
  margin: 5px 0;
}

.section {
  margin-bottom: 12px;
}

.section-title {
  color: ${template.primaryColor};
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 2px solid ${template.primaryColor};
}

.client-info {
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-size: 13px;
}

.client-info div {
  margin-bottom: 4px;
}

.client-info strong {
  color: ${template.primaryColor};
  display: inline-block;
  width: 150px;
}

.item-card {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  background: white;
  page-break-inside: auto;
}

.item-card h3 {
  font-size: 16px;
  margin-bottom: 8px;
}

.item-image-single {
  max-width: 100%;
  height: auto;
  max-height: 200px;
  border-radius: 4px;
  margin-bottom: 10px;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.image-gallery {
  display: grid;
  gap: 8px;
  margin-bottom: 10px;
}

.image-gallery--1 {
  grid-template-columns: 1fr;
}

.image-gallery--2 {
  grid-template-columns: repeat(2, 1fr);
}

.image-gallery--3 {
  grid-template-columns: repeat(3, 1fr);
}

.image-gallery--4 {
  grid-template-columns: repeat(2, 1fr);
}

.image-gallery--5,
.image-gallery--6 {
  grid-template-columns: repeat(3, 1fr);
}

.gallery-image {
  max-width: 100%;
  height: auto;
  max-height: 180px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  display: block;
  margin: 0 auto;
}

.image-gallery-vertical {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}

.gallery-image-vertical {
  max-width: 100%;
  height: auto;
  max-height: 200px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  display: block;
  margin: 0 auto;
}

.item-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 14px;
}

.item-details div {
  padding: 4px 0;
}

.item-details strong {
  color: ${template.primaryColor};
}

.price {
  text-align: right;
  font-weight: bold;
  color: ${template.primaryColor};
  font-size: 18px;
}

.totals {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  margin-top: 15px;
  border: 2px solid ${template.primaryColor};
}

.totals-table {
  width: 100%;
  border-collapse: collapse;
}

.totals-table td {
  padding: 6px 0;
  border-bottom: 1px solid #ddd;
}

.totals-table .total-row {
  font-weight: bold;
  font-size: 16px;
  border-top: 2px solid ${template.primaryColor};
  color: ${template.primaryColor};
}

.observations {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  padding: 15px;
  border-radius: 5px;
  margin-top: 15px;
  font-size: 14px;
}

.observations h3 {
  color: #856404;
  margin-bottom: 8px;
  font-size: 16px;
}

.footer {
  margin-top: 30px;
  text-align: center;
  color: ${template.secondaryColor};
  font-size: 12px;
  border-top: 1px solid #eee;
  padding-top: 15px;
  padding-bottom: 25px; /* Espacio extra para que no se corte el texto al final de la página */
}

.footer-item {
  margin-bottom: 6px;
}

.footer-label {
  color: ${template.primaryColor};
  font-weight: bold;
  margin-right: 6px;
}

.validity-box {
  border: 2px solid #000;
  padding: 15px;
  border-radius: 6px;
  margin: 15px 0;
  text-align: center;
  background: white;
}

.validity-text {
  color: #ff0000;
  font-size: 16px;
  font-weight: bold;
  margin: 0;
}

.requirements-section {
  background: white;
  border: 1px solid #666;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 14px;
}

.requirements-section h3 {
  color: #333;
  margin-bottom: 8px;
  font-size: 16px;
}

.requirements-list {
  list-style: disc;
  margin-left: 15px;
  margin-bottom: 0;
}

.requirements-list li {
  margin-bottom: 4px;
  color: #333;
  font-size: 14px;
}

.flight-options {
  margin-bottom: 10px;
}

.flight-option {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}

.flight-option:last-child {
  border-bottom: none;
}

.info-section {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.info-section h4 {
  color: ${template.primaryColor};
  margin-bottom: 6px;
  font-size: 14px;
}

.text-libre {
  background: #fff;
  border-left: 3px solid ${template.primaryColor};
  padding: 10px;
  margin-top: 10px;
  font-style: italic;
  font-size: 14px;
}

.room-details {
  background: #f8f9fa;
  border: 1px solid #e2e8f0;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.room-details h5 {
  color: ${template.primaryColor};
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: bold;
}

.room-info {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  font-size: 13px;
}

.room-info div {
  display: flex;
  flex-direction: column;
}

.room-info strong {
  color: ${template.primaryColor};
  font-size: 12px;
  margin-bottom: 2px;
}

.accommodation-city {
  color: ${template.secondaryColor};
  font-size: 14px;
  font-style: italic;
  margin-bottom: 10px;
}

.destination-box {
  text-align: center;
  margin: 0 auto 10px auto;
  padding: 6px 12px;
  background: linear-gradient(135deg, ${template.primaryColor}15, ${template.primaryColor}05);
  border-radius: 5px;
  border: 2px solid ${template.primaryColor};
}

.destination-title {
  color: ${template.primaryColor};
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 2px;
}

.important-info {
  background: white;
  border: 1px solid #666;
  padding: 8px;
  border-radius: 5px;
  margin-bottom: 10px;
}

.important-info h3 {
  color: ${template.primaryColor};
  margin-bottom: 6px;
  font-size: 14px;
}

.info-list {
  list-style: disc;
  margin-left: 15px;
  margin-bottom: 0;
}

.info-list li {
  margin-bottom: 4px;
  color: #333;
  font-size: 14px;
}

.flight-info {
  margin-bottom: 10px;
  font-size: 14px;
}

.flight-info strong {
  color: ${template.primaryColor};
  margin-right: 8px;
}

.flight-info-item {
  margin-bottom: 4px;
}

.passenger-group {
  margin-bottom: 15px;
}

.passenger-group:last-child {
  margin-bottom: 0;
}

.passenger-group h5 {
  color: ${template.primaryColor};
  font-size: 14px;
  font-weight: bold;
  margin: 10px 0 8px 0;
  border-bottom: 1px solid ${template.primaryColor};
  padding-bottom: 2px;
  display: block;
}

.total-section {
  page-break-inside: avoid !important;
  break-inside: avoid !important;
  min-height: 150px;
  orphans: 3;
  widows: 3;
}

.content-section {
  page-break-inside: auto;
}

.footer-section {
  page-break-inside: avoid !important;
  page-break-before: auto;
}
      </style>
    </head>
    <body>
      <button class="print-button" onclick="window.print()">Imprimir PDF</button>
      
      <div class="header">
        ${template.logo ? `<img src="${template.logo}" alt="Logo" class="logo">` : ""}
      </div>
      
      <div class="divider"></div>
      
      ${
        data.destino && (data.destino.pais || data.destino.ciudad || data.destino.año)
          ? `
<div class="section content-section">
  <div class="destination-box">
    <h2 class="destination-title">
      ${data.destino.pais}${data.destino.ciudad ? `, ${data.destino.ciudad}` : ""}
    </h2>
    ${data.destino.meses && data.destino.meses.length > 0 && data.destino.año ? `<p class="destination-dates">${getMonthsDisplay(data.destino.meses)} ${data.destino.año}</p>` : data.destino.año ? `<p class="destination-dates">${data.destino.año}</p>` : ""}
  </div>
</div>
`
          : ""
      }

      ${
        data.requisitosMigratorios && data.requisitosMigratorios.length > 0
          ? `
      <div class="important-info">
        <h3>REQUISITOS MIGRATORIOS IMPORTANTES</h3>
        <ul class="info-list">
          ${data.requisitosMigratorios.map((req: string) => `<li>${req}</li>`).join("")}
        </ul>
      </div>
      `
          : ""
      }
      
      ${
        Object.keys(data.cliente || {}).length > 0 && data.mostrarCantidadPasajeros
          ? `
      <div class="section content-section">
        <h2 class="section-title">DATOS DEL CLIENTE</h2>
        <div class="client-info">
          ${data.cliente.cantidad_pasajeros > 0 ? `<div><strong>TOTAL PASAJEROS:</strong> ${data.cliente.cantidad_pasajeros}</div>` : ""}
          ${data.cliente.cantidad_adultos > 0 ? `<div><strong>ADULTOS:</strong> ${data.cliente.cantidad_adultos}</div>` : ""}
          ${data.cliente.cantidad_menores > 0 ? `<div><strong>MENORES:</strong> ${data.cliente.cantidad_menores}</div>` : ""}
          ${data.cliente.cantidad_infantes > 0 ? `<div><strong>INFANTES:</strong> ${data.cliente.cantidad_infantes}</div>` : ""}
        </div>
      </div>
      `
          : ""
      }
      
      ${
        data.vuelos && data.vuelos.length > 0
          ? `
<div class="section content-section">
  <h2 class="section-title">VUELOS</h2>
  ${data.vuelos
    .map(
      (vuelo: any, index: number) => `
    <div class="item-card">
      <h3 style="color: ${template.primaryColor}; margin-bottom: 15px;">${vuelo.nombre || `Compañía Aérea ${index + 1}`}</h3>
      
      ${
        vuelo.fechaSalida || vuelo.fechaRetorno
          ? `
        <div class="flight-info">
          ${vuelo.fechaSalida ? `<div class="flight-info-item"><strong>Fecha de Salida:</strong> ${formatDate(vuelo.fechaSalida)}</div>` : ""}
          ${vuelo.fechaRetorno ? `<div class="flight-info-item"><strong>Fecha de Retorno:</strong> ${formatDate(vuelo.fechaRetorno)}</div>` : ""}
        </div>
      `
          : ""
      }

      ${
        vuelo.tipoTarifa
          ? `
        <div class="flight-info">
          <div class="flight-info-item"><strong>Tipo de tarifa:</strong> ${getTipoTarifaLabel(vuelo.tipoTarifa)}</div>
        </div>
      `
          : ""
      }
      
      ${renderImageGallery(vuelo.imagenes, `Vuelo ${index + 1}`)}
      
      ${
        vuelo.opciones && vuelo.opciones.length > 0
          ? `
    <div class="flight-options">
      <h4 style="color: ${template.primaryColor}; margin-bottom: 10px; font-size: 16px;">Opciones de equipaje:</h4>
      
      ${(() => {
        // Agrupar opciones por tipo de pasajero
        const opcionesPorPasajero = vuelo.opciones.reduce((acc: any, opcion: any) => {
          if (!acc[opcion.pasajero]) {
            acc[opcion.pasajero] = []
          }
          acc[opcion.pasajero].push(opcion)
          return acc
        }, {})

        let html = ""

        // Renderizar opciones para adultos
        if (opcionesPorPasajero.adulto && opcionesPorPasajero.adulto.length > 0) {
          html += `
            <div class="passenger-group">
              <h5 style="color: ${template.primaryColor}; font-size: 14px; font-weight: bold; margin: 10px 0 8px 0; border-bottom: 1px solid ${template.primaryColor}; padding-bottom: 2px;">ADULTOS</h5>
              ${opcionesPorPasajero.adulto
                .map(
                  (opcion: any) => `
                <div class="flight-option">
                  <span>${opcion.tipo === "mochila" ? "Solo mochila" : opcion.tipo === "mochilaCarryOn" ? "Mochila y equipaje de mano" : opcion.tipo === "mochilaCarryOnValija" ? "Mochila, equipaje de mano y maleta de 23kg" : "Tarifa única"}</span>
                  <strong style="color: ${template.primaryColor};">${formatCurrency(opcion.precio, vuelo.useCustomCurrency && vuelo.currency ? vuelo.currency : data.totales?.currency || "USD")}</strong>
                </div>
              `,
                )
                .join("")}
            </div>
          `
        }

        // Renderizar opciones para menores
        if (opcionesPorPasajero.menor && opcionesPorPasajero.menor.length > 0) {
          html += `
            <div class="passenger-group">
              <h5 style="color: ${template.primaryColor}; font-size: 14px; font-weight: bold; margin: 10px 0 8px 0; border-bottom: 1px solid ${template.primaryColor}; padding-bottom: 2px;">MENORES</h5>
              ${opcionesPorPasajero.menor
                .map(
                  (opcion: any) => `
                <div class="flight-option">
                  <span>${opcion.tipo === "mochila" ? "Solo mochila" : opcion.tipo === "mochilaCarryOn" ? "Mochila y equipaje de mano" : opcion.tipo === "mochilaCarryOnValija" ? "Mochila, equipaje de mano y maleta de 23kg" : "Tarifa única"}</span>
                  <strong style="color: ${template.primaryColor};">${formatCurrency(opcion.precio, vuelo.useCustomCurrency && vuelo.currency ? vuelo.currency : data.totales?.currency || "USD")}</strong>
                </div>
              `,
                )
                .join("")}
            </div>
          `
        }

        // Renderizar opciones para infantes
        if (opcionesPorPasajero.infante && opcionesPorPasajero.infante.length > 0) {
          html += `
            <div class="passenger-group">
              <h5 style="color: ${template.primaryColor}; font-size: 14px; font-weight: bold; margin: 10px 0 8px 0; border-bottom: 1px solid ${template.primaryColor}; padding-bottom: 2px;">INFANTES</h5>
              ${opcionesPorPasajero.infante
                .map(
                  (opcion: any) => `
                <div class="flight-option">
                  <span>Tarifa única</span>
                  <strong style="color: ${template.primaryColor};">${formatCurrency(opcion.precio, vuelo.useCustomCurrency && vuelo.currency ? vuelo.currency : data.totales?.currency || "USD")}</strong>
                </div>
              `,
                )
                .join("")}
            </div>
          `
        }

        return html
      })()}
    </div>
  `
          : ""
      }
      

      ${
        vuelo.condicionesTarifa && vuelo.condicionesTarifa.length > 0
          ? `
        <div class="info-section">
          <h4>Condiciones de tarifa:</h4>
          <ul style="margin-left: 15px;">
            ${vuelo.condicionesTarifa.map((condicion) => `<li>${condicion}</li>`).join("")}
          </ul>
        </div>
      `
          : ""
      }

      ${
        vuelo.textoLibre
          ? `
        <div class="text-libre">
          <p>${vuelo.textoLibre.replace(/\n/g, "<br>")}</p>
        </div>
      `
          : ""
      }
      ${index === data.vuelos.length - 1 && data.totales?.mostrar_nota_tarifas ? `
      <div style="background: #e0e7ff; border: 1px solid #2563eb; border-radius: 6px; padding: 10px 16px; margin: 10px auto 0 auto; max-width: 400px; text-align: center;">
        <div style="color: #1e40af; font-size: 14px;">
          <strong>Nota:</strong> Las tarifas de los vuelos son por persona.
        </div>
      </div>
      ` : ""}
    </div>
  `,
    )
    .join("")}
</div>
`
          : ""
      }
      
      ${
        data.hoteles && data.hoteles.length > 0
          ? `
      <div class="section content-section">
        <h2 class="section-title">ALOJAMIENTO</h2>
        ${data.hoteles
          .map(
            (hotel, index) => `
          <div class="item-card">
            <h3 style="color: ${template.primaryColor}; margin-bottom: 8px;">${hotel.nombre || `Alojamiento ${index + 1}`}</h3>
            ${hotel.imagenes && hotel.imagenes.length === 1
  ? `
  <div style="display: flex; gap: 24px; align-items: stretch; margin-bottom: 16px;">
    <div style="flex: 1; max-width: 50%; display: flex; align-items: center; justify-content: center;">
      <img src="${hotel.imagenes[0]}" alt="Hotel" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8f9fa;" />
    </div>
    <div style="flex: 1; max-width: 50%; display: flex; flex-direction: column; justify-content: space-between; height: 180px; gap: 0;">
      ${hotel.ciudad ? `<div class="accommodation-city" style="color: #222; font-size: 14px; margin-bottom: 0;"><strong style="color: ${template.primaryColor};">Ciudad:</strong> ${hotel.ciudad}</div>` : ""}
      <div><strong style="color: ${template.primaryColor};">Check-in:</strong> ${formatDate(hotel.checkin)}</div>
      <div><strong style="color: ${template.primaryColor};">Check-out:</strong> ${formatDate(hotel.checkout)}</div>
      ${hotel.cantidadHabitaciones ? `<div><strong style="color: ${template.primaryColor};">Habitaciones:</strong> ${hotel.cantidadHabitaciones}</div>` : ""}
    </div>
  </div>
` : `
  ${hotel.imagenes && hotel.imagenes.length > 1 ? renderImageGallery(hotel.imagenes, `Hotel`) : ""}
  ${hotel.ciudad ? `<div class="accommodation-city" style="color: #222; font-size: 14px; font-style: italic; margin-bottom: 0;"><strong style="color: ${template.primaryColor};">Ciudad:</strong> ${hotel.ciudad}</div>` : ""}
  <div class="item-details">
    <div><strong style="color: ${template.primaryColor};">Check-in:</strong> ${formatDate(hotel.checkin)}</div>
    <div><strong style="color: ${template.primaryColor};">Check-out:</strong> ${formatDate(hotel.checkout)}</div>
    ${hotel.cantidadHabitaciones ? `<div><strong style="color: ${template.primaryColor};">Habitaciones:</strong> ${hotel.cantidadHabitaciones}</div>` : ""}
  </div>
`}
            
            ${
              hotel.habitaciones && hotel.habitaciones.length > 0
                ? `
              <div style="margin: 20px 0;">
                <h4 style="color: ${template.primaryColor}; margin-bottom: 15px; font-size: 16px;">Detalle de habitaciones:</h4>
                ${hotel.habitaciones
                  .map(
                    (habitacion, roomIndex) => `
                  <div class="room-details">
                    <h5>Habitación ${roomIndex + 1}</h5>
                    <div class="room-info">
                      <div>
                        <strong>Tipo de habitación:</strong>
                        <span>${habitacion.tipoHabitacion || "No especificado"}</span>
                      </div>
                      <div>
                        <strong>Régimen de comidas:</strong>
                        <span>${getRegimenLabel(habitacion.regimen)}</span>
                      </div>
                      ${(habitacion.mostrarPrecio ?? true) ? `<div>
                        <strong>Precio total:</strong>
                        <span style="color: ${template.primaryColor}; font-weight: bold;">${formatCurrency(Number.parseFloat(habitacion.precio) || 0, hotel.useCustomCurrency && hotel.currency ? hotel.currency : data.totales?.currency || "USD")}</span>
                      </div>` : ""}
                    </div>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            `
                : ""
            }
            
            ${hotel.mostrarPrecio && hotel.precioTotal !== undefined ? `<div class="price">Precio total de ${hotel.cantidadHabitaciones} habitaci${hotel.cantidadHabitaciones > 1 ? "ones" : "ón"} por ${hotel.cantidadNoches} noche${hotel.cantidadNoches > 1 ? "s" : ""}: ${formatCurrency(Number(hotel.precioTotal) === 0 ? 0 : hotel.precioTotal, hotel.useCustomCurrency && hotel.currency ? hotel.currency : data.totales?.currency || "USD", Number(hotel.precioTotal) === 0)}</div>` : ""}
            ${
              hotel.textoLibre
                ? `
            <div class="text-libre">
              <p>${hotel.textoLibre.replace(/\n/g, "<br>")}</p>
            </div>
          `
                : ""
            }
          </div>
        `,
          )
          .join("")}
      </div>
      `
          : ""
      }
      
      ${
        data.traslados && data.traslados.length > 0
          ? `
  <div class="section content-section">
    <h2 class="section-title">TRASLADOS</h2>
    ${data.traslados
      .map(
        (traslado, index) => `
    <div class="item-card">
      <h3 style="color: ${template.primaryColor}; margin-bottom: 15px;">${traslado.nombre || `Empresa de Traslado ${index + 1}`}</h3>
      ${renderImageGallery(traslado.imagenes, `Traslado ${index + 1}`)}
      <div class="item-details">
        ${traslado.origen ? `<div><strong>Origen:</strong> ${traslado.origen}</div>` : ""}
        ${traslado.destino ? `<div><strong>Destino:</strong> ${traslado.destino}</div>` : ""}
        ${traslado.tipoTraslado ? `<div><strong>Tipo:</strong> ${traslado.tipoTraslado === "privado" ? "Privado" : "Regular"}</div>` : ""}
        <div><strong>Fecha:</strong> ${formatDate(traslado.fecha)}</div>
        ${traslado.hora ? `<div><strong>Hora:</strong> ${traslado.hora}</div>` : ""}
      </div>
      ${traslado.mostrarPrecio && traslado.precio ? `<div class="price">Precio: ${formatCurrency(traslado.precio, traslado.useCustomCurrency && traslado.currency ? traslado.currency : data.totales?.currency || "USD")}</div>` : ""}
      ${
        traslado.textoLibre
          ? `
      <div class="text-libre">
        <p>${traslado.textoLibre.replace(/\n/g, "<br>")}</p>
      </div>
    `
          : ""
      }
    </div>
  `,
      )
      .join("")}
</div>
`
          : ""
      }
      
      ${
        data.actividades && data.actividades.length > 0
          ? `
      <div class="section content-section">
        <h2 class="section-title">SERVICIOS ADICIONALES</h2>
        ${data.actividades
          .map(
            (servicio) => `
          <div class="item-card">
            <h3 style="color: ${template.primaryColor}; margin-bottom: 15px;">${servicio.nombre}</h3>
            ${renderImageGallery(servicio.imagenes, servicio.nombre)}
            <p style="margin-bottom: 15px; font-size: 16px;">${servicio.descripcion}</p>
            <div class="item-details">
              <div><strong>Fecha:</strong> ${formatDate(servicio.fecha)}</div>
              <div><strong>Duración:</strong> ${servicio.duracion}</div>
            </div>
            ${servicio.mostrarPrecio ? `<div class="price">Precio: ${formatCurrency(servicio.precio, servicio.useCustomCurrency && servicio.currency ? servicio.currency : data.totales?.currency || "USD")}</div>` : ""}
          </div>
        `,
          )
          .join("")}
      </div>
      `
          : ""
      }
      
      ${
        data.cruceros && data.cruceros.length > 0
          ? `
      <div class="section content-section">
        <h2 class="section-title">CRUCEROS</h2>
        ${data.cruceros
          .map(
            (crucero) => `
          <div class="item-card">
            <h3 style="color: ${template.primaryColor}; margin-bottom: 15px;">${crucero.empresa} - ${crucero.nombreBarco}</h3>
            ${renderImageGallery(crucero.imagenes, `${crucero.empresa} ${crucero.nombreBarco}`)}
            <div class="item-details">
              <div><strong>Destino:</strong> ${crucero.destino}</div>
              <div><strong>Fecha de partida:</strong> ${formatDate(crucero.fechaPartida)}</div>
              <div><strong>Fecha de regreso:</strong> ${formatDate(crucero.fechaRegreso)}</div>
              <div><strong>Tipo de cabina:</strong> ${crucero.tipoCabina}</div>
              ${crucero.cantidadDias ? `<div><strong>Duración:</strong> ${crucero.cantidadDias} días</div>` : ""}
            </div>
            ${crucero.mostrarPrecio ? `<div class="price">Precio: ${formatCurrency(crucero.precio, crucero.useCustomCurrency && crucero.currency ? crucero.currency : data.totales?.currency || "USD")}</div>` : ""}
            ${
              crucero.textoLibre
                ? `
            <div class="text-libre">
              <p>${crucero.textoLibre.replace(/\n/g, "<br>")}</p>
            </div>
          `
                : ""
            }
          </div>
        `,
          )
          .join("")}
      </div>
      `
          : ""
      }
      
      ${
        data.totales?.mostrar_total && data.totalesPorMoneda && Object.keys(data.totalesPorMoneda).filter(mon => data.totalesPorMoneda[mon] > 0).length > 1
          ? `
    <div class="totals total-section">
      <h2 class="section-title">TOTAL DE LA COTIZACIÓN</h2>
      <div style="text-align: center; padding: 15px;">
        ${Object.entries(data.totalesPorMoneda)
          .filter(([moneda, total]) => moneda && Number(total) > 0)
          .map(
            ([moneda, total]) =>
              `<div style="font-size: 24px; font-weight: bold; color: ${template.primaryColor}; margin-bottom: 6px;">${moneda} ${Number(total).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>`
          )
          .join("")}
      </div>
      ${data.totales?.mostrar_nota_precio_total ? `
      <div style="background: #e0e7ff; color: #1e40af; border-radius: 6px; padding: 10px 16px; margin: 10px auto 0 auto; max-width: 500px; font-size: 14px; border: 1px solid #2563eb; text-align: center;">
        <strong>Nota:</strong> El precio total no incluye los vuelos. Si la tarifa no está discriminada en la cotización, consúltela con su agente.
      ` : ""}
    </div>
    `
          : data.totales?.mostrar_total && data.totalesPorMoneda && Object.keys(data.totalesPorMoneda).filter(mon => data.totalesPorMoneda[mon] > 0).length === 1
            ? `
    <div class="totals total-section">
      <h2 class="section-title">TOTAL DE LA COTIZACIÓN</h2>
      <div style="text-align: center; padding: 15px;">
        <div style="font-size: 32px; font-weight: bold; color: ${template.primaryColor};">
          ${(() => {
            const override = data.totales && typeof data.totales.totalOverride === "number" && !isNaN(data.totales.totalOverride)
              ? data.totales.totalOverride
              : null;
            const [moneda, totalCalc] =
              Object.entries(data.totalesPorMoneda).find(([_, t]) => Number(t) > 0) ||
              [data.totales?.currency || "USD", data.totales?.total || 0];
            const totalToShow = override !== null ? override : Number(totalCalc);
            return `${moneda} ${Number(totalToShow).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          })()}
        </div>
      </div>
      ${data.totales?.mostrar_nota_precio_total ? `
      <div style="background: #e0e7ff; color: #1e40af; border-radius: 6px; padding: 10px 16px; margin: 10px auto 0 auto; max-width: 500px; font-size: 14px; border: 1px solid #2563eb; text-align: center;">
        <strong>Nota:</strong> El precio total no incluye los vuelos. Si la tarifa no está discriminada en la cotización, consúltela con su agente.
      </div>
      ` : ""}
    </div>
    `
            : ""
      }
      
      ${
        data.observaciones
          ? `
      <div class="observations">
        <h3>OBSERVACIONES</h3>
        <p>${data.observaciones.replace(/\n/g, "<br>")}</p>
      </div>
      `
          : ""
      }
      
      <div class="validity-box">
        <p class="validity-text">${template.validityText || "Esta cotización es válida por 15 días desde la fecha de emisión."}</p>
      </div>
      
      <div class="footer footer-section">
        <div style="margin-bottom: 15px;">
          ${template.agencyAddress ? `<div class="footer-item"><span class="footer-label">Dirección:</span>${template.agencyAddress}</div>` : ""}
          ${template.agencyPhone ? `<div class="footer-item"><span class="footer-label">Teléfono:</span>${template.agencyPhone}</div>` : ""}
          ${template.agencyEmail ? `<div class="footer-item"><span class="footer-label">Email:</span>${template.agencyEmail}</div>` : ""}
        </div>
        <p>Generado el ${new Date().toLocaleDateString("es-ES")}</p>
      </div>
      
      <script>
        // Función para imprimir automáticamente si se desea
        function autoPrint() {
          if (window.location.search.includes('print=true')) {
            window.print()
          }
        }

        // Ejecutar cuando la página esté completamente cargada
        window.addEventListener('load', autoPrint)
      </script>
    </body>
    </html>
  `
}