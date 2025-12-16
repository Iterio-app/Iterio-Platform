// @ts-nocheck - Supresión de errores de tipado para archivo de descarga de PDF
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { data, template } = await request.json()

    // Generar el HTML usando la misma función que generate-pdf
    const htmlContent = generatePdfHtml(data, template)

    // Retornar como HTML con headers para descarga
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": 'attachment; filename="cotizacion.html"',
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Error generating download:", error)
    return NextResponse.json({ error: "Error generating download" }, { status: 500 })
  }
}

// Usar la misma función de generación HTML que en generate-pdf
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

    const sortedMonths = [...meses].sort()
    const firstMonth = monthsData[sortedMonths[0]]
    const lastMonth = monthsData[sortedMonths[sortedMonths.length - 1]]

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
    return `
      <div class="image-gallery-vertical">
        ${images
          .map(
            (image, index) => `
          <img src="${image}" alt="${altText} ${index + 1}" class="gallery-image-vertical">
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

  // Generar URL de Google Fonts basada en la fuente del template
  const getFontUrl = (fontFamily: string) => {
    const fontMap: Record<string, string> = {
      'Playfair Display': 'Playfair+Display:wght@400;500;600;700',
      'Roboto': 'Roboto:wght@300;400;500;700',
      'Open Sans': 'Open+Sans:wght@300;400;500;600;700',
      'Lato': 'Lato:wght@300;400;700',
      'Montserrat': 'Montserrat:wght@300;400;500;600;700',
      'Poppins': 'Poppins:wght@300;400;500;600;700',
      'Raleway': 'Raleway:wght@300;400;500;600;700',
      'Oswald': 'Oswald:wght@300;400;500;600;700',
      'Merriweather': 'Merriweather:wght@300;400;700',
      'Source Sans Pro': 'Source+Sans+Pro:wght@300;400;600;700',
      'Nunito': 'Nunito:wght@300;400;600;700',
      'Ubuntu': 'Ubuntu:wght@300;400;500;700',
    }
    return fontMap[fontFamily] || 'Roboto:wght@300;400;500;700'
  }

  const fontUrl = getFontUrl(template.fontFamily)

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cotización de Viaje</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=${fontUrl}&display=block');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: '${template.fontFamily}', Arial, sans-serif;
          line-height: 1.4;
          color: #333;
          background: white;
          padding: 15px;
          max-width: 800px;
          margin: 0 auto;
          font-size: 14px;
        }

        .download-buttons {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          display: flex;
          gap: 10px;
        }

        .btn {
          background: ${template.primaryColor};
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          text-decoration: none;
          display: inline-block;
        }

        .btn:hover { opacity: 0.8; }

        @media print {
          .download-buttons { display: none; }
          body { padding: 0; }
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

        .section { margin-bottom: 12px; }

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

        .client-info div { margin-bottom: 4px; }
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
        }

        .item-card h3 { font-size: 16px; margin-bottom: 8px; }

        .image-gallery-vertical {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 10px;
        }

        .gallery-image-vertical {
          width: 100%;
          height: auto;
          max-height: 200px;
          object-fit: contain;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }

        .item-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .item-details div { padding: 4px 0; }
        .item-details strong { color: ${template.primaryColor}; }

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

        .footer {
          margin-top: 30px;
          text-align: center;
          color: ${template.secondaryColor};
          font-size: 12px;
          border-top: 1px solid #eee;
          padding-top: 15px;
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

        .flight-options { margin-bottom: 10px; }

        .flight-option {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #eee;
          font-size: 14px;
        }

        .passenger-group { margin-bottom: 15px; }

        .passenger-group h5 {
          color: ${template.primaryColor};
          font-size: 14px;
          font-weight: bold;
          margin: 10px 0 8px 0;
          border-bottom: 1px solid ${template.primaryColor};
          padding-bottom: 2px;
        }

        .important-info {
          background: white;
          border: 1px solid #666;
          padding: 8px;
          border-radius: 5px;
          margin-bottom: 10px;
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
      </style>
    </head>
    <body>
      <div class="download-buttons">
        <button class="btn" onclick="window.print()">Imprimir PDF</button>
        <button class="btn" onclick="downloadAsFile()">Descargar HTML</button>
      </div>
      
      <div class="header">
        ${template.logo ? `<img src="${template.logo}" alt="Logo" class="logo">` : ""}
      </div>
      
      <div class="divider"></div>
      
      ${
        data.destino && (data.destino.pais || data.destino.ciudad || data.destino.año)
          ? `
        <div class="section">
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
        Object.keys(data.cliente || {}).length > 0
          ? `
        <div class="section">
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
        <div class="section">
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
                  <div class="flight-info-item"><strong>Fechas del vuelo:</strong></div>
                  ${vuelo.fechaSalida ? `<div class="flight-info-item"><strong>Salida:</strong> ${formatDate(vuelo.fechaSalida)}</div>` : ""}
                  ${vuelo.fechaRetorno ? `<div class="flight-info-item"><strong>Retorno:</strong> ${formatDate(vuelo.fechaRetorno)}</div>` : ""}
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
                    const opcionesPorPasajero = vuelo.opciones.reduce((acc: any, opcion: any) => {
                      if (!acc[opcion.pasajero]) acc[opcion.pasajero] = []
                      acc[opcion.pasajero].push(opcion)
                      return acc
                    }, {})

                    let html = ""

                    if (opcionesPorPasajero.adulto && opcionesPorPasajero.adulto.length > 0) {
                      html += `
                        <div class="passenger-group">
                          <h5>ADULTOS</h5>
                          ${opcionesPorPasajero.adulto
                            .map(
                              (opcion) => `
                            <div class="flight-option">
                              <span>${opcion.tipo === "mochila" ? "Solo mochila" : opcion.tipo === "mochilaCarryOn" ? "Mochila + Carry On" : opcion.tipo === "mochilaBodega" ? "Mochila + Bodega" : opcion.tipo === "mochilaCarryOnBodega" || opcion.tipo === "mochilaCarryOnValija" ? "Mochila + Carry On + Bodega" : "Tarifa única"}</span>
                              <strong style="color: ${template.primaryColor};">${formatCurrency(opcion.precio, vuelo.useCustomCurrency && vuelo.currency ? vuelo.currency : data.totales?.currency || "USD")}</strong>
                            </div>
                          `,
                            )
                            .join("")}
                        </div>
                      `
                    }

                    if (opcionesPorPasajero.menor && opcionesPorPasajero.menor.length > 0) {
                      html += `
                        <div class="passenger-group">
                          <h5>MENORES</h5>
                          ${opcionesPorPasajero.menor
                            .map(
                              (opcion) => `
                            <div class="flight-option">
                              <span>${opcion.tipo === "mochila" ? "Solo mochila" : opcion.tipo === "mochilaCarryOn" ? "Mochila + Carry On" : opcion.tipo === "mochilaBodega" ? "Mochila + Bodega" : opcion.tipo === "mochilaCarryOnBodega" || opcion.tipo === "mochilaCarryOnValija" ? "Mochila + Carry On + Bodega" : "Tarifa única"}</span>
                              <strong style="color: ${template.primaryColor};">${formatCurrency(opcion.precio, vuelo.useCustomCurrency && vuelo.currency ? vuelo.currency : data.totales?.currency || "USD")}</strong>
                            </div>
                          `,
                            )
                            .join("")}
                        </div>
                      `
                    }

                    if (opcionesPorPasajero.infante && opcionesPorPasajero.infante.length > 0) {
                      html += `
                        <div class="passenger-group">
                          <h5>INFANTES</h5>
                          ${opcionesPorPasajero.infante
                            .map(
                              (opcion) => `
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
        <div class="section">
          <h2 class="section-title">ALOJAMIENTO</h2>
          ${data.hoteles
            .map(
              (hotel, index) => `
            <div class="item-card">
              <h3 style="color: ${template.primaryColor}; margin-bottom: 8px;">${hotel.nombre || `Alojamiento ${index + 1}`}</h3>
              ${hotel.ciudad ? `<div class="accommodation-city"><strong style="color: ${template.primaryColor};">Ciudad:</strong> ${hotel.ciudad}</div>` : ""}
              ${renderImageGallery(hotel.imagenes, `Hotel ${index + 1}`)}
              <div class="item-details">
                <div><strong>Check-in:</strong> ${formatDate(hotel.checkin)}</div>
                <div><strong>Check-out:</strong> ${formatDate(hotel.checkout)}</div>
                ${hotel.cantidadHabitaciones ? `<div><strong>Habitaciones:</strong> ${hotel.cantidadHabitaciones}</div>` : ""}
              </div>
              
              ${
                hotel.habitaciones && hotel.habitaciones.length > 0
                  ? `
                <div style="margin: 20px 0;">
                  <h4 style="color: ${template.primaryColor}; margin-bottom: 15px; font-size: 16px;">Detalles de habitaciones:</h4>
                  ${hotel.habitaciones
                    .map(
                      (habitacion, roomIndex) => `
                    <div class="room-details">
                      <h5>Habitación ${roomIndex + 1}</h5>
                      <div class="room-info">
                        <div>
                          <strong>Tipo:</strong>
                          <span>${habitacion.tipoHabitacion || "No especificado"}</span>
                        </div>
                        <div>
                          <strong>Régimen:</strong>
                          <span>${getRegimenLabel(habitacion.regimen)}</span>
                        </div>
                        <div>
                          <strong>Precio:</strong>
                          <span style="color: ${template.primaryColor}; font-weight: bold;">${formatCurrency(Number.parseFloat(habitacion.precio) || 0, hotel.useCustomCurrency && hotel.currency ? hotel.currency : data.totales?.currency || "USD")}</span>
                        </div>
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
        <div class="section">
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
        <div class="section">
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
        <div class="section">
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
      
      ${data.totales?.mostrar_total ? `
      <div class="totals">
        <h2 class="section-title">TOTAL DE LA COTIZACIÓN</h2>
        <div style="text-align: center; padding: 15px;">
          <div style="font-size: 32px; font-weight: bold; color: ${template.primaryColor};">
            ${formatCurrency(data.totales?.total || 0, data.totales?.currency || "USD")}
          </div>
        </div>
        ${data.totales?.mostrar_nota_precio_total ? `
        <div style="background: #e0e7ff; color: #1e40af; border-radius: 6px; padding: 10px 16px; margin: 10px auto 0 auto; max-width: 500px; font-size: 14px; border: 1px solid #2563eb; text-align: center;">
          <strong>Nota:</strong> El precio total no incluye los vuelos. Si la tarifa no está discriminada en la cotización, consúltela con su agente.
        </div>
        ` : ""}
      </div>
      ` : ""}
      
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
      
      <div class="footer">
        <div style="margin-bottom: 15px;">
          ${template.agencyAddress ? `<div class="footer-item"><span class="footer-label">Dirección:</span>${template.agencyAddress}</div>` : ""}
          ${template.agencyPhone ? `<div class="footer-item"><span class="footer-label">Teléfono:</span>${template.agencyPhone}</div>` : ""}
          ${template.agencyEmail ? `<div class="footer-item"><span class="footer-label">Email:</span>${template.agencyEmail}</div>` : ""}
        </div>
        <p>Generado automáticamente el ${new Date().toLocaleDateString("es-ES")}</p>
      </div>
      
      <script>
        function downloadAsFile() {
          const element = document.createElement('a');
          const file = new Blob([document.documentElement.outerHTML], {type: 'text/html'});
          element.href = URL.createObjectURL(file);
          element.download = 'cotizacion-' + new Date().toISOString().split('T')[0] + '.html';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
        }
      </script>
    </body>
    </html>
  `
}
